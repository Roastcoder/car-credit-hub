import * as XLSX from 'xlsx';

export function exportToCSV(data: Record<string, any>[], filename: string) {
  if (data.length === 0) return;

  // Use a specialized mapping for loans, otherwise use data keys
  let fieldMapping: Record<string, string> | null = null;
  
  // Only apply mapping if it's the raw loans export and keys match
  if (filename === 'loans' && data[0] && 'applicant_name' in data[0]) {
    fieldMapping = {
      'loan_number': 'Loan Number',
      'application_id': 'Application ID',
      'customer_id': 'Customer ID',
      'booking_month': 'Booking Month',
      'applicant_name': 'Applicant Name',
      'mobile': 'Mobile',
      'pan_number': 'PAN Number',
      'aadhar_number': 'Aadhar Number',
      'current_address': 'Current Address',
      'current_village': 'Village',
      'current_tehsil': 'Tehsil',
      'current_district': 'District',
      'current_state': 'State',
      'current_pincode': 'Pincode',
      'permanent_address': 'Permanent Address',
      'permanent_village': 'Perm. Village',
      'permanent_tehsil': 'Perm. Tehsil',
      'permanent_district': 'Perm. District',
      'permanent_state': 'Perm. State',
      'permanent_pincode': 'Perm. Pincode',
      'branch_name': 'Our Branch',
      'income_source': 'Income Source',
      'monthly_income': 'Monthly Income',
      'vehicle_number': 'Vehicle Number',
      'maker_name': 'Maker Name',
      'model_variant_name': 'Model/Variant',
      'mfg_year': 'Mfg Year',
      'chassis_number': 'Chassis Number',
      'engine_number': 'Engine Number',
      'vertical': 'Vertical',
      'scheme': 'Scheme',
      'loan_type_vehicle': 'Loan Type',
      'purpose_loan_amount': 'Purpose Loan Amount',
      'loan_amount': 'Loan Amount',
      'ltv': 'LTV %',
      'irr': 'IRR %',
      'interest_rate': 'Interest Rate %',
      'tenure': 'Tenure',
      'emi_mode': 'EMI Mode',
      'emi_amount': 'EMI Amount',
      'emi': 'EMI',
      'total_interest': 'Total Interest',
      'emi_start_date': 'EMI Start Date',
      'emi_end_date': 'EMI End Date',
      'processing_fee': 'Processing Fee',
      'bank_name': 'Bank Name',
      'assigned_bank_name': 'Assigned Bank',
      'financier_executive_name': 'Financier Executive',
      'financier_team_vertical': 'Team Vertical',
      'disburse_branch_name': 'Disburse Branch',
      'assigned_broker_name': 'Broker Name',
      'sanction_amount': 'Sanction Amount',
      'sanction_date': 'Sanction Date',
      'insurance_company_name': 'Insurance Company',
      'premium_amount': 'Premium Amount',
      'insurance_date': 'Insurance Expiry',
      'insurance_policy_number': 'Policy Number',
      'insurance_made_by': 'Insurance Made By',
      'insurance_reminder_enabled': 'Insurance Reminder',
      'rc_owner_name': 'RC Owner',
      'hpn_at_login': 'HPN Status',
      'rto_agent_name': 'RTO Agent',
      'agent_mobile_no': 'Agent Mobile',
      'mehar_deduction': 'Mehar Deduction',
      'hold_amount': 'Hold Amount',
      'net_seed_amount': 'Received Amount',
      'payment_in_favour': 'Payment In Favour',
      'net_disbursement_amount': 'Net Disbursement',
      'payment_received_date': 'Payment Received Date',
      'login_date': 'Login Date',
      'approval_date': 'Approval Date',
      'sourcing_person_name': 'Sourcing Person',
      'remark': 'Remark',
      'status': 'Status',
      'pdd_status': 'PDD Status',
      'created_at': 'Created At',
      'updated_at': 'Updated At'
    };
  } else if (filename.includes('payments')) {
    fieldMapping = {
      'payment_id': 'Payment ID',
      'loan_number': 'Loan Number',
      'applicant_name': 'Applicant',
      'payment_type': 'Payment Type',
      'amount': 'Amount',
      'beneficiary_name': 'Beneficiary Name',
      'bank_name': 'Beneficiary Bank',
      'ifsc_code': 'IFSC Code',
      'account_number': 'Account Number',
      'status': 'Status',
      'remarks': 'Remarks',
      'created_at': 'Created At',
      'updated_at': 'Updated At'
    };
  }

  const allKeys = fieldMapping ? Object.keys(fieldMapping) : Object.keys(data[0]);
  const headers = fieldMapping ? allKeys.map(key => fieldMapping![key]) : allKeys;

  // Build rows: first row is headers, rest are data values
  const sheetRows = [
    headers,
    ...data.map(row =>
      allKeys.map(key => {
        const val = row[key] ?? '';
        // Return numbers as numbers so Excel treats them properly
        if (val !== '' && !isNaN(Number(val)) && typeof val !== 'boolean') return Number(val);
        return String(val);
      })
    ),
  ];

  const worksheet = XLSX.utils.aoa_to_sheet(sheetRows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Loans');
  XLSX.writeFile(workbook, `${filename}-${new Date().toISOString().slice(0, 10)}.xlsx`);
}

export function parseCSV(text: string): Record<string, string>[] {
  const lines = text.split('\n').filter(l => l.trim());
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  return lines.slice(1).map(line => {
    const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => { obj[h] = values[i] || ''; });
    return obj;
  });
}
