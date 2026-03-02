-- Fix loans INSERT policy to allow all authenticated users to create loans
DROP POLICY IF EXISTS "Employees and above can create loans" ON public.loans;

CREATE POLICY "Employees and above can create loans" ON public.loans
  FOR INSERT TO authenticated WITH CHECK (
    auth.uid() IS NOT NULL AND created_by = auth.uid()
  );

-- Also simplify UPDATE policy
DROP POLICY IF EXISTS "Loan owner and managers can update" ON public.loans;

CREATE POLICY "Loan owner and managers can update" ON public.loans
  FOR UPDATE TO authenticated USING (
    public.is_admin() OR 
    public.is_manager_or_above() OR 
    created_by = auth.uid()
  );
