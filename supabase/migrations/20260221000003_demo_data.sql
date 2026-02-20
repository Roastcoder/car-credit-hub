-- Demo Data for Loan Management System
-- This includes banks, brokers, and comprehensive loan applications

-- Insert Banks
INSERT INTO banks (id, name, contact_person, phone, email, interest_rate, is_active)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'Kamal Finserve', 'Manoj Kumar', '9876543210', 'manoj@kamalfinserve.com', 28.50, true),
  ('22222222-2222-2222-2222-222222222222', 'HDFC Bank', 'Rajesh Sharma', '9876543211', 'rajesh@hdfc.com', 26.00, true),
  ('33333333-3333-3333-3333-333333333333', 'ICICI Bank', 'Priya Singh', '9876543212', 'priya@icici.com', 27.50, true),
  ('44444444-4444-4444-4444-444444444444', 'Axis Bank', 'Amit Verma', '9876543213', 'amit@axis.com', 25.50, true)
ON CONFLICT (id) DO NOTHING;

-- Insert Brokers
INSERT INTO brokers (id, name, phone, email, area, commission_rate, is_active)
VALUES 
  ('55555555-5555-5555-5555-555555555555', 'Rajesh Broker', '9876543220', 'rajesh@broker.com', 'Bikaner', 2.5, true),
  ('66666666-6666-6666-6666-666666666666', 'Sunil Associates', '9876543221', 'sunil@associates.com', 'Jaipur', 2.0, true),
  ('77777777-7777-7777-7777-777777777777', 'Deepak Finance', '9876543222', 'deepak@finance.com', 'Jodhpur', 2.5, true)
ON CONFLICT (id) DO NOTHING;

-- Insert Demo Loan Applications
INSERT INTO loans (
  id, applicant_name, mobile,
  customer_id, loan_number,
  co_applicant_name, co_applicant_mobile, guarantor_name, guarantor_mobile, our_branch,
  current_address, current_village, current_tehsil, current_district, current_pincode,
  permanent_address, permanent_village, permanent_tehsil, permanent_district, permanent_pincode,
  loan_amount, actual_loan_amount, grid, ltv, loan_type_vehicle,
  vehicle_number, maker_name, model_variant_name, mfg_year, vertical, scheme,
  income_source, monthly_income, nip_ip, previous_track_details, loan_type, track_status, record,
  agriculture,
  rc_owner_name, rc_mfg_date, rc_expiry_date, hpn_at_login, new_financier, rto_docs_handover_date,
  rto_agent_name, agent_mobile_no, dto_location, rto_work_description, challan, fc, rto_papers,
  emi_amount, total_emi, total_interest, first_emi_amount, first_installment_due_date,
  irr, tenure, emi_mode, emi, interest_rate,
  assigned_bank_id, financier_executive_name, financier_team_vertical, 
  disburse_branch_name, branch_manager_name,
  insurance_company_name, insured_name, idv, insurance_transfer, insurance_hpn,
  insurance_made_by, premium_amount, insurance_date, insurance_renewal_date,
  file_charge, loan_suraksha, stamping, valuation, deferral_charges, gst,
  documentation_charges, other_charges, total_deduction,
  net_received_amount, net_disbursement_amount, first_payment_credited, hold_amount, payment_received_date,
  login_date, approval_date, financier_disburse_date, tat, booking_mode, sourcing_person_name,
  booking_month, booking_year, mehar_disburse_date, file_stage, status, remark
) VALUES 
-- Loan 1: JAGDISH - Approved & Disbursed
(
  'DEMO-2026-001', 'JAGDISH KUMAR', '9876543301',
  'CUST-2026-1001', 'CL-2026-1001',
  'Sita Devi', '9876543302', 'Ram Singh', '9876543303', 'Bikaner Branch',
  'Village Nokha, Near Temple, House No 45', 'Nokha', 'Nokha', 'Bikaner', '334803',
  'Village Nokha, Near Temple, House No 45', 'Nokha', 'Nokha', 'Bikaner', '334803',
  230000, 230000, 50000, 75.5, 'Used Vehicle Loan',
  'RJ14AB1234', 'TATA', 'ACE GOLD', '2010', 'LCV', 'Re-finance',
  'Business', 35000, 'nip', 'NA', 'NA', 'Closed', 'ETR',
  'JAMAMANDI',
  'JAGDISH KUMAR', '2010-11', '2040-12-26', 'NA', 'KAMAL FINANCE', '2026-02-19',
  'DHANESH', '6367966369', 'BIKANER', 'HPN', 'No', 'No', 'RC NOC Permit Pollution 29-30 form Sell Agreement RC owners KYC Stamp Papers',
  12683, 24, 74392, 12683, '2026-04-05',
  28.50, 24, 'Monthly', 12683, 28.50,
  '11111111-1111-1111-1111-111111111111', 'MANOJ KUMAR', 'LCV', 'BIKANER', 'SHER SINGH',
  'TATA AIG INSURANCE', 'JAGDISH KUMAR', 269280, 'Done', 'NA',
  'Customer', 17974, '2025-12-17', '2026-12-17',
  7300, 3250, 1200, 0, 0, 0,
  1251, 0, 13001,
  216999, 216999, '100% in Favor of MAPL', 0, '2026-02-19',
  '2026-02-03', '2026-02-17', '2026-02-19', 16, 'Self', 'Walk-in Customer',
  'Feb', '2026', '2026-02-19', 'Disburse', 'disbursed', 'Loan disbursed successfully'
),
-- Loan 2: RAMESH PATEL - Approved
(
  'DEMO-2026-002', 'RAMESH PATEL', '9876543311',
  'CUST-2026-1002', 'CL-2026-1002',
  'Sunita Patel', '9876543312', 'Mahesh Sharma', '9876543313', 'Jaipur Branch',
  'Sector 15, Near Market, Flat 301', 'Malviya Nagar', 'Jaipur', 'Jaipur', '302017',
  'Sector 15, Near Market, Flat 301', 'Malviya Nagar', 'Jaipur', 'Jaipur', '302017',
  450000, 450000, 80000, 80.0, 'New Vehicle Loan',
  'RJ14CD5678', 'MAHINDRA', 'BOLERO PICKUP', '2024', 'LCV', 'New Finance',
  'Salaried', 45000, 'ip', 'Good Track', 'Personal Loan', 'Active', 'Good',
  'NA',
  'RAMESH PATEL', '2024-01', '2044-01-15', 'HDFC Bank', 'Kamal Finance', '2026-02-20',
  'Rajesh RTO', '9876543314', 'JAIPUR', 'Registration', 'No', 'Yes', 'All documents submitted',
  18500, 36, 216000, 18500, '2026-03-15',
  26.00, 36, 'Monthly', 18500, 26.00,
  '22222222-2222-2222-2222-222222222222', 'SURESH KUMAR', 'LCV', 'JAIPUR', 'ANIL VERMA',
  'ICICI LOMBARD', 'RAMESH PATEL', 380000, 'Done', 'HDFC Bank',
  'Company', 22500, '2026-01-10', '2027-01-10',
  9000, 4500, 1500, 500, 0, 1200,
  1800, 0, 18500,
  431500, 431500, '100% in Favor of MAPL', 0, '2026-02-20',
  '2026-02-05', '2026-02-18', '2026-02-20', 15, 'Broker', 'Rajesh Broker',
  'Feb', '2026', '2026-02-20', 'Disburse', 'approved', 'New vehicle loan approved'
),
-- Loan 3: VIJAY SINGH - Under Review
(
  'DEMO-2026-003', 'VIJAY SINGH', '9876543321',
  'CUST-2026-1003', 'CL-2026-1003',
  NULL, NULL, 'Prakash Yadav', '9876543322', 'Jodhpur Branch',
  'Ward No 12, Main Road', 'Pali', 'Pali', 'Pali', '306401',
  'Ward No 12, Main Road', 'Pali', 'Pali', 'Pali', '306401',
  180000, 180000, 40000, 70.0, 'Used Vehicle Loan',
  'RJ14EF9012', 'ASHOK LEYLAND', 'DOST', '2018', 'LCV', 'Balance Transfer',
  'Business', 28000, 'nip', 'Previous loan closed', 'Vehicle Loan', 'Closed', 'ETR',
  'Land Owner',
  'VIJAY SINGH', '2018-06', '2038-06-20', 'ICICI Bank', 'Kamal Finance', '2026-02-21',
  'Mohan RTO', '9876543323', 'JODHPUR', 'Transfer', 'Yes', 'No', 'RC, Insurance, NOC',
  9800, 24, 55200, 9800, '2026-04-01',
  30.00, 24, 'Monthly', 9800, 30.00,
  '33333333-3333-3333-3333-333333333333', 'DINESH KUMAR', 'LCV', 'JODHPUR', 'RAMESH CHOUDHARY',
  'BAJAJ ALLIANZ', 'VIJAY SINGH', 195000, 'Pending', 'ICICI Bank',
  'Agent', 14500, '2026-02-15', '2027-02-15',
  6500, 2800, 1000, 0, 0, 0,
  1100, 500, 11900,
  168100, 168100, '100% in Favor of MAPL', 0, '2026-02-21',
  '2026-02-08', '2026-02-19', NULL, NULL, 'Self', 'Walk-in',
  'Feb', '2026', NULL, 'Approval', 'under_review', 'Documents under verification'
),
-- Loan 4: PRIYA SHARMA - Submitted
(
  'DEMO-2026-004', 'PRIYA SHARMA', '9876543331',
  'CUST-2026-1004', 'CL-2026-1004',
  'Rajesh Sharma', '9876543332', 'Amit Kumar', '9876543333', 'Udaipur Branch',
  'Lake View Colony, House 23', 'Udaipur City', 'Udaipur', 'Udaipur', '313001',
  'Lake View Colony, House 23', 'Udaipur City', 'Udaipur', 'Udaipur', '313001',
  320000, 320000, 60000, 78.0, 'New Vehicle Loan',
  'RJ27GH3456', 'TATA', 'INTRA V30', '2025', 'LCV', 'New Finance',
  'Business', 38000, 'nip', 'NA', 'NA', 'NA', 'NA',
  'Small Business Owner',
  'PRIYA SHARMA', '2025-02', '2045-02-10', 'NA', 'Axis Bank', NULL,
  'Suresh RTO', '9876543334', 'UDAIPUR', 'New Registration', 'No', 'Yes', 'Pending',
  14200, 30, 106000, 14200, '2026-04-10',
  27.50, 30, 'Monthly', 14200, 27.50,
  '44444444-4444-4444-4444-444444444444', 'VIKRAM SINGH', 'LCV', 'UDAIPUR', 'MOHAN LAL',
  'HDFC ERGO', 'PRIYA SHARMA', 295000, 'Pending', 'NA',
  'Customer', 19800, '2026-02-10', '2027-02-10',
  8000, 3500, 1300, 300, 0, 900,
  1500, 0, 15500,
  304500, 304500, 'Pending', 0, NULL,
  '2026-02-10', NULL, NULL, NULL, 'Broker', 'Sunil Associates',
  'Feb', '2026', NULL, 'Login', 'submitted', 'Application submitted for review'
),
-- Loan 5: ANIL GUPTA - Draft
(
  'DEMO-2026-005', 'ANIL GUPTA', '9876543341',
  'CUST-2026-1005', 'CL-2026-1005',
  'Meena Gupta', '9876543342', NULL, NULL, 'Ajmer Branch',
  'Pushkar Road, Near Bus Stand', 'Pushkar', 'Ajmer', 'Ajmer', '305022',
  'Pushkar Road, Near Bus Stand', 'Pushkar', 'Ajmer', 'Ajmer', '305022',
  280000, 280000, 55000, 72.0, 'Used Vehicle Loan',
  'RJ01IJ7890', 'EICHER', 'PRO 2049', '2020', 'LCV', 'Re-finance',
  'Transport Business', 42000, 'nip', 'Good', 'Vehicle Loan', 'Closed', 'Good',
  'NA',
  'ANIL GUPTA', '2020-03', '2040-03-15', 'SBI', 'Kamal Finance', NULL,
  NULL, NULL, 'AJMER', NULL, 'No', 'No', NULL,
  13500, 28, 98000, 13500, '2026-04-15',
  28.00, 28, 'Monthly', 13500, 28.00,
  '11111111-1111-1111-1111-111111111111', 'RAVI KUMAR', 'LCV', 'AJMER', 'SURESH PATEL',
  'ORIENTAL INSURANCE', 'ANIL GUPTA', 245000, 'Pending', 'SBI',
  'Agent', 16500, NULL, NULL,
  7500, 3200, 1100, 0, 0, 0,
  1300, 0, 13100,
  266900, 266900, 'Pending', 0, NULL,
  '2026-02-12', NULL, NULL, NULL, 'Self', 'Existing Customer',
  'Feb', '2026', NULL, 'Login', 'draft', 'Application in progress'
),
-- Loan 6: DEEPAK YADAV - Disbursed (HCV)
(
  'DEMO-2026-006', 'DEEPAK YADAV', '9876543351',
  'CUST-2026-1006', 'CL-2026-1006',
  'Kavita Yadav', '9876543352', 'Suresh Yadav', '9876543353', 'Kota Branch',
  'Industrial Area, Sector 5', 'Kota', 'Kota', 'Kota', '324005',
  'Industrial Area, Sector 5', 'Kota', 'Kota', 'Kota', '324005',
  850000, 850000, 150000, 82.0, 'New Vehicle Loan',
  'RJ20KL1234', 'TATA', 'LPT 1613', '2025', 'HCV', 'New Finance',
  'Transport Business', 75000, 'ip', 'Excellent', 'Business Loan', 'Active', 'Excellent',
  'NA',
  'DEEPAK YADAV', '2025-01', '2045-01-20', 'NA', 'HDFC Bank', '2026-02-15',
  'Ramesh RTO', '9876543354', 'KOTA', 'New Registration', 'No', 'Yes', 'All documents complete',
  32500, 48, 710000, 32500, '2026-03-20',
  25.50, 48, 'Monthly', 32500, 25.50,
  '22222222-2222-2222-2222-222222222222', 'ASHOK KUMAR', 'HCV', 'KOTA', 'VIJAY SHARMA',
  'NEW INDIA ASSURANCE', 'DEEPAK YADAV', 780000, 'Done', 'NA',
  'Company', 45000, '2026-01-15', '2027-01-15',
  18000, 8500, 2500, 1000, 0, 2800,
  3500, 0, 36300,
  813700, 813700, '100% in Favor of MAPL', 0, '2026-02-15',
  '2026-01-20', '2026-02-10', '2026-02-15', 26, 'Broker', 'Deepak Finance',
  'Feb', '2026', '2026-02-15', 'Disburse', 'disbursed', 'HCV loan disbursed'
)
ON CONFLICT (id) DO NOTHING;
