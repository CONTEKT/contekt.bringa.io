-- Prepare user-facing data export and account deletion request flows.
-- Account deletion remains operator-reviewed; this migration does not delete Auth users or Storage objects.

CREATE TABLE IF NOT EXISTS public.account_deletion_requests (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    status text NOT NULL DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'reviewing'::text, 'completed'::text, 'cancelled'::text])),
    user_note text,
    admin_note text,
    requested_at timestamp with time zone DEFAULT now(),
    reviewed_at timestamp with time zone,
    reviewed_by uuid,
    completed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT account_deletion_requests_pkey PRIMARY KEY (id)
);

DO $$
BEGIN
    ALTER TABLE public.account_deletion_requests
        ADD CONSTRAINT account_deletion_requests_user_id_fkey
        FOREIGN KEY (user_id)
        REFERENCES public.profiles(id)
        ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    ALTER TABLE public.account_deletion_requests
        ADD CONSTRAINT account_deletion_requests_reviewed_by_fkey
        FOREIGN KEY (reviewed_by)
        REFERENCES public.profiles(id)
        ON DELETE SET NULL;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_account_deletion_requests_user_id ON public.account_deletion_requests(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_account_deletion_requests_one_pending_per_user ON public.account_deletion_requests(user_id) WHERE status = 'pending';

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
                SELECT id, created_at, name, description, image_url, status, owner_kind, owner_profile_id, owner_label, visibility_state, visibility_reason, hidden_at, deleted_at, handoff_policy
                FROM public.items
                WHERE created_by = auth.uid()
            ) AS item_row
        ), '[]'::jsonb),
        'borrowed_items', coalesce((
            SELECT jsonb_agg(to_jsonb(item_row) ORDER BY item_row.created_at DESC)
            FROM (
                SELECT id, created_at, name, description, image_url, status, owner_kind, owner_profile_id, owner_label, visibility_state, handoff_policy
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
        ), '[]'::jsonb)
    )
    INTO export_payload;

    RETURN export_payload;
END;
$$;

CREATE OR REPLACE FUNCTION public.request_account_deletion(note_input text DEFAULT NULL)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    existing_request_id uuid;
    new_request_id uuid;
    normalized_note text;
BEGIN
    IF auth.uid() IS NULL THEN
        RETURN NULL;
    END IF;

    normalized_note := NULLIF(btrim(coalesce(note_input, '')), '');

    SELECT id
    INTO existing_request_id
    FROM public.account_deletion_requests
    WHERE user_id = auth.uid()
      AND status = 'pending'
    ORDER BY requested_at DESC
    LIMIT 1;

    IF existing_request_id IS NOT NULL THEN
        RETURN existing_request_id;
    END IF;

    INSERT INTO public.account_deletion_requests (user_id, user_note)
    VALUES (auth.uid(), normalized_note)
    RETURNING id INTO new_request_id;

    RETURN new_request_id;
END;
$$;

ALTER TABLE public.account_deletion_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own deletion requests" ON public.account_deletion_requests;
CREATE POLICY "Users can view own deletion requests" ON public.account_deletion_requests FOR SELECT USING (user_id = auth.uid());
DROP POLICY IF EXISTS "Admins can view deletion requests" ON public.account_deletion_requests;
CREATE POLICY "Admins can view deletion requests" ON public.account_deletion_requests FOR SELECT USING (public.is_admin());
DROP POLICY IF EXISTS "No direct deletion request inserts" ON public.account_deletion_requests;
CREATE POLICY "No direct deletion request inserts" ON public.account_deletion_requests FOR INSERT WITH CHECK (false);
DROP POLICY IF EXISTS "No direct deletion request updates" ON public.account_deletion_requests;
CREATE POLICY "No direct deletion request updates" ON public.account_deletion_requests FOR UPDATE USING (false);
DROP POLICY IF EXISTS "No direct deletion request deletes" ON public.account_deletion_requests;
CREATE POLICY "No direct deletion request deletes" ON public.account_deletion_requests FOR DELETE USING (false);
