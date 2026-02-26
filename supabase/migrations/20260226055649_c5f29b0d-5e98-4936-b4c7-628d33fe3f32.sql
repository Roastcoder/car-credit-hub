
-- Drop the restrictive policies that block access
DROP POLICY IF EXISTS "Authenticated users can view branches" ON public.branches;
DROP POLICY IF EXISTS "Anyone can view branches" ON public.branches;

-- Create a permissive SELECT policy so everyone (including anonymous/unauthenticated) can view branches
CREATE POLICY "Public can view branches"
  ON public.branches
  FOR SELECT
  TO anon, authenticated
  USING (true);
