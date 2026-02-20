-- Fix profiles RLS policy to ensure admins can see all users
DROP POLICY IF EXISTS "Users can view profiles based on branch" ON public.profiles;

CREATE POLICY "Users can view profiles based on branch" ON public.profiles
  FOR SELECT TO authenticated USING (
    public.is_admin() OR 
    id = auth.uid() OR
    branch_id = (SELECT branch_id FROM public.profiles WHERE id = auth.uid()) OR
    branch_id IS NULL OR
    public.is_manager_or_above()
  );
