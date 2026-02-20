-- Add customer_id field with auto-generation
ALTER TABLE loans ADD COLUMN IF NOT EXISTS customer_id TEXT;

-- Create sequence for customer IDs
CREATE SEQUENCE IF NOT EXISTS customer_id_seq START 1001;

-- Create sequence for loan numbers
CREATE SEQUENCE IF NOT EXISTS loan_number_seq START 1001;

-- Function to generate customer ID
CREATE OR REPLACE FUNCTION generate_customer_id()
RETURNS TEXT AS $$
BEGIN
  RETURN 'CUST-' || TO_CHAR(CURRENT_DATE, 'YYYY') || '-' || LPAD(nextval('customer_id_seq')::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- Function to generate loan number
CREATE OR REPLACE FUNCTION generate_loan_number()
RETURNS TEXT AS $$
BEGIN
  RETURN 'CL-' || TO_CHAR(CURRENT_DATE, 'YYYY') || '-' || LPAD(nextval('loan_number_seq')::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate customer_id if not provided
CREATE OR REPLACE FUNCTION set_customer_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.customer_id IS NULL OR NEW.customer_id = '' THEN
    NEW.customer_id := generate_customer_id();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate loan_number if not provided
CREATE OR REPLACE FUNCTION set_loan_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.loan_number IS NULL OR NEW.loan_number = '' THEN
    NEW.loan_number := generate_loan_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
DROP TRIGGER IF EXISTS trigger_set_customer_id ON loans;
CREATE TRIGGER trigger_set_customer_id
  BEFORE INSERT ON loans
  FOR EACH ROW
  EXECUTE FUNCTION set_customer_id();

DROP TRIGGER IF EXISTS trigger_set_loan_number ON loans;
CREATE TRIGGER trigger_set_loan_number
  BEFORE INSERT ON loans
  FOR EACH ROW
  EXECUTE FUNCTION set_loan_number();

-- Create unique index on customer_id
CREATE UNIQUE INDEX IF NOT EXISTS idx_loans_customer_id_unique ON loans(customer_id);
