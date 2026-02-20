
-- ============================================================
-- MEHAR FINANCE - Complete Database Schema
-- ============================================================

-- 1. ENUM TYPES
CREATE TYPE public.app_role AS ENUM ('super_admin', 'admin', 'manager', 'bank', 'broker', 'employee');
CREATE TYPE public.loan_status AS ENUM ('draft', 'submitted', 'under_review', 'approved', 'rejected', 'disbursed', 'cancelled');
CREATE TYPE public.commission_status AS ENUM ('pending', 'paid', 'on_hold');
CREATE TYPE public.doc_type AS ENUM ('rc_copy', 'insurance', 'income_proof', 'bank_statement', 'nach', 'other');

-- 2. PROFILES TABLE
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. USER ROLES TABLE (separate for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

-- 4. BANKS TABLE
CREATE TABLE public.banks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  contact_person TEXT,
  email TEXT,
  phone TEXT,
  interest_rate DECIMAL(5,2) DEFAULT 9.0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. BROKERS TABLE
CREATE TABLE public.brokers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  area TEXT,
  commission_rate DECIMAL(5,2) DEFAULT 1.5,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. LOANS TABLE
CREATE TABLE public.loans (
  id TEXT PRIMARY KEY,
  applicant_name TEXT NOT NULL,
  mobile TEXT NOT NULL,
  pan TEXT,
  aadhaar TEXT,
  address TEXT,
  car_make TEXT,
  car_model TEXT,
  car_variant TEXT,
  on_road_price DECIMAL(14,2) DEFAULT 0,
  dealer_name TEXT,
  loan_amount DECIMAL(14,2) NOT NULL DEFAULT 0,
  down_payment DECIMAL(14,2) DEFAULT 0,
  tenure INTEGER DEFAULT 60,
  interest_rate DECIMAL(5,2) DEFAULT 9.0,
  emi DECIMAL(14,2) DEFAULT 0,
  status loan_status NOT NULL DEFAULT 'draft',
  assigned_bank_id UUID REFERENCES public.banks(id),
  assigned_broker_id UUID REFERENCES public.brokers(id),
  created_by UUID REFERENCES public.profiles(id),
  manager_id UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. COMMISSIONS TABLE
CREATE TABLE public.commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loan_id TEXT NOT NULL REFERENCES public.loans(id) ON DELETE CASCADE,
  broker_id UUID REFERENCES public.brokers(id),
  commission_rate DECIMAL(5,2) DEFAULT 1.5,
  commission_amount DECIMAL(14,2) NOT NULL DEFAULT 0,
  status commission_status NOT NULL DEFAULT 'pending',
  paid_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8. LOAN DOCUMENTS TABLE
CREATE TABLE public.loan_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loan_id TEXT NOT NULL REFERENCES public.loans(id) ON DELETE CASCADE,
  document_type doc_type NOT NULL DEFAULT 'other',
  file_name TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  file_size BIGINT,
  uploaded_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- STORAGE BUCKET FOR LOAN DOCUMENTS
-- ============================================================
INSERT INTO storage.buckets (id, name, public) VALUES ('loan-documents', 'loan-documents', false);

-- ============================================================
-- HELPER FUNCTIONS (SECURITY DEFINER to avoid RLS recursion)
-- ============================================================

-- Check if current user has a given role
CREATE OR REPLACE FUNCTION public.has_role(_role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = _role
  );
$$;

-- Check if current user has any elevated role (admin or above)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role IN ('super_admin', 'admin')
  );
$$;

-- Check if current user has manager or above role
CREATE OR REPLACE FUNCTION public.is_manager_or_above()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role IN ('super_admin', 'admin', 'manager')
  );
$$;

-- Get the role of the current user (returns first role)
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_roles WHERE user_id = auth.uid() LIMIT 1;
$$;

-- ============================================================
-- AUTO-CREATE PROFILE ON SIGNUP
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.email, '')
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER banks_updated_at BEFORE UPDATE ON public.banks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER brokers_updated_at BEFORE UPDATE ON public.brokers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER loans_updated_at BEFORE UPDATE ON public.loans FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER commissions_updated_at BEFORE UPDATE ON public.commissions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brokers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loan_documents ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- RLS POLICIES: PROFILES
-- ============================================================
CREATE POLICY "Users can view all profiles" ON public.profiles
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (id = auth.uid());

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (id = auth.uid());

-- ============================================================
-- RLS POLICIES: USER ROLES
-- ============================================================
CREATE POLICY "Users can view their own role" ON public.user_roles
  FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_manager_or_above());

CREATE POLICY "Admins can manage roles" ON public.user_roles
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ============================================================
-- RLS POLICIES: BANKS
-- ============================================================
CREATE POLICY "Authenticated users can view banks" ON public.banks
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Managers and above can manage banks" ON public.banks
  FOR INSERT TO authenticated WITH CHECK (public.is_manager_or_above());

CREATE POLICY "Managers and above can update banks" ON public.banks
  FOR UPDATE TO authenticated USING (public.is_manager_or_above());

CREATE POLICY "Admins can delete banks" ON public.banks
  FOR DELETE TO authenticated USING (public.is_admin());

-- ============================================================
-- RLS POLICIES: BROKERS
-- ============================================================
CREATE POLICY "Authenticated users can view brokers" ON public.brokers
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Managers and above can manage brokers" ON public.brokers
  FOR INSERT TO authenticated WITH CHECK (public.is_manager_or_above());

CREATE POLICY "Managers and above can update brokers" ON public.brokers
  FOR UPDATE TO authenticated USING (public.is_manager_or_above());

CREATE POLICY "Admins can delete brokers" ON public.brokers
  FOR DELETE TO authenticated USING (public.is_admin());

-- ============================================================
-- RLS POLICIES: LOANS
-- ============================================================
CREATE POLICY "Users can view loans based on role" ON public.loans
  FOR SELECT TO authenticated USING (
    public.is_admin()
    OR public.is_manager_or_above()
    OR created_by = auth.uid()
    OR manager_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.brokers b ON b.id = assigned_broker_id
      WHERE ur.user_id = auth.uid() AND ur.role = 'broker'
    )
    OR EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.banks bk ON bk.id = assigned_bank_id
      WHERE ur.user_id = auth.uid() AND ur.role = 'bank'
    )
  );

CREATE POLICY "Employees and above can create loans" ON public.loans
  FOR INSERT TO authenticated WITH CHECK (
    auth.uid() IS NOT NULL AND created_by = auth.uid()
  );

CREATE POLICY "Loan owner and managers can update" ON public.loans
  FOR UPDATE TO authenticated USING (
    public.is_admin()
    OR public.is_manager_or_above()
    OR created_by = auth.uid()
  );

CREATE POLICY "Admins can delete loans" ON public.loans
  FOR DELETE TO authenticated USING (public.is_admin());

-- ============================================================
-- RLS POLICIES: COMMISSIONS
-- ============================================================
CREATE POLICY "Users can view commissions based on role" ON public.commissions
  FOR SELECT TO authenticated USING (
    public.is_manager_or_above()
    OR EXISTS (
      SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('broker', 'bank')
    )
  );

CREATE POLICY "Admins can manage commissions" ON public.commissions
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ============================================================
-- RLS POLICIES: LOAN DOCUMENTS
-- ============================================================
CREATE POLICY "Users can view loan documents" ON public.loan_documents
  FOR SELECT TO authenticated USING (
    public.is_manager_or_above()
    OR uploaded_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.loans l
      WHERE l.id = loan_id AND (l.created_by = auth.uid() OR l.manager_id = auth.uid())
    )
  );

CREATE POLICY "Users can upload loan documents" ON public.loan_documents
  FOR INSERT TO authenticated WITH CHECK (
    uploaded_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.loans l
      WHERE l.id = loan_id AND (
        l.created_by = auth.uid()
        OR public.is_manager_or_above()
      )
    )
  );

CREATE POLICY "Admins can delete documents" ON public.loan_documents
  FOR DELETE TO authenticated USING (public.is_admin() OR uploaded_by = auth.uid());

-- ============================================================
-- RLS POLICIES: STORAGE (loan-documents bucket)
-- ============================================================
CREATE POLICY "Authenticated users can upload loan docs" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'loan-documents');

CREATE POLICY "Users can view their loan docs" ON storage.objects
  FOR SELECT TO authenticated USING (bucket_id = 'loan-documents');

CREATE POLICY "Users can delete their own loan docs" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'loan-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ============================================================
-- SEED: Default banks and brokers
-- ============================================================
INSERT INTO public.banks (name, contact_person, email, interest_rate) VALUES
  ('HDFC Bank', 'Anil Sharma', 'anil@hdfc.com', 8.5),
  ('ICICI Bank', 'Rekha Menon', 'rekha@icici.com', 9.0),
  ('SBI', 'Suresh Yadav', 'suresh@sbi.com', 8.75),
  ('Axis Bank', 'Kavita Jain', 'kavita@axis.com', 9.25),
  ('Kotak Mahindra Bank', 'Manoj Gupta', 'manoj@kotak.com', 8.9),
  ('Bajaj Finserv', 'Suman Verma', 'suman@bajaj.com', 9.5);

INSERT INTO public.brokers (name, email, phone, area, commission_rate) VALUES
  ('Vikram Singh', 'vikram@carloan.com', '9876543210', 'Mumbai', 1.5),
  ('Rohit Kapoor', 'rohit@carloan.com', '9812345678', 'Delhi NCR', 1.2),
  ('Sunil Mehta', 'sunil@carloan.com', '9988776655', 'Pune', 1.3),
  ('Ajay Thakur', 'ajay@carloan.com', '9654321098', 'Bangalore', 1.4),
  ('Manoj Pandey', 'manoj@carloan.com', '9123456789', 'Ahmedabad', 1.1);
