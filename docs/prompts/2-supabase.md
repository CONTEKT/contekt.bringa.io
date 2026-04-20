---
status: open
---

# Supabase RLS Fix - Summary & Next Steps

## Status Update (2026-01-19)

We identified a security gap where the `items` table allowed any authenticated user (OAuth-only) to interact with items, bypassing the invite code system (`profile_valid`).

### Changes Made (Local)
1.  **New Migration**: Created `supabase/migrations/20260119_rls_improvements.sql`.
2.  **Schema Sync**: Updated `supabase/schema.sql` to include the new security model.
3.  **Security Logic**: 
    *   Added `is_validated()`: Checks if user has a valid invite code.
    *   Added `is_admin()`: Checks if user is in the `admins` table.
    *   Restricted `items` visibility/insertion to validated users.
    *   Restricted `borrow_history` visibility to **Admins only**.
    *   Restricted `profiles` visibility to own profile or Admins.

---

## Next Steps (Action Required)

Since the project is not linked to Supabase CLI locally (and no Docker daemon), **Manual Upload** is the required path.

### 1. Execute SQL in Supabase Dashboard
1.  Go to your [Supabase SQL Editor](https://supabase.com/dashboard/project/rfeglkaexvwcytlifqte/sql/new).
2.  Copy and paste the following SQL exactly:

```sql
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
USING (true);

DROP POLICY IF EXISTS "Admins have full access to admins table" ON public.admins;
CREATE POLICY "Admins have full access to admins table"
ON public.admins FOR ALL
USING (public.is_admin());
```

3.  Click **Run**.

### 2. Verify
- Log in with a user that has NO invite code.
- Verify they CANNOT view items.
- Log in with an admin/validated user.
- Verify they CAN view items.

