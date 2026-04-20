-- RLS Improvements Migration
-- Date: 2026-01-19

-- 1. Create Helper Functions for RLS
CREATE OR REPLACE FUNCTION public.is_validated()
RETURNS boolean AS $$
    SELECT coalesce(
        (SELECT profile_valid FROM public.profiles WHERE id = auth.uid()),
        false
    );
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.admins WHERE profile_id = auth.uid()
    );
$$ LANGUAGE sql SECURITY DEFINER;

-- 2. Secure profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = id OR public.is_admin());

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = id);

-- 3. Secure items table
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Validated users can view items" ON public.items;
CREATE POLICY "Validated users can view items"
ON public.items FOR SELECT
USING (public.is_validated());

DROP POLICY IF EXISTS "Validated users can insert items" ON public.items;
CREATE POLICY "Validated users can insert items"
ON public.items FOR INSERT
WITH CHECK (public.is_validated());

DROP POLICY IF EXISTS "Admins and creators can update items" ON public.items;
CREATE POLICY "Admins and creators can update items"
ON public.items FOR UPDATE
USING (public.is_admin() OR created_by = auth.uid() OR public.is_validated());
-- Note: We allow all validated users to update for now to support borrowing/returning logic.
-- To restrict specific fields, one would typically use a check on the OLD/NEW transition or a separate function.

-- 4. Secure borrow_history table
ALTER TABLE public.borrow_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view history" ON public.borrow_history;
CREATE POLICY "Admins can view history"
ON public.borrow_history FOR SELECT
USING (public.is_admin());

DROP POLICY IF EXISTS "Validated users can insert history" ON public.borrow_history;
CREATE POLICY "Validated users can insert history"
ON public.borrow_history FOR INSERT
WITH CHECK (public.is_validated());

-- 5. Secure admins table
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can select invite codes for verification" ON public.admins;
CREATE POLICY "Anyone can select invite codes for verification"
ON public.admins FOR SELECT
USING (true); -- Required for the /invite page to check if a code exists

DROP POLICY IF EXISTS "Admins have full access to admins table" ON public.admins;
CREATE POLICY "Admins have full access to admins table"
ON public.admins FOR ALL
USING (public.is_admin());
