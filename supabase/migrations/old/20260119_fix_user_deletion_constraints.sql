-- Fix User Deletion Constraints
-- Date: 2026-01-19

BEGIN;

-- 1. Profiles: Delete profile when auth.user is deleted
ALTER TABLE public.profiles
DROP CONSTRAINT IF EXISTS profiles_id_fkey,
ADD CONSTRAINT profiles_id_fkey
    FOREIGN KEY (id)
    REFERENCES auth.users(id)
    ON DELETE CASCADE;

-- 2. Items: Keep items but clear user reference when auth.user is deleted
ALTER TABLE public.items
DROP CONSTRAINT IF EXISTS items_borrowed_by_fkey,
ADD CONSTRAINT items_borrowed_by_fkey
    FOREIGN KEY (borrowed_by)
    REFERENCES auth.users(id)
    ON DELETE SET NULL;

ALTER TABLE public.items
DROP CONSTRAINT IF EXISTS items_created_by_fkey,
ADD CONSTRAINT items_created_by_fkey
    FOREIGN KEY (created_by)
    REFERENCES auth.users(id)
    ON DELETE SET NULL;

-- 3. Borrow History: Delete history when profile is deleted
ALTER TABLE public.borrow_history
DROP CONSTRAINT IF EXISTS borrow_history_borrower_id_fkey,
ADD CONSTRAINT borrow_history_borrower_id_fkey
    FOREIGN KEY (borrower_id)
    REFERENCES public.profiles(id)
    ON DELETE CASCADE;

-- 4. Admins: Delete admin entry when profile is deleted
ALTER TABLE public.admins
DROP CONSTRAINT IF EXISTS admins_profile_id_fkey,
ADD CONSTRAINT admins_profile_id_fkey
    FOREIGN KEY (profile_id)
    REFERENCES public.profiles(id)
    ON DELETE CASCADE;

-- 5. Item Sharing: Delete sharing record when user is deleted
ALTER TABLE public.item_sharing
DROP CONSTRAINT IF EXISTS item_sharing_shared_with_user_id_fkey,
ADD CONSTRAINT item_sharing_shared_with_user_id_fkey
    FOREIGN KEY (shared_with_user_id)
    REFERENCES public.profiles(id)
    ON DELETE CASCADE;

COMMIT;
