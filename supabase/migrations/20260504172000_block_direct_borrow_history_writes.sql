ALTER TABLE public.borrow_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can read borrow history" ON public.borrow_history;
DROP POLICY IF EXISTS "borrow_history_select_all" ON public.borrow_history;
DROP POLICY IF EXISTS "Admins can view history" ON public.borrow_history;
CREATE POLICY "Admins can view history" ON public.borrow_history FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "Authenticated users can insert borrow history" ON public.borrow_history;
DROP POLICY IF EXISTS "Validated users can insert history" ON public.borrow_history;
DROP POLICY IF EXISTS "borrow_history_insert_authenticated" ON public.borrow_history;
DROP POLICY IF EXISTS "No direct history inserts" ON public.borrow_history;
CREATE POLICY "No direct history inserts" ON public.borrow_history FOR INSERT WITH CHECK (false);
