-- Insert sample loan data for testing

-- First, ensure we have a bank and broker
INSERT INTO banks (id, name, contact_person, phone, email, interest_rate, is_active)
VALUES 
  ('bank-001', 'Kamal Finserve', 'Manoj Kumar', '9876543210', 'manoj@kamalfinserve.com', 28.50, true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO brokers (id, name, phone, email, area, commission_rate, is_active)
VALUES 
  ('broker-001', 'Rajesh Broker', '9876543211', 'rajesh@broker.com', 'Bikaner', 2.5, true)
ON CONFLICT (id) DO NOTHING;

-- Insert sample loan data
INSERT INTO loans (
  id, loan_number, applicant_name, mobile, 
  -- Customer Details
  co_applicant_name, co_applicant_mobile, guarantor_name, guarantor_mobile, our_branch,
  current_address, current_village, current_tehsil, current_district, current_pincode,
  permanent_address, permanent_village, permanent_tehsil, permanent_district, permanent_pincode,
  -- Loan & Vehicle Details
  loan_amount, actual_loan_amount, grid, ltv, loan_type_vehicle,
  vehicle_number, maker_name, model_variant_name, mfg_year, vertical, scheme,
  -- Income Details
  income_source, monthly_income, nip_ip, previous_track_details, loan_type, track_status, record,
  -- Agriculture
  agriculture,
  -- RTO Details
  rc_owner_name, rc_mfg_date, rc_expiry_date, hpn_at_login, new_financier, rto_docs_handover_date,
  rto_agent_name, agent_mobile_no, dto_location, rto_work_description, challan, fc, rto_papers,
  -- EMI Details
  emi_amount, total_emi, total_interest, first_emi_amount, first_installment_due_date,
  irr, tenure, emi_mode, emi,
  -- Financier Details
  assigned_bank_id, financier_executive_name, financier_team_vertical, 
  disburse_branch_name, branch_manager_name,
  -- Insurance Details
  insurance_company_name, insured_name, idv, insurance_transfer, insurance_hpn,
  insurance_made_by, premium_amount, insurance_date, insurance_renewal_date,
  -- Deductions
  file_charge, loan_suraksha, stamping, valuation, deferral_charges, gst,
  documentation_charges, other_charges, total_deduction,
  net_received_amount, net_disbursement_amount, first_payment_credited, hold_amount, payment_received_date,
  -- Others
  login_date, approval_date, financier_disburse_date, tat, booking_mode, sourcing_person_name,
  booking_month, booking_year, mehar_disburse_date, file_stage, status, remark
) VALUES (
  'CL-2026-1001', 'CL-2026-1001', 'JAGDISH', '9876543210',
  -- Customer Details
  'Ramesh Kumar', '9876543211', 'Suresh Singh', '9876543212', 'Bikaner Branch',
  'Village Nokha, Near Temple', 'Nokha', 'Nokha', 'Bikaner', '334803',
  'Village Nokha, Near Temple', 'Nokha', 'Nokha', 'Bikaner', '334803',
  -- Loan & Vehicle Details
  230000, 230000, 50000, 75.5, 'Used Vehicle Loan',
  'RJ14AB1234', 'TATA', 'ACE GOLD', '2010', 'LCV', 'Re-finance',
  -- Income Details
  'Business', 35000, 'nip', 'NA', 'NA', 'Closed', 'ETR',
  -- Agriculture
  'JAMAMANDI',
  -- RTO Details
  'JAGDISH', '2010-11', '2040-12-26', 'NA', 'KAMAL FINANCE', '2026-02-19',
  'DHANESH', '6367966369', 'BIKANER', 'HPN', 'No', 'No', 'RC NOC Permit Pollution 29-30 form Sell Agreement RC owners KYC Stamp Papers and etc.',
  -- EMI Details
  12683, 24, 74392, 12683, '2026-04-05',
  28.50, 24, 'Monthly', 12683,
  -- Financier Details
  'bank-001', 'MANOJ KUMAR', 'LCV', 'BIKANER', 'SHER SINGH',
  -- Insurance Details
  'TATA AIG INSURANCE', 'JAGDISH', 269280, 'Done', 'NA',
  'Customer', 17974, '2025-12-17', '2026-12-17',
  -- Deductions
  7300, 3250, 1200, 0, 0, 0,
  1251, 0, 13001,
  216999, 216999, '100% in Favor of MAPL', 0, '2026-02-19',
  -- Others
  '2026-02-03', '2026-02-17', '2026-02-19', 16, 'Self', 'Sourcing Person Name',
  'Feb', '2026', '2026-02-19', 'Disburse', 'approved', 'Sample loan application'
),
(
  'CL-2026-1002', 'CL-2026-1002', 'RAMESH PATEL', '9876543220',
  -- Customer Details
  'Sunita Patel', '9876543221', 'Mahesh Sharma', '9876543222', 'Jaipur Branch',
  'Sector 15, Near Market', 'Malviya Nagar', 'Jaipur', 'Jaipur', '302017',
  'Sector 15, Near Market', 'Malviya Nagar', 'Jaipur', 'Jaipur', '302017',
  -- Loan & Vehicle Details
  450000, 450000, 80000, 80.0, 'New Vehicle Loan',
  'RJ14CD5678', 'MAHINDRA', 'BOLERO PICKUP', '2024', 'LCV', 'New Finance',
  -- Income Details
  'Salaried', 45000, 'ip', 'Good Track', 'Personal Loan', 'Active', 'Good',
  -- Agriculture
  'NA',
  -- RTO Details
  'RAMESH PATEL', '2024-01', '2044-01-15', 'HDFC Bank', 'Kamal Finance', '2026-02-20',
  'Rajesh RTO', '9876543223', 'JAIPUR', 'Registration', 'No', 'Yes', 'All documents submitted',
  -- EMI Details
  18500, 36, 216000, 18500, '2026-03-15',
  26.00, 36, 'Monthly', 18500,
  -- Financier Details
  'bank-001', 'SURESH KUMAR', 'LCV', 'JAIPUR', 'ANIL VERMA',
  -- Insurance Details
  'ICICI LOMBARD', 'RAMESH PATEL', 380000, 'Done', 'HDFC Bank',
  'Company', 22500, '2026-01-10', '2027-01-10',
  -- Deductions
  9000, 4500, 1500, 500, 0, 1200,
  1800, 0, 18500,
  431500, 431500, '100% in Favor of MAPL', 0, '2026-02-20',
  -- Others
  '2026-02-05', '2026-02-18', '2026-02-20', 15, 'Broker', 'Rajesh Broker',
  'Feb', '2026', '2026-02-20', 'Disburse', 'disbursed', 'New vehicle loan'
),
(
  'CL-2026-1003', 'CL-2026-1003', 'VIJAY SINGH', '9876543230',
  -- Customer Details
  NULL, NULL, 'Prakash Yadav', '9876543231', 'Jodhpur Branch',
  'Ward No 12, Main Road', 'Pali', 'Pali', 'Pali', '306401',
  'Ward No 12, Main Road', 'Pali', 'Pali', 'Pali', '306401',
  -- Loan & Vehicle Details
  180000, 180000, 40000, 70.0, 'Used Vehicle Loan',
  'RJ14EF9012', 'ASHOK LEYLAND', 'DOST', '2018', 'LCV', 'Balance Transfer',
  -- Income Details
  'Business', 28000, 'nip', 'Previous loan closed', 'Vehicle Loan', 'Closed', 'ETR',
  -- Agriculture
  'Land Owner',
  -- RTO Details
  'VIJAY SINGH', '2018-06', '2038-06-20', 'ICICI Bank', 'Kamal Finance', '2026-02-21',
  'Mohan RTO', '9876543232', 'JODHPUR', 'Transfer', 'Yes', 'No', 'RC, Insurance, NOC',
  -- EMI Details
  9800, 24, 55200, 9800, '2026-04-01',
  30.00, 24, 'Monthly', 9800,
  -- Financier Details
  'bank-001', 'DINESH KUMAR', 'LCV', 'JODHPUR', 'RAMESH CHOUDHARY',
  -- Insurance Details
  'BAJAJ ALLIANZ', 'VIJAY SINGH', 195000, 'Pending', 'ICICI Bank',
  'Agent', 14500, '2026-02-15', '2027-02-15',
  -- Deductions
  6500, 2800, 1000, 0, 0, 0,
  1100, 500, 11900,
  168100, 168100, '100% in Favor of MAPL', 0, '2026-02-21',
  -- Others
  '2026-02-08', '2026-02-19', '2026-02-21', 13, 'Self', 'Walk-in',
  'Feb', '2026', '2026-02-21', 'Disburse', 'approved', 'Balance transfer case'
)
ON CONFLICT (id) DO NOTHING;
