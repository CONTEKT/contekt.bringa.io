CREATE OR REPLACE FUNCTION public.delete_item(item_id_input uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    item_creator uuid;
    deleted_count integer;
BEGIN
    IF auth.uid() IS NULL OR NOT public.is_validated() THEN
        RETURN false;
    END IF;

    SELECT created_by
    INTO item_creator
    FROM public.items
    WHERE id = item_id_input;

    IF NOT FOUND THEN
        RETURN false;
    END IF;

    IF NOT public.is_admin() AND item_creator IS DISTINCT FROM auth.uid() THEN
        RETURN false;
    END IF;

    DELETE FROM public.items
    WHERE id = item_id_input;

    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count = 1;
END;
$$;

DROP POLICY IF EXISTS "Admins and creators can delete items" ON public.items;
DROP POLICY IF EXISTS "No direct item deletes" ON public.items;
CREATE POLICY "No direct item deletes" ON public.items FOR DELETE USING (false);
