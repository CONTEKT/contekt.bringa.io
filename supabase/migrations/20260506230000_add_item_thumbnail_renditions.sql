-- Add client-generated item detail and thumbnail renditions.
-- Hosted Supabase image transformations stay optional; the default free/local path stores both renditions.

ALTER TABLE public.items
    ADD COLUMN IF NOT EXISTS thumbnail_url text;

ALTER TABLE public.item_versions
    ADD COLUMN IF NOT EXISTS thumbnail_url text;

ALTER TABLE public.item_images
    ADD COLUMN IF NOT EXISTS thumbnail_storage_path text,
    ADD COLUMN IF NOT EXISTS thumbnail_public_url text;

UPDATE public.items
SET thumbnail_url = image_url
WHERE thumbnail_url IS NULL
  AND image_url IS NOT NULL;

UPDATE public.item_versions
SET thumbnail_url = image_url
WHERE thumbnail_url IS NULL
  AND image_url IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_item_images_unique_thumbnail_storage_path
ON public.item_images(storage_bucket, thumbnail_storage_path)
WHERE thumbnail_storage_path IS NOT NULL;

DROP FUNCTION IF EXISTS public.create_item(text, text, text);
DROP FUNCTION IF EXISTS public.update_item(uuid, text, text, text);
DROP FUNCTION IF EXISTS public.apply_item_image_suggestion(uuid, text, text, text, text, text, boolean, text);

CREATE OR REPLACE FUNCTION public.record_item_version(
    item_id_input uuid,
    reason_input text DEFAULT NULL
)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    current_item public.items%ROWTYPE;
    new_version_id uuid;
    next_version_number integer;
    normalized_reason text;
BEGIN
    IF auth.uid() IS NULL THEN
        RETURN NULL;
    END IF;

    SELECT *
    INTO current_item
    FROM public.items
    WHERE id = item_id_input
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN NULL;
    END IF;

    IF NOT public.is_admin() THEN
        IF NOT public.is_validated()
           OR (
               current_item.created_by IS DISTINCT FROM auth.uid()
               AND current_item.owner_profile_id IS DISTINCT FROM auth.uid()
           ) THEN
            RETURN NULL;
        END IF;
    END IF;

    SELECT coalesce(max(version_number), 0) + 1
    INTO next_version_number
    FROM public.item_versions
    WHERE item_id = item_id_input;

    normalized_reason := NULLIF(btrim(coalesce(reason_input, '')), '');

    INSERT INTO public.item_versions (
        item_id,
        version_number,
        name,
        description,
        image_url,
        thumbnail_url,
        owner_kind,
        owner_profile_id,
        owner_label,
        visibility_state,
        actor_id,
        reason
    )
    VALUES (
        current_item.id,
        next_version_number,
        current_item.name,
        current_item.description,
        current_item.image_url,
        current_item.thumbnail_url,
        current_item.owner_kind,
        current_item.owner_profile_id,
        current_item.owner_label,
        current_item.visibility_state,
        auth.uid(),
        normalized_reason
    )
    RETURNING id INTO new_version_id;

    RETURN new_version_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.record_item_version(uuid, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.record_item_version(uuid, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.record_item_version(uuid, text) FROM authenticated;

CREATE OR REPLACE FUNCTION public.create_item(
    name_input text,
    description_input text DEFAULT NULL,
    image_url_input text DEFAULT NULL,
    thumbnail_url_input text DEFAULT NULL,
    image_storage_bucket_input text DEFAULT 'items',
    image_storage_path_input text DEFAULT NULL,
    thumbnail_storage_path_input text DEFAULT NULL
)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    new_item_id uuid;
    new_version_id uuid;
    normalized_name text;
    normalized_image_url text;
    normalized_thumbnail_url text;
    normalized_bucket text;
    normalized_path text;
    normalized_thumbnail_path text;
BEGIN
    IF auth.uid() IS NULL OR NOT public.is_validated() THEN
        RETURN NULL;
    END IF;

    normalized_name := NULLIF(btrim(name_input), '');
    IF normalized_name IS NULL THEN
        RETURN NULL;
    END IF;

    normalized_image_url := NULLIF(btrim(coalesce(image_url_input, '')), '');
    normalized_thumbnail_url := NULLIF(btrim(coalesce(thumbnail_url_input, '')), '');
    normalized_bucket := NULLIF(btrim(coalesce(image_storage_bucket_input, 'items')), '');
    normalized_path := NULLIF(btrim(coalesce(image_storage_path_input, '')), '');
    normalized_thumbnail_path := NULLIF(btrim(coalesce(thumbnail_storage_path_input, '')), '');

    IF normalized_path IS NOT NULL THEN
        IF normalized_image_url IS NULL
           OR normalized_thumbnail_url IS NULL
           OR normalized_bucket IS DISTINCT FROM 'items'
           OR normalized_thumbnail_path IS NULL
           OR normalized_path LIKE '/%' OR normalized_path LIKE '%..%'
           OR normalized_thumbnail_path LIKE '/%' OR normalized_thumbnail_path LIKE '%..%'
           OR normalized_path NOT LIKE auth.uid()::text || '/%/detail.webp'
           OR normalized_thumbnail_path NOT LIKE auth.uid()::text || '/%/thumb.webp'
           OR replace(normalized_path, '/detail.webp', '/thumb.webp') IS DISTINCT FROM normalized_thumbnail_path THEN
            RETURN NULL;
        END IF;
    END IF;

    INSERT INTO public.items (name, description, image_url, thumbnail_url, status, created_by)
    VALUES (
        normalized_name,
        NULLIF(btrim(coalesce(description_input, '')), ''),
        normalized_image_url,
        coalesce(normalized_thumbnail_url, normalized_image_url),
        'inStock',
        auth.uid()
    )
    RETURNING id INTO new_item_id;

    IF normalized_path IS NOT NULL THEN
        INSERT INTO public.item_images (
            item_id,
            storage_bucket,
            storage_path,
            public_url,
            thumbnail_storage_path,
            thumbnail_public_url,
            uploaded_by,
            alt_text,
            is_cover,
            moderation_state,
            deleted_at
        )
        VALUES (
            new_item_id,
            normalized_bucket,
            normalized_path,
            normalized_image_url,
            normalized_thumbnail_path,
            normalized_thumbnail_url,
            auth.uid(),
            normalized_name,
            true,
            'accepted',
            NULL
        );
    END IF;

    SELECT public.record_item_version(new_item_id, 'created') INTO new_version_id;
    IF new_version_id IS NULL THEN
        RAISE EXCEPTION 'could not record created item version';
    END IF;

    RETURN new_item_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_item(
    item_id_input uuid,
    name_input text,
    description_input text DEFAULT NULL,
    image_url_input text DEFAULT NULL,
    thumbnail_url_input text DEFAULT NULL,
    image_storage_bucket_input text DEFAULT 'items',
    image_storage_path_input text DEFAULT NULL,
    thumbnail_storage_path_input text DEFAULT NULL
)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    item_creator uuid;
    new_version_id uuid;
    normalized_name text;
    normalized_image_url text;
    normalized_thumbnail_url text;
    normalized_bucket text;
    normalized_path text;
    normalized_thumbnail_path text;
    updated_count integer;
BEGIN
    IF auth.uid() IS NULL OR NOT public.is_validated() THEN
        RETURN false;
    END IF;

    normalized_name := NULLIF(btrim(name_input), '');
    IF normalized_name IS NULL THEN
        RETURN false;
    END IF;

    normalized_image_url := NULLIF(btrim(coalesce(image_url_input, '')), '');
    normalized_thumbnail_url := NULLIF(btrim(coalesce(thumbnail_url_input, '')), '');
    normalized_bucket := NULLIF(btrim(coalesce(image_storage_bucket_input, 'items')), '');
    normalized_path := NULLIF(btrim(coalesce(image_storage_path_input, '')), '');
    normalized_thumbnail_path := NULLIF(btrim(coalesce(thumbnail_storage_path_input, '')), '');

    IF normalized_path IS NOT NULL THEN
        IF normalized_image_url IS NULL
           OR normalized_thumbnail_url IS NULL
           OR normalized_bucket IS DISTINCT FROM 'items'
           OR normalized_thumbnail_path IS NULL
           OR normalized_path LIKE '/%' OR normalized_path LIKE '%..%'
           OR normalized_thumbnail_path LIKE '/%' OR normalized_thumbnail_path LIKE '%..%'
           OR normalized_path NOT LIKE auth.uid()::text || '/%/detail.webp'
           OR normalized_thumbnail_path NOT LIKE auth.uid()::text || '/%/thumb.webp'
           OR replace(normalized_path, '/detail.webp', '/thumb.webp') IS DISTINCT FROM normalized_thumbnail_path THEN
            RETURN false;
        END IF;
    END IF;

    SELECT created_by
    INTO item_creator
    FROM public.items
    WHERE id = item_id_input;

    IF NOT FOUND THEN
        RETURN false;
    END IF;

    IF NOT public.is_admin() AND item_creator IS DISTINCT FROM auth.uid() THEN
        RETURN false;
    END IF;

    UPDATE public.items
    SET
        name = normalized_name,
        description = NULLIF(btrim(coalesce(description_input, '')), ''),
        image_url = normalized_image_url,
        thumbnail_url = coalesce(normalized_thumbnail_url, normalized_image_url)
    WHERE id = item_id_input;

    GET DIAGNOSTICS updated_count = ROW_COUNT;
    IF updated_count <> 1 THEN
        RETURN false;
    END IF;

    IF normalized_path IS NOT NULL THEN
        UPDATE public.item_images
        SET is_cover = false
        WHERE item_id = item_id_input;

        INSERT INTO public.item_images (
            item_id,
            storage_bucket,
            storage_path,
            public_url,
            thumbnail_storage_path,
            thumbnail_public_url,
            uploaded_by,
            alt_text,
            is_cover,
            moderation_state,
            deleted_at
        )
        VALUES (
            item_id_input,
            normalized_bucket,
            normalized_path,
            normalized_image_url,
            normalized_thumbnail_path,
            normalized_thumbnail_url,
            auth.uid(),
            normalized_name,
            true,
            'accepted',
            NULL
        );
    END IF;

    SELECT public.record_item_version(item_id_input, 'updated') INTO new_version_id;
    IF new_version_id IS NULL THEN
        RAISE EXCEPTION 'could not record updated item version';
    END IF;

    RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION public.restore_item_version(
    version_id_input uuid,
    reason_input text DEFAULT NULL
)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    selected_version public.item_versions%ROWTYPE;
    selected_item_id uuid;
    new_version_id uuid;
    normalized_reason text;
    restore_reason text;
    updated_count integer;
BEGIN
    IF auth.uid() IS NULL OR NOT public.is_admin() THEN
        RETURN false;
    END IF;

    SELECT *
    INTO selected_version
    FROM public.item_versions
    WHERE id = version_id_input;

    IF NOT FOUND THEN
        RETURN false;
    END IF;

    SELECT id
    INTO selected_item_id
    FROM public.items
    WHERE id = selected_version.item_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN false;
    END IF;

    normalized_reason := NULLIF(btrim(coalesce(reason_input, '')), '');
    restore_reason := 'restored from version ' || selected_version.version_number::text;
    IF normalized_reason IS NOT NULL THEN
        restore_reason := restore_reason || ': ' || normalized_reason;
    END IF;

    UPDATE public.items
    SET
        name = selected_version.name,
        description = selected_version.description,
        image_url = selected_version.image_url,
        thumbnail_url = coalesce(selected_version.thumbnail_url, selected_version.image_url),
        owner_kind = selected_version.owner_kind,
        owner_profile_id = selected_version.owner_profile_id,
        owner_label = selected_version.owner_label,
        visibility_state = selected_version.visibility_state,
        visibility_reason = restore_reason,
        hidden_at = CASE WHEN selected_version.visibility_state = 'visible' THEN NULL ELSE now() END,
        hidden_by = CASE WHEN selected_version.visibility_state = 'visible' THEN NULL ELSE auth.uid() END
    WHERE id = selected_item_id;

    GET DIAGNOSTICS updated_count = ROW_COUNT;
    IF updated_count <> 1 THEN
        RETURN false;
    END IF;

    SELECT public.record_item_version(selected_item_id, restore_reason) INTO new_version_id;
    IF new_version_id IS NULL THEN
        RAISE EXCEPTION 'could not record restored item version';
    END IF;

    RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION public.export_my_data()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    export_payload jsonb;
BEGIN
    IF auth.uid() IS NULL THEN
        RETURN NULL;
    END IF;

    SELECT jsonb_build_object(
        'exported_at', now(),
        'profile', (
            SELECT to_jsonb(profile_row)
            FROM (
                SELECT id, email, display_name, display_surname, avatar_url, description, profile_valid, invited_by_code, created_at, updated_at
                FROM public.profiles
                WHERE id = auth.uid()
            ) AS profile_row
        ),
        'created_items', coalesce((
            SELECT jsonb_agg(to_jsonb(item_row) ORDER BY item_row.created_at DESC)
            FROM (
                SELECT id, created_at, name, description, image_url, thumbnail_url, status, owner_kind, owner_profile_id, owner_label, visibility_state, visibility_reason, hidden_at, deleted_at, handoff_policy
                FROM public.items
                WHERE created_by = auth.uid()
            ) AS item_row
        ), '[]'::jsonb),
        'borrowed_items', coalesce((
            SELECT jsonb_agg(to_jsonb(item_row) ORDER BY item_row.created_at DESC)
            FROM (
                SELECT id, created_at, name, description, image_url, thumbnail_url, status, owner_kind, owner_profile_id, owner_label, visibility_state, handoff_policy
                FROM public.items
                WHERE borrowed_by = auth.uid()
            ) AS item_row
        ), '[]'::jsonb),
        'borrow_history', coalesce((
            SELECT jsonb_agg(to_jsonb(history_row) ORDER BY history_row.borrowed_at DESC)
            FROM (
                SELECT id, item_id, borrowed_at, returned_at, notes, created_at
                FROM public.borrow_history
                WHERE borrower_id = auth.uid()
            ) AS history_row
        ), '[]'::jsonb),
        'account_deletion_requests', coalesce((
            SELECT jsonb_agg(to_jsonb(request_row) ORDER BY request_row.requested_at DESC)
            FROM (
                SELECT id, status, user_note, requested_at, reviewed_at, completed_at, created_at
                FROM public.account_deletion_requests
                WHERE user_id = auth.uid()
            ) AS request_row
        ), '[]'::jsonb),
        'item_suggestions', coalesce((
            SELECT jsonb_agg(to_jsonb(suggestion_row) ORDER BY suggestion_row.created_at DESC)
            FROM (
                SELECT id, item_id, suggestion_type, suggestion, status, admin_note, reviewed_at, created_at
                FROM public.item_suggestions
                WHERE suggested_by = auth.uid()
            ) AS suggestion_row
        ), '[]'::jsonb),
        'item_flags', coalesce((
            SELECT jsonb_agg(to_jsonb(flag_row) ORDER BY flag_row.created_at DESC)
            FROM (
                SELECT id, item_id, reason, note, status, admin_note, reviewed_at, created_at
                FROM public.item_flags
                WHERE flagged_by = auth.uid()
            ) AS flag_row
        ), '[]'::jsonb)
    )
    INTO export_payload;

    RETURN export_payload;
END;
$$;

CREATE OR REPLACE FUNCTION public.apply_item_suggestion(
    suggestion_id_input uuid,
    name_input text,
    description_input text DEFAULT NULL,
    image_url_input text DEFAULT NULL,
    admin_note_input text DEFAULT NULL
)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    selected_item_id uuid;
    normalized_name text;
    normalized_description text;
    normalized_image_url text;
    normalized_note text;
    new_version_id uuid;
    updated_count integer;
BEGIN
    IF auth.uid() IS NULL OR NOT public.is_admin() THEN
        RETURN false;
    END IF;

    normalized_name := NULLIF(btrim(coalesce(name_input, '')), '');
    IF normalized_name IS NULL THEN
        RETURN false;
    END IF;

    normalized_note := NULLIF(btrim(coalesce(admin_note_input, '')), '');
    IF normalized_note IS NULL OR length(normalized_note) < 3 THEN
        RETURN false;
    END IF;

    normalized_description := NULLIF(btrim(coalesce(description_input, '')), '');
    normalized_image_url := NULLIF(btrim(coalesce(image_url_input, '')), '');

    SELECT item_id
    INTO selected_item_id
    FROM public.item_suggestions
    WHERE id = suggestion_id_input
      AND status = ANY (ARRAY['pending'::text, 'reviewing'::text])
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN false;
    END IF;

    UPDATE public.items
    SET
        name = normalized_name,
        description = normalized_description,
        image_url = normalized_image_url,
        thumbnail_url = normalized_image_url
    WHERE id = selected_item_id;

    GET DIAGNOSTICS updated_count = ROW_COUNT;
    IF updated_count <> 1 THEN
        RETURN false;
    END IF;

    SELECT public.record_item_version(selected_item_id, 'accepted suggestion') INTO new_version_id;
    IF new_version_id IS NULL THEN
        RAISE EXCEPTION 'could not record accepted suggestion item version';
    END IF;

    UPDATE public.item_suggestions
    SET
        status = 'accepted',
        admin_note = normalized_note,
        reviewed_at = now(),
        reviewed_by = auth.uid()
    WHERE id = suggestion_id_input
      AND status = ANY (ARRAY['pending'::text, 'reviewing'::text]);

    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RETURN updated_count = 1;
END;
$$;

CREATE OR REPLACE FUNCTION public.apply_item_image_suggestion(
    suggestion_id_input uuid,
    storage_bucket_input text DEFAULT 'items',
    storage_path_input text DEFAULT NULL,
    public_url_input text DEFAULT NULL,
    caption_input text DEFAULT NULL,
    alt_text_input text DEFAULT NULL,
    is_cover_input boolean DEFAULT false,
    admin_note_input text DEFAULT NULL,
    thumbnail_storage_path_input text DEFAULT NULL,
    thumbnail_public_url_input text DEFAULT NULL
)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
    selected_item_id uuid;
    existing_image_item_id uuid;
    existing_thumbnail_item_id uuid;
    normalized_bucket text;
    normalized_path text;
    normalized_public_url text;
    normalized_thumbnail_path text;
    normalized_thumbnail_public_url text;
    normalized_caption text;
    normalized_alt_text text;
    normalized_note text;
    new_version_id uuid;
    updated_count integer;
BEGIN
    IF auth.uid() IS NULL OR NOT public.is_admin() THEN
        RETURN false;
    END IF;

    normalized_bucket := NULLIF(btrim(coalesce(storage_bucket_input, 'items')), '');
    normalized_path := NULLIF(btrim(coalesce(storage_path_input, '')), '');
    normalized_public_url := NULLIF(btrim(coalesce(public_url_input, '')), '');
    normalized_thumbnail_path := NULLIF(btrim(coalesce(thumbnail_storage_path_input, '')), '');
    normalized_thumbnail_public_url := NULLIF(btrim(coalesce(thumbnail_public_url_input, '')), '');
    normalized_caption := NULLIF(btrim(coalesce(caption_input, '')), '');
    normalized_alt_text := NULLIF(btrim(coalesce(alt_text_input, '')), '');
    normalized_note := NULLIF(btrim(coalesce(admin_note_input, '')), '');

    IF normalized_bucket IS NULL
       OR normalized_path IS NULL
       OR normalized_path LIKE '/%' OR normalized_path LIKE '%..%'
       OR (normalized_thumbnail_path IS NOT NULL AND (normalized_thumbnail_path LIKE '/%' OR normalized_thumbnail_path LIKE '%..%'))
       OR normalized_alt_text IS NULL OR length(normalized_alt_text) < 3
       OR normalized_note IS NULL OR length(normalized_note) < 3 THEN
        RETURN false;
    END IF;

    SELECT item_id
    INTO selected_item_id
    FROM public.item_suggestions
    WHERE id = suggestion_id_input
      AND suggestion_type = 'image'
      AND status = ANY (ARRAY['pending'::text, 'reviewing'::text])
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN false;
    END IF;

    SELECT item_id
    INTO existing_image_item_id
    FROM public.item_images
    WHERE storage_bucket = normalized_bucket
      AND storage_path = normalized_path
    FOR UPDATE;

    IF FOUND AND existing_image_item_id IS DISTINCT FROM selected_item_id THEN
        RETURN false;
    END IF;

    IF normalized_thumbnail_path IS NOT NULL THEN
        SELECT item_id
        INTO existing_thumbnail_item_id
        FROM public.item_images
        WHERE storage_bucket = normalized_bucket
          AND thumbnail_storage_path = normalized_thumbnail_path
        FOR UPDATE;

        IF FOUND AND existing_thumbnail_item_id IS DISTINCT FROM selected_item_id THEN
            RETURN false;
        END IF;
    END IF;

    IF is_cover_input THEN
        UPDATE public.item_images
        SET is_cover = false
        WHERE item_id = selected_item_id;
    END IF;

    INSERT INTO public.item_images (
        item_id,
        storage_bucket,
        storage_path,
        public_url,
        thumbnail_storage_path,
        thumbnail_public_url,
        uploaded_by,
        caption,
        alt_text,
        is_cover,
        moderation_state,
        deleted_at
    )
    VALUES (
        selected_item_id,
        normalized_bucket,
        normalized_path,
        normalized_public_url,
        normalized_thumbnail_path,
        coalesce(normalized_thumbnail_public_url, normalized_public_url),
        auth.uid(),
        normalized_caption,
        normalized_alt_text,
        is_cover_input,
        'accepted',
        NULL
    )
    ON CONFLICT (storage_bucket, storage_path) DO UPDATE
    SET
        item_id = EXCLUDED.item_id,
        public_url = EXCLUDED.public_url,
        thumbnail_storage_path = EXCLUDED.thumbnail_storage_path,
        thumbnail_public_url = EXCLUDED.thumbnail_public_url,
        uploaded_by = EXCLUDED.uploaded_by,
        caption = EXCLUDED.caption,
        alt_text = EXCLUDED.alt_text,
        is_cover = EXCLUDED.is_cover,
        moderation_state = 'accepted',
        deleted_at = NULL;

    IF is_cover_input THEN
        UPDATE public.items
        SET
            image_url = coalesce(normalized_public_url, image_url),
            thumbnail_url = coalesce(normalized_thumbnail_public_url, normalized_public_url, thumbnail_url)
        WHERE id = selected_item_id;
    END IF;

    SELECT public.record_item_version(selected_item_id, 'accepted image suggestion') INTO new_version_id;
    IF new_version_id IS NULL THEN
        RAISE EXCEPTION 'could not record accepted image suggestion item version';
    END IF;

    UPDATE public.item_suggestions
    SET
        status = 'accepted',
        admin_note = normalized_note,
        reviewed_at = now(),
        reviewed_by = auth.uid()
    WHERE id = suggestion_id_input
      AND status = ANY (ARRAY['pending'::text, 'reviewing'::text]);

    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RETURN updated_count = 1;
END;
$$;

DROP POLICY IF EXISTS "Validated users can upload item images" ON storage.objects;
CREATE POLICY "Validated users can upload item images" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
    bucket_id = 'items'
    AND (select public.is_validated())
    AND storage.extension(name) = 'webp'
    AND storage.filename(name) = ANY (ARRAY['detail.webp', 'thumb.webp'])
    AND (storage.foldername(name))[1] = (select auth.uid()::text)
);

DROP POLICY IF EXISTS "Validated users can delete own unreferenced item uploads" ON storage.objects;
CREATE POLICY "Validated users can delete own unreferenced item uploads" ON storage.objects
FOR DELETE TO authenticated
USING (
    bucket_id = 'items'
    AND owner = (select auth.uid())
    AND (storage.foldername(name))[1] = (select auth.uid()::text)
    AND NOT EXISTS (
        SELECT 1
        FROM public.item_images
        WHERE storage_bucket = 'items'
          AND (storage_path = name OR thumbnail_storage_path = name)
    )
);

REVOKE EXECUTE ON FUNCTION public.create_item(text, text, text, text, text, text, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_item(uuid, text, text, text, text, text, text, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.apply_item_suggestion(uuid, text, text, text, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.apply_item_image_suggestion(uuid, text, text, text, text, text, boolean, text, text, text) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.create_item(text, text, text, text, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_item(uuid, text, text, text, text, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.apply_item_suggestion(uuid, text, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.apply_item_image_suggestion(uuid, text, text, text, text, text, boolean, text, text, text) TO authenticated;
