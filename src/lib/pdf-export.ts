import { formatCurrency } from '@/lib/mock-data';

interface LoanData {
  [key: string]: any;
}

function formatDate(val: string | null | undefined): string {
  if (!val) return '—';
  try { return new Date(val).toLocaleDateString('en-IN'); } catch { return '—'; }
}

function fmt(val: any): string {
  if (val === null || val === undefined || val === '') return '—';
  return String(val);
}

function fmtCur(val: any): string {
  const n = Number(val);
  if (!val || isNaN(n)) return '—';
  return formatCurrency(n);
}

function buildLoanHTML(loan: LoanData): string {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Loan Application - ${loan.id}</title>
<style>
  @page { size: A4; margin: 18mm 20mm; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', Arial, sans-serif; color: #1a1a2e; font-size: 10px; line-height: 1.4; max-width: 170mm; margin: 0 auto; }
  
  .header { display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #1a3a6b; padding-bottom: 10px; margin-bottom: 12px; }
  .header-left { display: flex; align-items: center; gap: 10px; }
  .logo-box { background: #fff; border: 2px solid #1a3a6b; border-radius: 6px; padding: 4px; }
  .logo-box img { height: 36px; width: auto; }
  .company-name { font-size: 18px; font-weight: 800; color: #1a3a6b; letter-spacing: -0.5px; }
  .company-sub { font-size: 9px; color: #666; margin-top: 1px; }
  .header-right { text-align: right; }
  .header-right .label { font-size: 8px; color: #888; text-transform: uppercase; letter-spacing: 0.5px; }
  .header-right .value { font-size: 12px; font-weight: 700; color: #1a3a6b; }

  .title-bar { background: linear-gradient(135deg, #1a3a6b, #c0392b); color: #fff; padding: 8px 14px; border-radius: 5px; margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center; }
  .title-bar h1 { font-size: 13px; font-weight: 700; }
  .title-bar .status { background: rgba(255,255,255,0.2); padding: 2px 10px; border-radius: 20px; font-size: 9px; font-weight: 600; text-transform: uppercase; }

  .section { margin-bottom: 8px; break-inside: avoid; }
  .section-title { font-size: 10px; font-weight: 700; color: #1a3a6b; border-bottom: 1.5px solid #e8ecf1; padding-bottom: 3px; margin-bottom: 5px; text-transform: uppercase; letter-spacing: 0.5px; }
  
  .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0; }
  .grid-3 { grid-template-columns: repeat(3, 1fr); }
  .field { padding: 3px 6px; border: 0.5px solid #e8ecf1; }
  .field .label { font-size: 7px; color: #888; text-transform: uppercase; letter-spacing: 0.3px; }
  .field .value { font-size: 10px; font-weight: 600; color: #1a1a2e; margin-top: 1px; word-break: break-word; }
  .field-full { grid-column: span 2; }

  .footer { margin-top: 14px; border-top: 1.5px solid #e8ecf1; padding-top: 8px; display: flex; justify-content: space-between; color: #999; font-size: 8px; }
  
  .sig-area { margin-top: 20px; display: flex; justify-content: space-between; gap: 30px; }
  .sig-box { flex: 1; text-align: center; }
  .sig-line { border-top: 1px solid #333; margin-top: 40px; padding-top: 3px; font-size: 9px; color: #555; }

  @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
</style></head><body>

<div class="header">
  <div class="header-left">
    <div class="logo-box"><img src="${window.location.origin}/favicon.png" alt="Logo" onerror="this.style.display='none'" /></div>
    <div>
      <div class="company-name">Mehar Finance</div>
      <div class="company-sub">Vehicle Loan Solutions • Since 2015</div>
    </div>
  </div>
  <div class="header-right">
    <div class="label">Application ID</div>
    <div class="value">${loan.id}</div>
    <div class="label" style="margin-top:4px">Date</div>
    <div class="value" style="font-size:11px">${new Date().toLocaleDateString('en-IN')}</div>
  </div>
</div>

<div class="title-bar">
  <h1>Loan Application Details</h1>
  <span class="status">${fmt(loan.status)}</span>
</div>

<!-- Applicant Details -->
<div class="section">
  <div class="section-title">👤 Applicant Information</div>
  <div class="grid">
    <div class="field"><div class="label">Customer ID</div><div class="value">${fmt(loan.customer_id)}</div></div>
    <div class="field"><div class="label">Loan Number</div><div class="value">${fmt(loan.loan_number)}</div></div>
    <div class="field"><div class="label">Applicant Name</div><div class="value">${fmt(loan.applicant_name)}</div></div>
    <div class="field"><div class="label">Mobile</div><div class="value">${fmt(loan.mobile)}</div></div>
    <div class="field"><div class="label">Co-Applicant</div><div class="value">${fmt(loan.co_applicant_name)}</div></div>
    <div class="field"><div class="label">Co-Applicant Mobile</div><div class="value">${fmt(loan.co_applicant_mobile)}</div></div>
    <div class="field"><div class="label">Guarantor</div><div class="value">${fmt(loan.guarantor_name)}</div></div>
    <div class="field"><div class="label">Guarantor Mobile</div><div class="value">${fmt(loan.guarantor_mobile)}</div></div>
    <div class="field field-full"><div class="label">Current Address</div><div class="value">${fmt(loan.current_address || loan.address)}</div></div>
    <div class="field"><div class="label">Village</div><div class="value">${fmt(loan.current_village)}</div></div>
    <div class="field"><div class="label">District</div><div class="value">${fmt(loan.current_district)}</div></div>
  </div>
</div>

<!-- Vehicle Details -->
<div class="section">
  <div class="section-title">🚗 Vehicle Details</div>
  <div class="grid">
    <div class="field"><div class="label">Registration No</div><div class="value">${fmt(loan.vehicle_number)}</div></div>
    <div class="field"><div class="label">Maker</div><div class="value">${fmt(loan.maker_name || loan.car_make)}</div></div>
    <div class="field"><div class="label">Model / Variant</div><div class="value">${fmt(loan.model_variant_name || loan.car_model)}</div></div>
    <div class="field"><div class="label">Mfg Year</div><div class="value">${fmt(loan.mfg_year)}</div></div>
    <div class="field"><div class="label">Vertical</div><div class="value">${fmt(loan.vertical)}</div></div>
    <div class="field"><div class="label">Scheme</div><div class="value">${fmt(loan.scheme)}</div></div>
    <div class="field"><div class="label">Valuation</div><div class="value">${fmtCur(loan.valuation)}</div></div>
    <div class="field"><div class="label">On Road Price</div><div class="value">${fmtCur(loan.on_road_price)}</div></div>
  </div>
</div>

<!-- Loan & EMI Details -->
<div class="section">
  <div class="section-title">💰 Loan & EMI Details</div>
  <div class="grid">
    <div class="field"><div class="label">Loan Amount</div><div class="value">${fmtCur(loan.loan_amount)}</div></div>
    <div class="field"><div class="label">Grid</div><div class="value">${fmtCur(loan.grid)}</div></div>
    <div class="field"><div class="label">LTV</div><div class="value">${loan.ltv ? loan.ltv + '%' : '—'}</div></div>
    <div class="field"><div class="label">IRR</div><div class="value">${loan.irr ? loan.irr + '%' : (loan.interest_rate ? loan.interest_rate + '%' : '—')}</div></div>
    <div class="field"><div class="label">Tenure</div><div class="value">${loan.tenure ? loan.tenure + ' months' : '—'}</div></div>
    <div class="field"><div class="label">EMI Mode</div><div class="value">${fmt(loan.emi_mode || 'Monthly')}</div></div>
    <div class="field"><div class="label">Monthly EMI</div><div class="value">${fmtCur(loan.emi_amount || loan.emi)}</div></div>
    <div class="field"><div class="label">Total EMI</div><div class="value">${fmt(loan.total_emi || loan.tenure)}</div></div>
    <div class="field"><div class="label">Total Interest</div><div class="value">${fmtCur(loan.total_interest)}</div></div>
    <div class="field"><div class="label">First EMI Date</div><div class="value">${formatDate(loan.first_installment_due_date)}</div></div>
    <div class="field"><div class="label">Down Payment</div><div class="value">${fmtCur(loan.down_payment)}</div></div>
    <div class="field"><div class="label">Advance EMI</div><div class="value">${fmt(loan.advance_emi)}</div></div>
  </div>
</div>

<!-- Financier & Insurance -->
<div class="section">
  <div class="section-title">🏦 Financier & Insurance</div>
  <div class="grid">
    <div class="field"><div class="label">Assigned Bank</div><div class="value">${fmt(loan.banks?.name)}</div></div>
    <div class="field"><div class="label">Financier Executive</div><div class="value">${fmt(loan.financier_executive_name)}</div></div>
    <div class="field"><div class="label">Branch</div><div class="value">${fmt(loan.disburse_branch_name)}</div></div>
    <div class="field"><div class="label">Branch Manager</div><div class="value">${fmt(loan.branch_manager_name)}</div></div>
    <div class="field"><div class="label">Insurance Company</div><div class="value">${fmt(loan.insurance_company_name)}</div></div>
    <div class="field"><div class="label">IDV</div><div class="value">${fmtCur(loan.idv)}</div></div>
    <div class="field"><div class="label">Premium</div><div class="value">${fmtCur(loan.premium_amount)}</div></div>
    <div class="field"><div class="label">Insurance Type</div><div class="value">${fmt(loan.insurance_type)}</div></div>
  </div>
</div>

<!-- Deductions & Disbursement -->
<div class="section">
  <div class="section-title">📋 Deductions & Disbursement</div>
  <div class="grid">
    <div class="field"><div class="label">File Charge</div><div class="value">${fmtCur(loan.file_charge)}</div></div>
    <div class="field"><div class="label">Loan Suraksha</div><div class="value">${fmtCur(loan.loan_suraksha)}</div></div>
    <div class="field"><div class="label">Stamping</div><div class="value">${fmtCur(loan.stamping)}</div></div>
    <div class="field"><div class="label">Processing Fee</div><div class="value">${fmtCur(loan.processing_fee)}</div></div>
    <div class="field"><div class="label">Total Deduction</div><div class="value">${fmtCur(loan.total_deduction)}</div></div>
    <div class="field"><div class="label">Net Disbursement</div><div class="value">${fmtCur(loan.net_disbursement_amount)}</div></div>
    <div class="field"><div class="label">Payment Received</div><div class="value">${formatDate(loan.payment_received_date)}</div></div>
    <div class="field"><div class="label">Disburse Date</div><div class="value">${formatDate(loan.financier_disburse_date)}</div></div>
  </div>
</div>

<!-- Important Dates -->
<div class="section">
  <div class="section-title">📅 Important Dates</div>
  <div class="grid">
    <div class="field"><div class="label">Login Date</div><div class="value">${formatDate(loan.login_date)}</div></div>
    <div class="field"><div class="label">Approval Date</div><div class="value">${formatDate(loan.approval_date)}</div></div>
    <div class="field"><div class="label">Disburse Date</div><div class="value">${formatDate(loan.financier_disburse_date)}</div></div>
    <div class="field"><div class="label">TAT</div><div class="value">${loan.tat ? loan.tat + ' days' : '—'}</div></div>
    <div class="field"><div class="label">Agreement Date</div><div class="value">${formatDate(loan.agreement_date)}</div></div>
    <div class="field"><div class="label">File Stage</div><div class="value">${fmt(loan.file_stage)}</div></div>
    <div class="field"><div class="label">Created</div><div class="value">${formatDate(loan.created_at)}</div></div>
    <div class="field"><div class="label">Last Updated</div><div class="value">${formatDate(loan.updated_at)}</div></div>
  </div>
</div>

<!-- RTO Details -->
<div class="section">
  <div class="section-title">📄 RTO Details</div>
  <div class="grid">
    <div class="field"><div class="label">RC Owner</div><div class="value">${fmt(loan.rc_owner_name)}</div></div>
    <div class="field"><div class="label">RC Mfg Date</div><div class="value">${fmt(loan.rc_mfg_date)}</div></div>
    <div class="field"><div class="label">HPN at Login</div><div class="value">${fmt(loan.hpn_at_login)}</div></div>
    <div class="field"><div class="label">New Financier</div><div class="value">${fmt(loan.new_financier)}</div></div>
    <div class="field"><div class="label">RTO Agent</div><div class="value">${fmt(loan.rto_agent_name)}</div></div>
    <div class="field"><div class="label">Agent Mobile</div><div class="value">${fmt(loan.agent_mobile_no)}</div></div>
    <div class="field"><div class="label">DTO Location</div><div class="value">${fmt(loan.dto_location)}</div></div>
    <div class="field"><div class="label">Challan</div><div class="value">${fmt(loan.challan)}</div></div>
  </div>
</div>

<!-- Signature Area -->
<div class="sig-area">
  <div class="sig-box"><div class="sig-line">Applicant Signature</div></div>
  <div class="sig-box"><div class="sig-line">Co-Applicant Signature</div></div>
  <div class="sig-box"><div class="sig-line">Authorized Signatory</div></div>
</div>

<div class="footer">
  <span>Generated on ${new Date().toLocaleString('en-IN')} • Mehar Finance</span>
  <span>This is a system-generated document</span>
</div>

</body></html>`;
}

export function exportLoanPDF(loan: LoanData) {
  const win = window.open('', '_blank');
  if (!win) return;
  const html = buildLoanHTML(loan);
  win.document.write(html);
  win.document.close();
  setTimeout(() => win.print(), 500);
}

export async function shareLoanPDF(loan: LoanData) {
  const html = buildLoanHTML(loan);
  const text = `*Mehar Finance - Loan Application*\n\n*ID:* ${loan.id}\n*Applicant:* ${loan.applicant_name}\n*Mobile:* ${loan.mobile}\n*Vehicle:* ${loan.maker_name || loan.car_make || ''} ${loan.model_variant_name || loan.car_model || ''}\n*Loan Amount:* ${fmtCur(loan.loan_amount)}\n*Status:* ${loan.status}\n*EMI:* ${fmtCur(loan.emi_amount || loan.emi)}\n*Tenure:* ${loan.tenure} months`;

  // Try Web Share API with HTML file attachment
  if (navigator.share && navigator.canShare) {
    try {
      const blob = new Blob([html], { type: 'text/html' });
      const file = new File([blob], `Loan-${loan.id}.html`, { type: 'text/html' });
      const shareData: ShareData = { title: `Loan Application - ${loan.id}`, text, files: [file] };

      if (navigator.canShare(shareData)) {
        await navigator.share(shareData);
        return;
      }
    } catch (e) {
      // User cancelled or not supported
    }
  }

  // Fallback: WhatsApp text share
  const waText = `*Mehar Finance - Loan Application*%0A%0A*ID:* ${loan.id}%0A*Applicant:* ${loan.applicant_name}%0A*Mobile:* ${loan.mobile}%0A*Vehicle:* ${loan.maker_name || loan.car_make || ''} ${loan.model_variant_name || loan.car_model || ''}%0A*Loan Amount:* ${fmtCur(loan.loan_amount)}%0A*Status:* ${loan.status}%0A*EMI:* ${fmtCur(loan.emi_amount || loan.emi)}%0A*Tenure:* ${loan.tenure} months`;
  window.open(`https://wa.me/?text=${waText}`, '_blank');
}
