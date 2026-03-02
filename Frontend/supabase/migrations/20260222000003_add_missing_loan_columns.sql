-- Add missing columns to loans table
ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS file_sign_date DATE;
ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS disburse_date DATE;
ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS product_name TEXT;
ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS model_year TEXT;
ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS product_code TEXT;
ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS hpn_after_pdd TEXT;
ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS rto_rc_handover_date DATE;
ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS for_closure TEXT;
ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS customer_track_company TEXT;
