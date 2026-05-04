-- Add user-facing item visibility requests.
-- Users can hide their own/owned items or request admin review for visibility.

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

CREATE OR REPLACE FUNCTION public.request_item_visibility(
    item_id_input uuid,
    visibility_state_input text,
    reason_input text DEFAULT NULL
)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    selected_created_by uuid;
    selected_owner_profile_id uuid;
    selected_visibility_state text;
    normalized_state text;
    normalized_reason text;
    version_reason text;
    new_version_id uuid;
    updated_count integer;
BEGIN
    IF auth.uid() IS NULL OR NOT public.is_validated() THEN
        RETURN false;
    END IF;

    normalized_state := lower(NULLIF(btrim(coalesce(visibility_state_input, '')), ''));
    IF normalized_state IS NULL OR normalized_state <> ALL (ARRAY['user_hidden', 'pending_visible']) THEN
        RETURN false;
    END IF;

    normalized_reason := NULLIF(btrim(coalesce(reason_input, '')), '');
    IF normalized_reason IS NULL OR length(normalized_reason) < 3 THEN
        RETURN false;
    END IF;

    SELECT created_by, owner_profile_id, visibility_state
    INTO selected_created_by, selected_owner_profile_id, selected_visibility_state
    FROM public.items
    WHERE id = item_id_input
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN false;
    END IF;

    IF selected_created_by IS DISTINCT FROM auth.uid()
       AND selected_owner_profile_id IS DISTINCT FROM auth.uid() THEN
        RETURN false;
    END IF;

    IF selected_visibility_state = ANY (ARRAY['deleted_user_hidden', 'archived']) THEN
        RETURN false;
    END IF;

    IF normalized_state = 'user_hidden'
       AND selected_visibility_state = 'admin_hidden' THEN
        RETURN false;
    END IF;

    IF normalized_state = 'pending_visible'
       AND selected_visibility_state = 'visible' THEN
        RETURN false;
    END IF;

    version_reason := 'visibility requested as ' || normalized_state || ': ' || normalized_reason;

    UPDATE public.items
    SET
        visibility_state = normalized_state,
        visibility_reason = normalized_reason,
        hidden_at = now(),
        hidden_by = auth.uid()
    WHERE id = item_id_input;

    GET DIAGNOSTICS updated_count = ROW_COUNT;
    IF updated_count <> 1 THEN
        RETURN false;
    END IF;

    SELECT public.record_item_version(item_id_input, version_reason) INTO new_version_id;
    IF new_version_id IS NULL THEN
        RAISE EXCEPTION 'could not record item visibility request version';
    END IF;

    RETURN true;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.request_item_visibility(uuid, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.request_item_visibility(uuid, text, text) TO authenticated;
