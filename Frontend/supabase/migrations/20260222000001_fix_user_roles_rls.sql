-- Allow users to insert their own role during signup
DROP POLICY IF EXISTS "Users can insert their own role" ON public.user_roles;
CREATE POLICY "Users can insert their own role" ON public.user_roles
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
