
-- Add customer_id column to leads
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS customer_id text UNIQUE;

-- Create a function to generate unique customer_id
CREATE OR REPLACE FUNCTION public.generate_customer_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _seq int;
  _year text;
BEGIN
  _year := to_char(now(), 'YY');
  SELECT COALESCE(MAX(CAST(SUBSTRING(customer_id FROM '[0-9]+$') AS int)), 0) + 1
  INTO _seq
  FROM public.leads
  WHERE customer_id LIKE 'CU-' || _year || '-%';
  
  NEW.customer_id := 'CU-' || _year || '-' || LPAD(_seq::text, 4, '0');
  RETURN NEW;
END;
$function$;

-- Create trigger
DROP TRIGGER IF EXISTS set_customer_id ON public.leads;
CREATE TRIGGER set_customer_id
  BEFORE INSERT ON public.leads
  FOR EACH ROW
  WHEN (NEW.customer_id IS NULL)
  EXECUTE FUNCTION public.generate_customer_id();
