-- Create branches table
CREATE TABLE IF NOT EXISTS public.branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  address TEXT,
  city TEXT,
  state TEXT,
  pincode TEXT,
  phone TEXT,
  email TEXT,
  manager_name TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on branches
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;

-- RLS policies for branches - Allow unauthenticated users to view branches for signup
CREATE POLICY "Anyone can view branches" ON public.branches
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage branches" ON public.branches
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Add updated_at trigger for branches
CREATE TRIGGER branches_updated_at BEFORE UPDATE ON public.branches 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Add branch_id to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL;

-- Add branch_id to loans table
ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL;

-- Create index for better query performance
CREATE INDEX idx_profiles_branch_id ON public.profiles(branch_id);
CREATE INDEX idx_loans_branch_id ON public.loans(branch_id);

-- Update RLS policies for profiles to filter by branch
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
CREATE POLICY "Users can view profiles based on branch" ON public.profiles
  FOR SELECT TO authenticated USING (
    public.is_admin() OR 
    branch_id = (SELECT branch_id FROM public.profiles WHERE id = auth.uid()) OR
    branch_id IS NULL
  );

-- Update RLS policies for loans to filter by branch
DROP POLICY IF EXISTS "Users can view loans based on role" ON public.loans;
CREATE POLICY "Users can view loans based on role and branch" ON public.loans
  FOR SELECT TO authenticated USING (
    public.is_admin()
    OR (
      public.is_manager_or_above() AND 
      branch_id = (SELECT branch_id FROM public.profiles WHERE id = auth.uid())
    )
    OR created_by = auth.uid()
    OR manager_id = auth.uid()
    OR (
      branch_id = (SELECT branch_id FROM public.profiles WHERE id = auth.uid()) AND
      EXISTS (
        SELECT 1 FROM public.user_roles ur
        WHERE ur.user_id = auth.uid() AND ur.role IN ('broker', 'bank', 'employee')
      )
    )
  );

-- Update loan insert policy to auto-assign branch
DROP POLICY IF EXISTS "Employees and above can create loans" ON public.loans;
CREATE POLICY "Employees and above can create loans" ON public.loans
  FOR INSERT TO authenticated WITH CHECK (
    auth.uid() IS NOT NULL AND 
    created_by = auth.uid() AND
    (branch_id = (SELECT branch_id FROM public.profiles WHERE id = auth.uid()) OR public.is_admin())
  );

-- Function to auto-assign branch_id on loan creation
CREATE OR REPLACE FUNCTION public.auto_assign_branch()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.branch_id IS NULL THEN
    NEW.branch_id := (SELECT branch_id FROM public.profiles WHERE id = auth.uid());
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_loan_branch_id
  BEFORE INSERT ON public.loans
  FOR EACH ROW EXECUTE FUNCTION public.auto_assign_branch();

-- Insert default branches
INSERT INTO public.branches (name, code, city, state, is_active) VALUES
  ('Jaipur', 'JPR', 'Jaipur', 'Rajasthan', true),
  ('Bikaner', 'BKN', 'Bikaner', 'Rajasthan', true),
  ('Sri Ganganagar', 'SGN', 'Sri Ganganagar', 'Rajasthan', true),
  ('Hanumangarh', 'HMH', 'Hanumangarh', 'Rajasthan', true),
  ('Lunkaransar', 'LKR', 'Lunkaransar', 'Rajasthan', true),
  ('Merta City', 'MRT', 'Merta City', 'Rajasthan', true);
