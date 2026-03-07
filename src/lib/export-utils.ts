export function exportToCSV(data: Record<string, any>[], filename: string) {
  if (data.length === 0) return;
  
  // Comprehensive field mapping for loan applications
  const fieldMapping: Record<string, string> = {
    'id': 'Loan ID',
    'loan_number': 'Loan Number',
    'customer_id': 'Customer ID',
    'applicant_name': 'Applicant Name',
    'mobile': 'Mobile',
    'co_applicant_name': 'Co-Applicant Name',
    'co_applicant_mobile': 'Co-Applicant Mobile',
    'guarantor_name': 'Guarantor Name',
    'guarantor_mobile': 'Guarantor Mobile',
    'current_address': 'Current Address',
    'current_village': 'Current Village',
    'current_tehsil': 'Current Tehsil',
    'current_district': 'Current District',
    'current_state': 'Current State',
    'current_pincode': 'Current Pincode',
    'permanent_address': 'Permanent Address',
    'permanent_village': 'Permanent Village',
    'permanent_tehsil': 'Permanent Tehsil',
    'permanent_district': 'Permanent District',
    'permanent_state': 'Permanent State',
    'permanent_pincode': 'Permanent Pincode',
    'our_branch': 'Our Branch',
    'income_source': 'Income Source',
    'monthly_income': 'Monthly Income',
    'vehicle_number': 'Vehicle Number',
    'maker_name': 'Maker Name',
    'model_variant_name': 'Model/Variant',
    'mfg_year': 'Mfg Year',
    'vertical': 'Vertical',
    'scheme': 'Scheme',
    'loan_type_vehicle': 'Loan Type',
    'purpose_loan_amount': 'Purpose Loan Amount',
    'loan_amount': 'Loan Amount',
    'ltv': 'LTV %',
    'irr': 'IRR %',
    'interest_rate': 'Interest Rate %',
    'tenure_months': 'Tenure (Months)',
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
    'mehar_pf': 'Mehar PF',
    'total_deduction': 'Total Deduction',
    'hold_amount': 'Hold Amount',
    'net_seed_amount': 'Net Seed Amount',
    'payment_in_favour': 'Payment In Favour',
    'net_disbursement_amount': 'Net Disbursement',
    'payment_received_date': 'Payment Received Date',
    'login_date': 'Login Date',
    'approval_date': 'Approval Date',
    'sourcing_person_name': 'Sourcing Person',
    'remark': 'Remark',
    'status': 'Status',
    'created_at': 'Created At',
    'updated_at': 'Updated At'
  };

  // Get all unique keys from data
  const allKeys = Array.from(new Set(data.flatMap(row => Object.keys(row))));
  
  // Map to readable headers
  const headers = allKeys.map(key => fieldMapping[key] || key);
  
  const csvRows = [
    headers.join(','),
    ...data.map(row =>
      allKeys.map(key => {
        const val = row[key] ?? '';
        const str = String(val).replace(/"/g, '""');
        return str.includes(',') || str.includes('"') || str.includes('\n') ? `"${str}"` : str;
      }).join(',')
    ),
  ];
  
  const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
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
