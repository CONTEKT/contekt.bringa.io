-- Migration: Add invite code system
-- This migration adds the invite code functionality to the database

-- 1. Add invite_code column to admins table
ALTER TABLE admins 
ADD COLUMN IF NOT EXISTS invite_code TEXT NOT NULL DEFAULT 'BRINGA2024';

-- 2. Add profile_valid and invited_by_code columns to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS profile_valid BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS invited_by_code TEXT;

-- 3. Set all admins to profile_valid = true
UPDATE profiles
SET profile_valid = true
WHERE id IN (
    SELECT profile_id FROM admins
);

-- 4. Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_profile_valid ON profiles(profile_valid);
CREATE INDEX IF NOT EXISTS idx_admins_invite_code ON admins(invite_code);

-- 5. Add comment for documentation
COMMENT ON COLUMN profiles.profile_valid IS 'Indicates if user has entered a valid invite code';
COMMENT ON COLUMN profiles.invited_by_code IS 'The invite code used by this user to gain access';
COMMENT ON COLUMN admins.invite_code IS 'Unique invite code for this admin to share with users';
