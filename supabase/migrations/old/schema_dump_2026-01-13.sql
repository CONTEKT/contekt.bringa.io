-- Custom Dump via Antigravity
-- Date: 2026-01-13

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
CREATE EXTENSION IF NOT EXISTS "pg_net" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "pg_crypto" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "supabase_functions" WITH SCHEMA "extensions";

-- STORAGE BUCKETS
INSERT INTO storage.buckets (id, name, public) VALUES ('contakt-demo-bucket', 'contakt-demo-bucket', false) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('items', 'items', true) ON CONFLICT (id) DO NOTHING;

-- FUNCTIONS
CREATE OR REPLACE FUNCTION public.update_updated_at() RETURNS trigger LANGUAGE plpgsql AS $function$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $function$;
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $function$ begin insert into public.profiles (id, email, display_name, avatar_url) values ( new.id, new.email, new.raw_user_meta_data->>'display_name', new.raw_user_meta_data->>'avatar_url' ); return new; end; $function$;

-- TABLES

-- Table: profiles
CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid NOT NULL CONSTRAINT profiles_id_fkey REFERENCES auth.users(id),
    email text,
    display_name text,
    avatar_url text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    description text,
    display_surname text DEFAULT ''::text,
    profile_valid boolean DEFAULT false,
    invited_by_code text,
    CONSTRAINT profiles_pkey PRIMARY KEY (id)
);
COMMENT ON COLUMN public.profiles.profile_valid IS 'Indicates if user has entered a valid invite code';
COMMENT ON COLUMN public.profiles.invited_by_code IS 'The invite code used by this user to gain access';

-- Table: items
CREATE TABLE IF NOT EXISTS public.items (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    name text,
    description text,
    image_url text,
    borrowed_by uuid CONSTRAINT items_borrowed_by_fkey REFERENCES auth.users(id),
    created_by uuid CONSTRAINT items_created_by_fkey REFERENCES auth.users(id),
    status text DEFAULT 'inStock'::text CHECK (status = ANY (ARRAY['inStock'::text, 'borrowed'::text])),
    CONSTRAINT items_pkey PRIMARY KEY (id)
);

-- Table: borrow_history
CREATE TABLE IF NOT EXISTS public.borrow_history (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    item_id uuid NOT NULL, -- FK added below
    borrower_id uuid NOT NULL CONSTRAINT borrow_history_borrower_id_fkey REFERENCES public.profiles(id),
    borrowed_at timestamp with time zone DEFAULT now(),
    returned_at timestamp with time zone,
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT borrow_history_pkey PRIMARY KEY (id)
);

-- Table: admins
CREATE TABLE IF NOT EXISTS public.admins (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    invite_code text DEFAULT 'BRINGA2024'::text,
    profile_id uuid CONSTRAINT admins_profile_id_fkey REFERENCES public.profiles(id),
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT admins_pkey PRIMARY KEY (id),
    CONSTRAINT admins_profile_id_unique UNIQUE (profile_id)
);
COMMENT ON COLUMN public.admins.invite_code IS 'Unique invite code for this admin to share with users';

-- Table: item_sharing
CREATE TABLE IF NOT EXISTS public.item_sharing (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    item_id uuid NOT NULL, -- FK added below
    shared_with_user_id uuid NOT NULL CONSTRAINT item_sharing_shared_with_user_id_fkey REFERENCES public.profiles(id),
    shared_at timestamp with time zone DEFAULT now(),
    permission text DEFAULT 'view'::text,
    CONSTRAINT item_sharing_pkey PRIMARY KEY (id)
);

-- RLS POLICIES (Assuming enabled based on list_tables output)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.borrow_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
-- items table RLS is DISABLED in list_tables output (rls_enabled: false)

-- TRIGGERS

DROP TRIGGER IF EXISTS profiles_updated_at_trigger ON public.profiles;
CREATE TRIGGER profiles_updated_at_trigger BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION handle_new_user();

DROP TRIGGER IF EXISTS notify_item_bot_telegram ON public.items;
CREATE TRIGGER notify_item_bot_telegram AFTER INSERT OR UPDATE ON public.items FOR EACH ROW EXECUTE FUNCTION supabase_functions.http_request('https://rfeglkaexvwcytlifqte.supabase.co/functions/v1/notifiy-telegram', 'POST', '{"Content-type":"application/json","Authorization":"Bearer REDACTED_SUPABASE_SERVICE_ROLE_JWT"}', '{}', '5000');

DROP TRIGGER IF EXISTS notify_user_bot_telegram ON public.profiles;
CREATE TRIGGER notify_user_bot_telegram AFTER INSERT OR UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION supabase_functions.http_request('https://rfeglkaexvwcytlifqte.supabase.co/functions/v1/notifiy-telegram-user', 'POST', '{"Content-type":"application/json","Authorization":"Bearer REDACTED_SUPABASE_SERVICE_ROLE_JWT"}', '{}', '5000');
