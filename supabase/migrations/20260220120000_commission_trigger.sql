-- Function to auto-generate commission when loan is disbursed
CREATE OR REPLACE FUNCTION auto_generate_commission()
RETURNS TRIGGER AS $$
DECLARE
  broker_commission_rate DECIMAL;
BEGIN
  -- Check if status changed to 'disbursed' and broker is assigned
  IF NEW.status = 'disbursed' AND OLD.status != 'disbursed' AND NEW.assigned_broker_id IS NOT NULL THEN
    -- Get broker's commission rate
    SELECT commission_rate INTO broker_commission_rate
    FROM brokers
    WHERE id = NEW.assigned_broker_id;
    
    -- Create commission record
    INSERT INTO commissions (
      loan_id,
      broker_id,
      commission_amount,
      commission_rate,
      status
    ) VALUES (
      NEW.id,
      NEW.assigned_broker_id,
      NEW.loan_amount * (broker_commission_rate / 100),
      broker_commission_rate,
      'pending'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_auto_commission ON loans;
CREATE TRIGGER trigger_auto_commission
  AFTER UPDATE ON loans
  FOR EACH ROW
  EXECUTE FUNCTION auto_generate_commission();
