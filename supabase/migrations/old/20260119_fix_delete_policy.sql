-- Fix Delete Policy using direct SQL statements (avoiding migration transaction issues if possible)
-- Date: 2026-01-19

BEGIN;

DROP POLICY IF EXISTS "Admins and creators can delete items" ON public.items;

CREATE POLICY "Admins and creators can delete items"
ON public.items FOR DELETE
USING (public.is_admin() OR created_by = auth.uid());

COMMIT;
