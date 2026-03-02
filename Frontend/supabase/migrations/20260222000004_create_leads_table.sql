-- Create leads table
CREATE TABLE IF NOT EXISTS public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name TEXT NOT NULL,
  address TEXT,
  tehsil TEXT,
  district TEXT,
  pin_code TEXT,
  phone_no TEXT NOT NULL,
  pan_number TEXT,
  aadhar_number TEXT,
  vehicle_no TEXT,
  loan_amount_required DECIMAL(14,2),
  irr_requested DECIMAL(5,2),
  sourcing_person_name TEXT,
  manager_name TEXT,
  our_branch TEXT,
  financier_name TEXT,
  branch_id UUID REFERENCES public.branches(id),
  created_by UUID REFERENCES public.profiles(id),
  converted_to_loan BOOLEAN DEFAULT false,
  loan_id TEXT REFERENCES public.loans(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view leads" ON public.leads
  FOR SELECT TO authenticated USING (
    public.is_admin() OR
    created_by = auth.uid() OR
    (branch_id = (SELECT branch_id FROM public.profiles WHERE id = auth.uid()) AND branch_id IS NOT NULL)
  );

CREATE POLICY "Users can create leads" ON public.leads
  FOR INSERT TO authenticated WITH CHECK (
    auth.uid() IS NOT NULL AND created_by = auth.uid()
  );

CREATE POLICY "Users can update their leads" ON public.leads
  FOR UPDATE TO authenticated USING (
    public.is_admin() OR created_by = auth.uid()
  );

CREATE POLICY "Admins can delete leads" ON public.leads
  FOR DELETE TO authenticated USING (public.is_admin());

-- Trigger for updated_at
CREATE TRIGGER leads_updated_at BEFORE UPDATE ON public.leads 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Index for performance
CREATE INDEX idx_leads_phone ON public.leads(phone_no);
CREATE INDEX idx_leads_branch ON public.leads(branch_id);
CREATE INDEX idx_leads_created_by ON public.leads(created_by);
