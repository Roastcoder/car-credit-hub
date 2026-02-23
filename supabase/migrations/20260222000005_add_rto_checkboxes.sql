-- Add RTO Papers checkbox columns to loans table
ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS rto_rc BOOLEAN DEFAULT false;
ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS rto_noc BOOLEAN DEFAULT false;
ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS rto_permit BOOLEAN DEFAULT false;
ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS rto_pollution BOOLEAN DEFAULT false;
ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS rto_2930_form BOOLEAN DEFAULT false;
ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS rto_sell_agreement BOOLEAN DEFAULT false;
ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS rto_rc_owner_kyc BOOLEAN DEFAULT false;
ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS rto_stamp_papers BOOLEAN DEFAULT false;
