-- Add all comprehensive fields for complete loan management system

-- Customer Address Details
ALTER TABLE loans ADD COLUMN IF NOT EXISTS current_village TEXT;
ALTER TABLE loans ADD COLUMN IF NOT EXISTS current_tehsil TEXT;
ALTER TABLE loans ADD COLUMN IF NOT EXISTS current_district TEXT;
ALTER TABLE loans ADD COLUMN IF NOT EXISTS current_pincode TEXT;
ALTER TABLE loans ADD COLUMN IF NOT EXISTS permanent_village TEXT;
ALTER TABLE loans ADD COLUMN IF NOT EXISTS permanent_tehsil TEXT;
ALTER TABLE loans ADD COLUMN IF NOT EXISTS permanent_district TEXT;
ALTER TABLE loans ADD COLUMN IF NOT EXISTS permanent_pincode TEXT;

-- Loan & Vehicle Details
ALTER TABLE loans ADD COLUMN IF NOT EXISTS actual_loan_amount DECIMAL;
ALTER TABLE loans ADD COLUMN IF NOT EXISTS loan_type_vehicle TEXT;
ALTER TABLE loans ADD COLUMN IF NOT EXISTS maker_name TEXT;
ALTER TABLE loans ADD COLUMN IF NOT EXISTS model_variant_name TEXT;
ALTER TABLE loans ADD COLUMN IF NOT EXISTS mfg_year TEXT;
ALTER TABLE loans ADD COLUMN IF NOT EXISTS scheme TEXT;

-- Income & Track Details
ALTER TABLE loans ADD COLUMN IF NOT EXISTS previous_track_details TEXT;
ALTER TABLE loans ADD COLUMN IF NOT EXISTS loan_type TEXT;
ALTER TABLE loans ADD COLUMN IF NOT EXISTS track_status TEXT;
ALTER TABLE loans ADD COLUMN IF NOT EXISTS record TEXT;

-- RTO Additional Fields
ALTER TABLE loans ADD COLUMN IF NOT EXISTS new_financier TEXT;
ALTER TABLE loans ADD COLUMN IF NOT EXISTS rto_docs_handover_date DATE;
ALTER TABLE loans ADD COLUMN IF NOT EXISTS rto_work_description TEXT;
ALTER TABLE loans ADD COLUMN IF NOT EXISTS fc TEXT DEFAULT 'No';

-- EMI Additional Fields
ALTER TABLE loans ADD COLUMN IF NOT EXISTS emi_start_date DATE;
ALTER TABLE loans ADD COLUMN IF NOT EXISTS emi_end_date DATE;
ALTER TABLE loans ADD COLUMN IF NOT EXISTS advance_emi INTEGER;
ALTER TABLE loans ADD COLUMN IF NOT EXISTS principal_amount DECIMAL;
ALTER TABLE loans ADD COLUMN IF NOT EXISTS processing_fee DECIMAL;
ALTER TABLE loans ADD COLUMN IF NOT EXISTS bounce_charges DECIMAL;
ALTER TABLE loans ADD COLUMN IF NOT EXISTS penalty_charges DECIMAL;

-- Financier Additional Fields
ALTER TABLE loans ADD COLUMN IF NOT EXISTS financier_loan_id TEXT;
ALTER TABLE loans ADD COLUMN IF NOT EXISTS financier_executive_name TEXT;
ALTER TABLE loans ADD COLUMN IF NOT EXISTS financier_team_vertical TEXT;
ALTER TABLE loans ADD COLUMN IF NOT EXISTS branch_manager_name TEXT;
ALTER TABLE loans ADD COLUMN IF NOT EXISTS financier_contact_no TEXT;
ALTER TABLE loans ADD COLUMN IF NOT EXISTS financier_email TEXT;
ALTER TABLE loans ADD COLUMN IF NOT EXISTS financier_address TEXT;
ALTER TABLE loans ADD COLUMN IF NOT EXISTS sanction_amount DECIMAL;
ALTER TABLE loans ADD COLUMN IF NOT EXISTS sanction_date DATE;
ALTER TABLE loans ADD COLUMN IF NOT EXISTS agreement_number TEXT;
ALTER TABLE loans ADD COLUMN IF NOT EXISTS agreement_date DATE;

-- Insurance Additional Fields
ALTER TABLE loans ADD COLUMN IF NOT EXISTS insurance_made_by TEXT;
ALTER TABLE loans ADD COLUMN IF NOT EXISTS premium_amount DECIMAL;
ALTER TABLE loans ADD COLUMN IF NOT EXISTS insurance_policy_number TEXT;
ALTER TABLE loans ADD COLUMN IF NOT EXISTS insurance_type TEXT;
ALTER TABLE loans ADD COLUMN IF NOT EXISTS insurance_coverage_amount DECIMAL;
ALTER TABLE loans ADD COLUMN IF NOT EXISTS insurance_agent_name TEXT;
ALTER TABLE loans ADD COLUMN IF NOT EXISTS insurance_agent_contact TEXT;
ALTER TABLE loans ADD COLUMN IF NOT EXISTS insurance_nominee TEXT;
ALTER TABLE loans ADD COLUMN IF NOT EXISTS insurance_status TEXT;

-- Deduction & Disbursement Additional Fields
ALTER TABLE loans ADD COLUMN IF NOT EXISTS total_deduction DECIMAL;
ALTER TABLE loans ADD COLUMN IF NOT EXISTS net_received_amount DECIMAL;
ALTER TABLE loans ADD COLUMN IF NOT EXISTS net_disbursement_amount DECIMAL;
ALTER TABLE loans ADD COLUMN IF NOT EXISTS first_payment_credited TEXT;
ALTER TABLE loans ADD COLUMN IF NOT EXISTS hold_amount DECIMAL;
ALTER TABLE loans ADD COLUMN IF NOT EXISTS payment_received_date DATE;

-- Others Fields
ALTER TABLE loans ADD COLUMN IF NOT EXISTS financier_disburse_date DATE;
ALTER TABLE loans ADD COLUMN IF NOT EXISTS tat INTEGER;
ALTER TABLE loans ADD COLUMN IF NOT EXISTS booking_mode TEXT;
ALTER TABLE loans ADD COLUMN IF NOT EXISTS sourcing_person_name TEXT;
ALTER TABLE loans ADD COLUMN IF NOT EXISTS booking_month TEXT;
ALTER TABLE loans ADD COLUMN IF NOT EXISTS booking_year TEXT;
ALTER TABLE loans ADD COLUMN IF NOT EXISTS mehar_disburse_date DATE;
ALTER TABLE loans ADD COLUMN IF NOT EXISTS file_stage TEXT;

-- Create additional indexes
CREATE INDEX IF NOT EXISTS idx_loans_file_stage ON loans(file_stage);
CREATE INDEX IF NOT EXISTS idx_loans_booking_month ON loans(booking_month);
CREATE INDEX IF NOT EXISTS idx_loans_financier_disburse_date ON loans(financier_disburse_date);
