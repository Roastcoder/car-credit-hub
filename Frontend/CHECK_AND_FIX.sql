-- ============================================================
-- COMPREHENSIVE FIX FOR USER MANAGEMENT
-- ============================================================

-- Step 1: Check current RLS policies
SELECT schemaname, tablename, policyname, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('profiles', 'user_roles')
ORDER BY tablename, policyname;

-- Step 2: Fix user_roles RLS - Allow users to insert their own role during signup
DROP POLICY IF EXISTS "Users can insert their own role" ON public.user_roles;
CREATE POLICY "Users can insert their own role" ON public.user_roles
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- Step 3: Fix profiles RLS - Allow admins to see all users
DROP POLICY IF EXISTS "Users can view profiles based on branch" ON public.profiles;
CREATE POLICY "Users can view profiles based on branch" ON public.profiles
  FOR SELECT TO authenticated USING (
    public.is_admin() OR 
    id = auth.uid() OR
    branch_id = (SELECT branch_id FROM public.profiles WHERE id = auth.uid()) OR
    branch_id IS NULL OR
    public.is_manager_or_above()
  );

-- Step 4: Verify the fix - Check if policies are updated
SELECT schemaname, tablename, policyname, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('profiles', 'user_roles')
ORDER BY tablename, policyname;

-- Step 5: Check user data
SELECT 
  p.id,
  p.email,
  p.full_name,
  ur.role,
  b.name as branch_name
FROM profiles p
LEFT JOIN user_roles ur ON ur.user_id = p.id
LEFT JOIN branches b ON b.id = p.branch_id
ORDER BY p.created_at DESC;
