CREATE OR REPLACE FUNCTION public.promote_admin(profile_id_input uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
    IF auth.uid() IS NULL OR NOT public.is_admin() THEN
        RETURN false;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = profile_id_input) THEN
        RETURN false;
    END IF;

    INSERT INTO public.admins (profile_id)
    VALUES (profile_id_input)
    ON CONFLICT (profile_id) DO NOTHING;

    RETURN EXISTS (SELECT 1 FROM public.admins WHERE profile_id = profile_id_input);
END;
$$;

CREATE OR REPLACE FUNCTION public.demote_admin(profile_id_input uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    deleted_count integer;
BEGIN
    IF auth.uid() IS NULL OR NOT public.is_admin() THEN
        RETURN false;
    END IF;

    IF profile_id_input = auth.uid() THEN
        RETURN false;
    END IF;

    DELETE FROM public.admins
    WHERE profile_id = profile_id_input;

    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count = 1;
END;
$$;
