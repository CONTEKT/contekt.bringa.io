CREATE OR REPLACE FUNCTION public.generate_invite_code()
RETURNS text AS $$
DECLARE
    chars text := 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    result text := 'BRINGA-';
    i integer;
BEGIN
    FOR i IN 1..8 LOOP
        result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
    END LOOP;
    RETURN result;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.set_admin_invite_code()
RETURNS trigger AS $$
BEGIN
    IF NEW.invite_code IS NULL OR NEW.invite_code = 'default' THEN
        NEW.invite_code := public.generate_invite_code();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_admin_invite_code ON public.admins;
CREATE TRIGGER tr_admin_invite_code
    BEFORE INSERT ON public.admins
    FOR EACH ROW
    EXECUTE FUNCTION public.set_admin_invite_code();
