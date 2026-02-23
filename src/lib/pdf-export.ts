import { formatCurrency } from '@/lib/mock-data';
import html2pdf from 'html2pdf.js';

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

function row4(l1: string, v1: string, l2: string, v2: string, l3: string, v3: string, l4: string, v4: string): string {
  return `<tr>
    <td class="lbl">${l1}</td><td class="val">${v1}</td>
    <td class="lbl">${l2}</td><td class="val">${v2}</td>
    <td class="lbl">${l3}</td><td class="val">${v3}</td>
    <td class="lbl">${l4}</td><td class="val">${v4}</td>
  </tr>`;
}

function sectionTitle(icon: string, title: string): string {
  return `<tr><td colspan="8" class="sec-title">${icon} ${title}</td></tr>`;
}

function buildLoanHTML(loan: LoanData): string {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Loan Application - ${loan.id}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: Arial, Helvetica, sans-serif; color: #1a1a2e; font-size: 10px; line-height: 1.4; padding: 10px; }
  
  .hdr-table { width: 100%; border-collapse: collapse; margin-bottom: 8px; border-bottom: 2px solid #1a3a6b; padding-bottom: 6px; }
  .hdr-table td { vertical-align: middle; padding: 4px; }
  .company-name { font-size: 18px; font-weight: 800; color: #1a3a6b; }
  .company-sub { font-size: 9px; color: #666; }
  .hdr-right { text-align: right; }
  .hdr-lbl { font-size: 8px; color: #888; text-transform: uppercase; letter-spacing: 0.5px; }
  .hdr-val { font-size: 12px; font-weight: 700; color: #1a3a6b; }

  .title-bar { background: #1a3a6b; color: #fff; padding: 6px 12px; margin-bottom: 8px; }
  .title-bar table { width: 100%; }
  .title-bar td { color: #fff; }
  .title-bar .t-left { font-size: 13px; font-weight: 700; }
  .title-bar .t-right { text-align: right; font-size: 9px; font-weight: 600; text-transform: uppercase; background: rgba(255,255,255,0.2); padding: 2px 8px; border-radius: 10px; }

  .data-table { width: 100%; border-collapse: collapse; margin-bottom: 6px; }
  .data-table td { padding: 3px 5px; border: 1px solid #e0e4ea; vertical-align: top; }
  .data-table .lbl { font-size: 7px; color: #888; text-transform: uppercase; letter-spacing: 0.3px; width: 9%; background: #f8f9fb; }
  .data-table .val { font-size: 10px; font-weight: 600; color: #1a1a2e; width: 16%; word-break: break-word; }
  .data-table .sec-title { font-size: 10px; font-weight: 700; color: #1a3a6b; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid #1a3a6b; background: #f0f4f8; padding: 5px; }

  .sig-table { width: 100%; margin-top: 25px; border-collapse: collapse; }
  .sig-table td { width: 33%; text-align: center; padding-top: 40px; border-top: 1px solid #333; font-size: 9px; color: #555; }

  .footer-table { width: 100%; margin-top: 12px; border-top: 1.5px solid #e8ecf1; padding-top: 6px; }
  .footer-table td { font-size: 8px; color: #999; padding: 2px; }
</style></head><body>

<table class="hdr-table">
  <tr>
    <td style="width:70%">
      <span class="company-name">Mehar Finance</span><br/>
      <span class="company-sub">Vehicle Loan Solutions &bull; Since 2015</span>
    </td>
    <td class="hdr-right">
      <span class="hdr-lbl">Application ID</span><br/>
      <span class="hdr-val">${loan.id}</span><br/>
      <span class="hdr-lbl">Date</span><br/>
      <span class="hdr-val" style="font-size:11px">${new Date().toLocaleDateString('en-IN')}</span>
    </td>
  </tr>
</table>

<div class="title-bar">
  <table><tr>
    <td class="t-left">Loan Application Details</td>
    <td><span class="t-right">${fmt(loan.status)}</span></td>
  </tr></table>
</div>

<table class="data-table">
  ${sectionTitle('&#128100;', 'Applicant Information')}
  ${row4('Customer ID', fmt(loan.customer_id), 'Loan Number', fmt(loan.loan_number), 'Applicant Name', fmt(loan.applicant_name), 'Mobile', fmt(loan.mobile))}
  ${row4('Co-Applicant', fmt(loan.co_applicant_name), 'Co-App Mobile', fmt(loan.co_applicant_mobile), 'Guarantor', fmt(loan.guarantor_name), 'Guarantor Mobile', fmt(loan.guarantor_mobile))}
  <tr>
    <td class="lbl">Address</td><td class="val" colspan="3">${fmt(loan.current_address || loan.address)}</td>
    <td class="lbl">Village</td><td class="val">${fmt(loan.current_village)}</td>
    <td class="lbl">District</td><td class="val">${fmt(loan.current_district)}</td>
  </tr>

  ${sectionTitle('&#128663;', 'Vehicle Details')}
  ${row4('Reg. No', fmt(loan.vehicle_number), 'Maker', fmt(loan.maker_name || loan.car_make), 'Model/Variant', fmt(loan.model_variant_name || loan.car_model), 'Mfg Year', fmt(loan.mfg_year))}
  ${row4('Vertical', fmt(loan.vertical), 'Scheme', fmt(loan.scheme), 'Valuation', fmtCur(loan.valuation), 'On Road Price', fmtCur(loan.on_road_price))}

  ${sectionTitle('&#128176;', 'Loan & EMI Details')}
  ${row4('Loan Amount', fmtCur(loan.loan_amount), 'Grid', fmtCur(loan.grid), 'LTV', loan.ltv ? loan.ltv + '%' : '—', 'IRR', loan.irr ? loan.irr + '%' : (loan.interest_rate ? loan.interest_rate + '%' : '—'))}
  ${row4('Tenure', loan.tenure ? loan.tenure + ' months' : '—', 'EMI Mode', fmt(loan.emi_mode || 'Monthly'), 'Monthly EMI', fmtCur(loan.emi_amount || loan.emi), 'Total EMI', fmt(loan.total_emi || loan.tenure))}
  ${row4('Total Interest', fmtCur(loan.total_interest), 'First EMI Date', formatDate(loan.first_installment_due_date), 'Down Payment', fmtCur(loan.down_payment), 'Advance EMI', fmt(loan.advance_emi))}

  ${sectionTitle('&#127974;', 'Financier & Insurance')}
  ${row4('Assigned Bank', fmt(loan.banks?.name), 'Financier Exec.', fmt(loan.financier_executive_name), 'Branch', fmt(loan.disburse_branch_name), 'Branch Manager', fmt(loan.branch_manager_name))}
  ${row4('Insurance Co.', fmt(loan.insurance_company_name), 'IDV', fmtCur(loan.idv), 'Premium', fmtCur(loan.premium_amount), 'Insurance Type', fmt(loan.insurance_type))}

  ${sectionTitle('&#128203;', 'Deductions & Disbursement')}
  ${row4('File Charge', fmtCur(loan.file_charge), 'Loan Suraksha', fmtCur(loan.loan_suraksha), 'Stamping', fmtCur(loan.stamping), 'Processing Fee', fmtCur(loan.processing_fee))}
  ${row4('Total Deduction', fmtCur(loan.total_deduction), 'Net Disbursement', fmtCur(loan.net_disbursement_amount), 'Payment Recd.', formatDate(loan.payment_received_date), 'Disburse Date', formatDate(loan.financier_disburse_date))}

  ${sectionTitle('&#128197;', 'Important Dates')}
  ${row4('Login Date', formatDate(loan.login_date), 'Approval Date', formatDate(loan.approval_date), 'Disburse Date', formatDate(loan.financier_disburse_date), 'TAT', loan.tat ? loan.tat + ' days' : '—')}
  ${row4('Agreement Date', formatDate(loan.agreement_date), 'File Stage', fmt(loan.file_stage), 'Created', formatDate(loan.created_at), 'Last Updated', formatDate(loan.updated_at))}

  ${sectionTitle('&#128196;', 'RTO Details')}
  ${row4('RC Owner', fmt(loan.rc_owner_name), 'RC Mfg Date', fmt(loan.rc_mfg_date), 'HPN at Login', fmt(loan.hpn_at_login), 'New Financier', fmt(loan.new_financier))}
  ${row4('RTO Agent', fmt(loan.rto_agent_name), 'Agent Mobile', fmt(loan.agent_mobile_no), 'DTO Location', fmt(loan.dto_location), 'Challan', fmt(loan.challan))}
</table>

<table class="sig-table">
  <tr>
    <td>Applicant Signature</td>
    <td>Co-Applicant Signature</td>
    <td>Authorized Signatory</td>
  </tr>
</table>

<table class="footer-table">
  <tr>
    <td>Generated on ${new Date().toLocaleString('en-IN')} &bull; Mehar Finance</td>
    <td style="text-align:right">This is a system-generated document</td>
  </tr>
</table>

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

async function generatePDFBlob(loan: LoanData): Promise<Blob> {
  const html = buildLoanHTML(loan);
  
  // Use an iframe to properly render the full HTML document
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.left = '-9999px';
  iframe.style.width = '794px';
  iframe.style.height = '1123px';
  iframe.style.border = 'none';
  document.body.appendChild(iframe);

  const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
  if (!iframeDoc) {
    document.body.removeChild(iframe);
    throw new Error('Could not create iframe document');
  }

  iframeDoc.open();
  iframeDoc.write(html);
  iframeDoc.close();

  // Wait for content to render
  await new Promise(r => setTimeout(r, 1000));

  const body = iframeDoc.body;

  const blob: Blob = await html2pdf()
    .set({
      margin: [10, 10, 10, 10],
      filename: `Loan-${loan.id}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, windowWidth: 794 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    })
    .from(body)
    .outputPdf('blob');

  document.body.removeChild(iframe);
  return blob;
}

export async function shareLoanPDF(loan: LoanData) {
  const text = `*Mehar Finance - Loan Application*\n\n*ID:* ${loan.id}\n*Applicant:* ${loan.applicant_name}\n*Mobile:* ${loan.mobile}\n*Vehicle:* ${loan.maker_name || loan.car_make || ''} ${loan.model_variant_name || loan.car_model || ''}\n*Loan Amount:* ${fmtCur(loan.loan_amount)}\n*Status:* ${loan.status}\n*EMI:* ${fmtCur(loan.emi_amount || loan.emi)}\n*Tenure:* ${loan.tenure} months`;

  try {
    const pdfBlob = await generatePDFBlob(loan);
    const pdfFile = new File([pdfBlob], `Loan-${loan.id}.pdf`, { type: 'application/pdf' });

    if (navigator.share && navigator.canShare) {
      const shareData: ShareData = { title: `Loan Application - ${loan.id}`, text, files: [pdfFile] };
      if (navigator.canShare(shareData)) {
        await navigator.share(shareData);
        return;
      }
    }
  } catch (e) {
    // User cancelled or not supported
  }

  // Fallback: WhatsApp text share
  const waText = `*Mehar Finance - Loan Application*%0A%0A*ID:* ${loan.id}%0A*Applicant:* ${loan.applicant_name}%0A*Mobile:* ${loan.mobile}%0A*Vehicle:* ${loan.maker_name || loan.car_make || ''} ${loan.model_variant_name || loan.car_model || ''}%0A*Loan Amount:* ${fmtCur(loan.loan_amount)}%0A*Status:* ${loan.status}%0A*EMI:* ${fmtCur(loan.emi_amount || loan.emi)}%0A*Tenure:* ${loan.tenure} months`;
  window.open(`https://wa.me/?text=${waText}`, '_blank');
}

export async function downloadLoanPDF(loan: LoanData) {
  const pdfBlob = await generatePDFBlob(loan);
  const url = URL.createObjectURL(pdfBlob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Loan-${loan.id}-${loan.applicant_name?.replace(/\s+/g, '_') || 'Application'}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
