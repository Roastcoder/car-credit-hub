-- ============================================================
-- EMERGENCY FIX - ALLOW SUPER ADMIN TO SEE EVERYTHING
-- ============================================================

-- Fix 1: Simplify profiles RLS policy
DROP POLICY IF EXISTS "Users can view profiles based on branch" ON public.profiles;
CREATE POLICY "Users can view all profiles" ON public.profiles
  FOR SELECT TO authenticated USING (true);

-- Fix 2: Ensure user_roles can be viewed by everyone authenticated
DROP POLICY IF EXISTS "Users can view their own role" ON public.user_roles;
CREATE POLICY "Users can view all roles" ON public.user_roles
  FOR SELECT TO authenticated USING (true);

-- Fix 3: Allow users to insert their own role
DROP POLICY IF EXISTS "Users can insert their own role" ON public.user_roles;
CREATE POLICY "Users can insert their own role" ON public.user_roles
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- Fix 4: Simplify loans RLS for admins
DROP POLICY IF EXISTS "Users can view loans based on role and branch" ON public.loans;
CREATE POLICY "Users can view loans" ON public.loans
  FOR SELECT TO authenticated USING (
    public.is_admin() OR
    created_by = auth.uid() OR
    manager_id = auth.uid() OR
    (branch_id = (SELECT branch_id FROM public.profiles WHERE id = auth.uid()) AND branch_id IS NOT NULL)
  );

-- Verify: Check what the super admin can see
SELECT 
  'Profiles' as table_name,
  COUNT(*) as count
FROM profiles
UNION ALL
SELECT 
  'User Roles' as table_name,
  COUNT(*) as count
FROM user_roles
UNION ALL
SELECT 
  'Loans' as table_name,
  COUNT(*) as count
FROM loans
UNION ALL
SELECT 
  'Branches' as table_name,
  COUNT(*) as count
FROM branches;
