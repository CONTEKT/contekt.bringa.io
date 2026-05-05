-- Current State Migration Dump via Antigravity
-- Date: 2026-04-02
-- Project: historical upstream schema source

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

-- EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "pg_net" WITH SCHEMA "extensions";
CREATE SCHEMA IF NOT EXISTS "supabase_functions";
CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";
CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";

-- STORAGE BUCKETS
INSERT INTO storage.buckets (id, name, public) VALUES ('contakt-demo-bucket', 'contakt-demo-bucket', false) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('items', 'items', true) ON CONFLICT (id) DO NOTHING;

-- TABLES

-- Table: profiles
CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid NOT NULL PRIMARY KEY CONSTRAINT profiles_id_fkey REFERENCES auth.users(id),
    email text,
    display_name text,
    avatar_url text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    description text,
    display_surname text DEFAULT ''::text,
    profile_valid boolean DEFAULT false,
    invited_by_code text
);
COMMENT ON COLUMN public.profiles.profile_valid IS 'Indicates if user has entered a valid invite code';
COMMENT ON COLUMN public.profiles.invited_by_code IS 'The invite code used by this user to gain access';

-- Table: items
CREATE TABLE IF NOT EXISTS public.items (
    id uuid NOT NULL DEFAULT extensions.gen_random_uuid() PRIMARY KEY,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    name text,
    description text,
    image_url text,
    borrowed_by uuid CONSTRAINT items_borrowed_by_fkey REFERENCES auth.users(id),
    created_by uuid CONSTRAINT items_created_by_fkey REFERENCES auth.users(id),
    status text DEFAULT 'inStock'::text CHECK (status = ANY (ARRAY['inStock'::text, 'borrowed'::text]))
);

-- Table: borrow_history
CREATE TABLE IF NOT EXISTS public.borrow_history (
    id uuid NOT NULL DEFAULT extensions.gen_random_uuid() PRIMARY KEY,
    item_id uuid NOT NULL CONSTRAINT borrow_history_item_id_fkey REFERENCES public.items(id),
    borrower_id uuid NOT NULL CONSTRAINT borrow_history_borrower_id_fkey REFERENCES public.profiles(id),
    borrowed_at timestamp with time zone DEFAULT now(),
    returned_at timestamp with time zone,
    notes text,
    created_at timestamp with time zone DEFAULT now()
);

-- Table: admins
CREATE TABLE IF NOT EXISTS public.admins (
    id uuid NOT NULL DEFAULT extensions.gen_random_uuid() PRIMARY KEY,
    invite_code text DEFAULT 'BRINGA2024'::text,
    profile_id uuid UNIQUE CONSTRAINT admins_profile_id_fkey REFERENCES public.profiles(id),
    created_at timestamp with time zone DEFAULT now()
);
COMMENT ON COLUMN public.admins.invite_code IS 'Unique invite code for this admin to share with users';

-- Table: item_sharing
CREATE TABLE IF NOT EXISTS public.item_sharing (
    id uuid NOT NULL DEFAULT extensions.gen_random_uuid() PRIMARY KEY,
    item_id uuid NOT NULL CONSTRAINT item_sharing_item_id_fkey REFERENCES public.items(id),
    shared_with_user_id uuid NOT NULL CONSTRAINT item_sharing_shared_with_user_id_fkey REFERENCES public.profiles(id),
    shared_at timestamp with time zone DEFAULT now(),
    permission text DEFAULT 'view'::text CHECK (permission = ANY (ARRAY['view'::text, 'borrow'::text]))
);

-- FUNCTIONS

-- Function: update_updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- Function: is_validated
CREATE OR REPLACE FUNCTION public.is_validated()
 RETURNS boolean
 LANGUAGE sql
 SECURITY DEFINER
AS $function$
    SELECT coalesce(
        (SELECT profile_valid FROM public.profiles WHERE id = auth.uid()),
        false
    );
$function$;

-- Function: is_admin
CREATE OR REPLACE FUNCTION public.is_admin()
 RETURNS boolean
 LANGUAGE sql
 SECURITY DEFINER
AS $function$
    SELECT EXISTS (
        SELECT 1 FROM public.admins WHERE profile_id = auth.uid()
    );
$function$;

-- Function: handle_new_user
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
begin
  insert into public.profiles (id, email, display_name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'display_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$function$;

-- RLS POLICIES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.borrow_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.item_sharing ENABLE ROW LEVEL SECURITY;

-- Policies for profiles
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING ((auth.uid() = id) OR public.is_admin());
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_select_all" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Policies for items
CREATE POLICY "Admins and creators can delete items" ON public.items FOR DELETE USING (public.is_admin() OR (created_by = auth.uid()));
CREATE POLICY "Admins and creators can update items" ON public.items FOR UPDATE USING (public.is_admin() OR (created_by = auth.uid()) OR public.is_validated());
CREATE POLICY "Validated users can insert items" ON public.items FOR INSERT WITH CHECK (public.is_validated());
CREATE POLICY "Validated users can view items" ON public.items FOR SELECT USING (public.is_validated());

-- Policies for admins
CREATE POLICY "Admins have full access to admins table" ON public.admins FOR ALL USING (public.is_admin());
CREATE POLICY "Allow authenticated users to read invite codes" ON public.admins FOR SELECT TO authenticated USING (true);
CREATE POLICY "Anyone can select invite codes for verification" ON public.admins FOR SELECT USING (true);
CREATE POLICY "Authenticated users can check admin status" ON public.admins FOR SELECT USING (((auth.role() = 'authenticated'::text) AND (profile_id = auth.uid())));

-- Policies for borrow_history
CREATE POLICY "Admins can read borrow history" ON public.borrow_history FOR SELECT USING (auth.uid() IN ( SELECT admins.profile_id FROM public.admins));
CREATE POLICY "Admins can view history" ON public.borrow_history FOR SELECT USING (public.is_admin());
CREATE POLICY "Authenticated users can insert borrow history" ON public.borrow_history FOR INSERT WITH CHECK (auth.role() = 'authenticated'::text);
CREATE POLICY "Validated users can insert history" ON public.borrow_history FOR INSERT WITH CHECK (public.is_validated());
CREATE POLICY "borrow_history_insert_authenticated" ON public.borrow_history FOR INSERT WITH CHECK (auth.uid() = borrower_id);
CREATE POLICY "borrow_history_select_all" ON public.borrow_history FOR SELECT USING (true);

-- Policies for item_sharing
CREATE POLICY "item_sharing_select_all" ON public.item_sharing FOR SELECT USING (true);

-- Policies for storage.objects
CREATE POLICY "Authenticated users can upload" ON storage.objects FOR INSERT WITH CHECK (((bucket_id = 'items'::text) AND (auth.role() = 'authenticated'::text)));
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'items'::text);

-- TRIGGERS

-- Trigger: update_updated_at on profiles
DROP TRIGGER IF EXISTS profiles_updated_at_trigger ON public.profiles;
CREATE TRIGGER profiles_updated_at_trigger BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Trigger: on_auth_user_created on auth.users
-- Note: This trigger must be created after the public.handle_new_user() function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

