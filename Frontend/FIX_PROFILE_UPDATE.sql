-- Fix profiles UPDATE policy to allow admins to update any profile
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

CREATE POLICY "Users can update profiles" ON public.profiles
  FOR UPDATE TO authenticated USING (
    id = auth.uid() OR public.is_admin()
  );
