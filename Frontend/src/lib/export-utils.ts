import * as XLSX from 'xlsx';

export function exportToCSV(data: Record<string, any>[], filename: string) {
  if (data.length === 0) return;

  // Use a specialized mapping for loans, otherwise use data keys
  let fieldMapping: Record<string, string> | null = null;
  
  // Only apply mapping if it's the raw loans export and keys match
  if (filename === 'loans' && data[0] && 'applicant_name' in data[0]) {
    fieldMapping = {
      'loan_number': 'Loan Number',
      'customer_id': 'Customer ID',
      'booking_month': 'Booking Month',
      'applicant_name': 'Applicant Name',
      'mobile': 'Mobile',
      'pan_number': 'PAN Number',
      'current_tehsil': 'Tehsil',
      'current_district': 'District',
      'current_pincode': 'Pincode',
      'branch_name': 'Our Branch',
      'vehicle_number': 'Vehicle Number',
      'maker_name': 'Maker Name',
      'model_variant_name': 'Model/Variant',
      'mfg_year': 'Mfg Year',
      'vertical': 'Vertical',
      'scheme': 'Scheme',
      'loan_type_vehicle': 'Loan Type',
      'sanction_amount': 'Total Loan Amount (EMI)',
      'loan_amount': 'Actual Loan Amount (Payout)',
      'irr': 'IRR %',
      'tenure': 'Tenure',
      'emi_mode': 'EMI Mode',
      'emi_start_date': 'EMI Start Date',
      'emi_end_date': 'EMI End Date',
      'assigned_bank_name': 'Assigned Bank',
      'disburse_branch_name': 'Disburse Branch',
      'booking_mode': 'Booking Mode',
      'assigned_broker_name': 'Broker Name',
      'insurance_company_name': 'Insurance Company',
      'insurance_date': 'Insurance Expiry',
      'insurance_made_by': 'Insurance Made By',
      'rc_owner_name': 'RC Owner',
      'hpn_at_login': 'HPN Status',
      'rto_agent_name': 'RTO Agent',
      'agent_mobile_no': 'Agent Mobile',
      'mehar_deduction': 'Mehar Deduction',
      'sourcing_person_name': 'Sourcing Person',
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
