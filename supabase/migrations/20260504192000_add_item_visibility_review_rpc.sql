-- Add admin-only item visibility review and tighten item read visibility.

CREATE OR REPLACE FUNCTION public.set_item_visibility(
    item_id_input uuid,
    visibility_state_input text,
    reason_input text DEFAULT NULL
)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    normalized_state text;
    normalized_reason text;
    version_reason text;
    new_version_id uuid;
    updated_count integer;
BEGIN
    IF auth.uid() IS NULL OR NOT public.is_admin() THEN
        RETURN false;
    END IF;

    normalized_state := lower(NULLIF(btrim(coalesce(visibility_state_input, '')), ''));
    IF normalized_state IS NULL OR normalized_state <> ALL (ARRAY['visible', 'user_hidden', 'admin_hidden', 'pending_visible', 'deleted_user_hidden', 'archived']) THEN
        RETURN false;
    END IF;

    normalized_reason := NULLIF(btrim(coalesce(reason_input, '')), '');
    IF normalized_reason IS NULL THEN
        RETURN false;
    END IF;

    version_reason := 'visibility set to ' || normalized_state || ': ' || normalized_reason;

    UPDATE public.items
    SET
        visibility_state = normalized_state,
        visibility_reason = normalized_reason,
        hidden_at = CASE WHEN normalized_state = 'visible' THEN NULL ELSE now() END,
        hidden_by = CASE WHEN normalized_state = 'visible' THEN NULL ELSE auth.uid() END,
        deleted_at = CASE
            WHEN normalized_state = 'deleted_user_hidden' THEN coalesce(deleted_at, now())
            WHEN normalized_state = 'visible' THEN NULL
            ELSE deleted_at
        END,
        deleted_by = CASE
            WHEN normalized_state = 'deleted_user_hidden' THEN coalesce(deleted_by, auth.uid())
            WHEN normalized_state = 'visible' THEN NULL
            ELSE deleted_by
        END
    WHERE id = item_id_input;

    GET DIAGNOSTICS updated_count = ROW_COUNT;
    IF updated_count <> 1 THEN
        RETURN false;
    END IF;

    SELECT public.record_item_version(item_id_input, version_reason) INTO new_version_id;
    IF new_version_id IS NULL THEN
        RAISE EXCEPTION 'could not record item visibility version';
    END IF;

    RETURN true;
END;
$$;

DROP POLICY IF EXISTS "Validated users can view items" ON public.items;
CREATE POLICY "Validated users can view items" ON public.items FOR SELECT USING (
    public.is_admin() OR (
        public.is_validated() AND (
            visibility_state = 'visible'
            OR created_by = auth.uid()
            OR borrowed_by = auth.uid()
            OR owner_profile_id = auth.uid()
        )
    )
);
