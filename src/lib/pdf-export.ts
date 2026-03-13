import { formatCurrency } from '@/lib/utils';
import { jsPDF } from 'jspdf';
import logoImg from '@/assets/logo.png';

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
  .logo { height: 40px; width: auto; }
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
      <img src="/src/assets/logo.png" alt="Mehar Finance" class="logo" onerror="this.style.display='none'"/>
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
  ${row4('Our Branch', fmt(loan.our_branch), 'Income Source', fmt(loan.income_source), 'Monthly Income', fmtCur(loan.monthly_income), '', '')}
  <tr>
    <td class="lbl">Current Address</td><td class="val" colspan="3">${fmt(loan.current_address || loan.address)}</td>
    <td class="lbl">Village</td><td class="val">${fmt(loan.current_village)}</td>
    <td class="lbl">Tehsil</td><td class="val">${fmt(loan.current_tehsil)}</td>
  </tr>
  ${row4('District', fmt(loan.current_district), 'State', fmt(loan.current_state), 'Pincode', fmt(loan.current_pincode), '', '')}
  <tr>
    <td class="lbl">Permanent Address</td><td class="val" colspan="3">${fmt(loan.permanent_address)}</td>
    <td class="lbl">Perm. Village</td><td class="val">${fmt(loan.permanent_village)}</td>
    <td class="lbl">Perm. Tehsil</td><td class="val">${fmt(loan.permanent_tehsil)}</td>
  </tr>
  ${row4('Perm. District', fmt(loan.permanent_district), 'Perm. State', fmt(loan.permanent_state), 'Perm. Pincode', fmt(loan.permanent_pincode), '', '')}

  ${sectionTitle('&#128663;', 'Vehicle Details')}
  ${row4('Reg. No', fmt(loan.vehicle_number), 'Maker', fmt(loan.maker_name || loan.car_make), 'Model/Variant', fmt(loan.model_variant_name || loan.car_model), 'Mfg Year', fmt(loan.mfg_year))}
  ${row4('Vertical', fmt(loan.vertical), 'Scheme', fmt(loan.scheme), 'Loan Type', fmt(loan.loan_type_vehicle), '', '')}

  ${sectionTitle('&#128176;', 'Loan & EMI Details')}
  ${row4('Purpose Loan Amt', fmtCur(loan.purpose_loan_amount), 'Actual Loan Amt', fmtCur(loan.loan_amount), 'LTV', loan.ltv ? loan.ltv + '%' : '—', 'IRR', loan.irr ? loan.irr + '%' : (loan.interest_rate ? loan.interest_rate + '%' : '—'))}
  ${row4('Tenure', loan.tenure_months || loan.tenure ? (loan.tenure_months || loan.tenure) + ' months' : '—', 'EMI Mode', fmt(loan.emi_mode || 'Monthly'), 'Monthly EMI', fmtCur(loan.emi_amount || loan.emi), 'Total Interest', fmtCur(loan.total_interest))}
  ${row4('EMI Start Date', formatDate(loan.emi_start_date), 'EMI End Date', formatDate(loan.emi_end_date), 'Processing Fee', fmtCur(loan.processing_fee), '', '')}

  ${sectionTitle('&#127974;', 'Financier & Insurance')}
  ${row4('Financier Name', fmt(loan.bank_name || loan.assigned_bank_name || loan.banks?.name), 'Executive Name', fmt(loan.financier_executive_name), 'Team Vertical', fmt(loan.financier_team_vertical), 'Disburse Branch', fmt(loan.disburse_branch_name))}
  ${row4('Broker', fmt(loan.assigned_broker_name || loan.brokers?.name), 'Sanction Amount', fmtCur(loan.sanction_amount), 'Sanction Date', formatDate(loan.sanction_date), '', '')}
  ${row4('Insurance Co.', fmt(loan.insurance_company_name), 'Premium', fmtCur(loan.premium_amount), 'Insurance Expiry', formatDate(loan.insurance_date), 'Policy Number', fmt(loan.insurance_policy_number))}
  ${row4('Insurance Made By', fmt(loan.insurance_made_by), 'Reminder Enabled', loan.insurance_reminder_enabled ? 'Yes' : 'No', '', '', '', '')}

  ${sectionTitle('&#128203;', 'Deductions & Disbursement')}
  ${row4('Mehar Deduction', fmtCur(loan.mehar_deduction), 'Mehar PF', fmtCur(loan.mehar_pf), 'Total Deduction', fmtCur(loan.total_deduction), '', '')}
  ${row4('Hold Amount', fmtCur(loan.hold_amount), 'Net Seed Amount', fmtCur(loan.net_seed_amount), 'Payment In Favour', fmt(loan.payment_in_favour), 'Net Disbursement', fmtCur(loan.net_disbursement_amount))}
  ${row4('Payment Received', formatDate(loan.payment_received_date), '', '', '', '', '', '')}

  ${sectionTitle('&#128197;', 'Important Dates')}
  ${row4('Login Date', formatDate(loan.login_date), 'Approval Date', formatDate(loan.approval_date), 'Sourcing Person', fmt(loan.sourcing_person_name), '', '')}
  ${row4('Created', formatDate(loan.created_at), 'Last Updated', formatDate(loan.updated_at), '', '', '', '')}

  ${sectionTitle('&#128196;', 'RTO Details')}
  ${row4('RC Owner', fmt(loan.rc_owner_name), 'HPN Status', fmt(loan.hpn_at_login), 'RTO Agent', fmt(loan.rto_agent_name), 'Agent Mobile', fmt(loan.agent_mobile_no))}
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

function generatePDFBlob(loan: LoanData): Blob {
  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
  const pw = 190; // printable width (A4 210 - 10*2 margins)
  const lm = 10; // left margin
  let y = 12;

  const colors = { primary: [26, 58, 107] as [number, number, number], dark: [26, 26, 46] as [number, number, number], gray: [136, 136, 136] as [number, number, number], light: [232, 236, 241] as [number, number, number], white: [255, 255, 255] as [number, number, number] };

  // Header with logo
  try {
    doc.addImage(logoImg, 'PNG', lm, y - 4, 15, 15);
  } catch (e) { /* Logo load failed */ }
  doc.setFontSize(18); doc.setFont('helvetica', 'bold'); doc.setTextColor(...colors.primary);
  doc.text('Mehar Finance', lm + 18, y);
  doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(...colors.gray);
  doc.text('Vehicle Loan Solutions • Since 2015', lm, y + 5);

  doc.setFontSize(7); doc.setTextColor(...colors.gray);
  doc.text('Application ID', lm + pw, y - 4, { align: 'right' });
  doc.setFontSize(11); doc.setFont('helvetica', 'bold'); doc.setTextColor(...colors.primary);
  doc.text(String(loan.id || ''), lm + pw, y + 1, { align: 'right' });
  doc.setFontSize(7); doc.setFont('helvetica', 'normal'); doc.setTextColor(...colors.gray);
  doc.text('Date', lm + pw, y + 5, { align: 'right' });
  doc.setFontSize(10); doc.setFont('helvetica', 'bold'); doc.setTextColor(...colors.primary);
  doc.text(new Date().toLocaleDateString('en-IN'), lm + pw, y + 10, { align: 'right' });

  y += 14;
  doc.setDrawColor(...colors.primary); doc.setLineWidth(0.5); doc.line(lm, y, lm + pw, y);
  y += 6;

  // Title bar
  doc.setFillColor(...colors.primary); doc.rect(lm, y, pw, 8, 'F');
  doc.setFontSize(11); doc.setFont('helvetica', 'bold'); doc.setTextColor(...colors.white);
  doc.text('Loan Application Details', lm + 4, y + 5.5);
  doc.setFontSize(8); doc.text(fmt(loan.status).toUpperCase(), lm + pw - 4, y + 5.5, { align: 'right' });
  y += 12;

  // Helper to draw a modern 3-column section
  function drawSection(title: string, rawFields: [string, string][]) {
    const fields = rawFields.filter(f => f[0] !== ''); // Remove empty placeholders
    const columns = 3;
    const rowCount = Math.ceil(fields.length / columns);
    const rowHeight = 10;
    const needed = 8 + rowCount * rowHeight;

    // Check page break
    if (y + needed > 280) { doc.addPage(); y = 12; }

    // Section title
    doc.setFillColor(240, 244, 248); doc.rect(lm, y, pw, 7, 'F');
    doc.setDrawColor(...colors.primary); doc.setLineWidth(0.5); doc.line(lm, y + 7, lm + pw, y + 7);
    doc.setFontSize(8.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(...colors.primary);
    doc.text(title, lm + 3, y + 5);
    y += 8;

    const colW = pw / columns;
    for (let i = 0; i < fields.length; i += columns) {
      const rowFields = fields.slice(i, i + columns);
      // Draw cells
      for (let j = 0; j < columns; j++) {
        const x = lm + j * colW;
        doc.setDrawColor(...colors.light); doc.setLineWidth(0.2);
        doc.rect(x, y, colW, rowHeight);

        if (rowFields[j]) {
          doc.setFontSize(6.5); doc.setFont('helvetica', 'normal'); doc.setTextColor(...colors.gray);
          doc.text(rowFields[j][0], x + 2, y + 3.5);
          doc.setFontSize(9); doc.setFont('helvetica', 'bold'); doc.setTextColor(...colors.dark);

          // Truncate/wrap logic handled by jsPDF maxWidth
          doc.text(rowFields[j][1], x + 2, y + 7.5, { maxWidth: colW - 4 });
        }
      }
      y += rowHeight;
    }
    y += 4;
  }

  drawSection('APPLICANT INFORMATION', [
    ['Customer ID', fmt(loan.customer_id)], ['Loan Number', fmt(loan.loan_number)], ['Applicant Name', fmt(loan.applicant_name)],
    ['Mobile', fmt(loan.mobile)], ['Our Branch', fmt(loan.our_branch)], ['Income Source', fmt(loan.income_source)],
    ['Monthly Income', fmtCur(loan.monthly_income)], ['Current Address', fmt(loan.current_address || loan.address)],
    ['Village', fmt(loan.current_village)], ['Tehsil', fmt(loan.current_tehsil)], ['District', fmt(loan.current_district)],
    ['State', fmt(loan.current_state)], ['Pincode', fmt(loan.current_pincode)], ['Permanent Address', fmt(loan.permanent_address)],
    ['Perm. Village', fmt(loan.permanent_village)], ['Perm. Tehsil', fmt(loan.permanent_tehsil)], ['Perm. District', fmt(loan.permanent_district)],
    ['Perm. State', fmt(loan.permanent_state)], ['Perm. Pincode', fmt(loan.permanent_pincode)]
  ]);

  drawSection('VEHICLE DETAILS', [
    ['Reg. No', fmt(loan.vehicle_number)], ['Maker', fmt(loan.maker_name || loan.car_make)], ['Model/Variant', fmt(loan.model_variant_name || loan.car_model)],
    ['Mfg Year', fmt(loan.mfg_year)], ['Vertical', fmt(loan.vertical)], ['Scheme', fmt(loan.scheme)], ['Loan Type', fmt(loan.loan_type_vehicle)]
  ]);

  drawSection('LOAN & EMI DETAILS', [
    ['Purpose Loan Amt', fmtCur(loan.purpose_loan_amount)], ['Actual Loan Amt', fmtCur(loan.loan_amount)], ['LTV', loan.ltv ? loan.ltv + '%' : '—'],
    ['IRR', loan.irr ? loan.irr + '%' : (loan.interest_rate ? loan.interest_rate + '%' : '—')], ['Tenure', loan.tenure_months || loan.tenure ? (loan.tenure_months || loan.tenure) + ' months' : '—'],
    ['EMI Mode', fmt(loan.emi_mode || 'Monthly')], ['Monthly EMI', fmtCur(loan.emi_amount || loan.emi)], ['Total Interest', fmtCur(loan.total_interest)],
    ['EMI Start Date', formatDate(loan.emi_start_date)], ['EMI End Date', formatDate(loan.emi_end_date)], ['Processing Fee', fmtCur(loan.processing_fee)]
  ]);

  drawSection('FINANCIER & INSURANCE', [
    ['Financier Name', fmt(loan.bank_name || loan.assigned_bank_name || loan.banks?.name)], ['Executive Name', fmt(loan.financier_executive_name)], ['Team Vertical', fmt(loan.financier_team_vertical)],
    ['Disburse Branch', fmt(loan.disburse_branch_name)], ['Broker', fmt(loan.assigned_broker_name || loan.brokers?.name)], ['Sanction Amount', fmtCur(loan.sanction_amount)],
    ['Sanction Date', formatDate(loan.sanction_date)], ['Insurance Co.', fmt(loan.insurance_company_name)], ['Premium', fmtCur(loan.premium_amount)],
    ['Insurance Expiry', formatDate(loan.insurance_date)], ['Policy Number', fmt(loan.insurance_policy_number)], ['Insurance Made By', fmt(loan.insurance_made_by)],
    ['Reminder Enabled', loan.insurance_reminder_enabled ? 'Yes' : 'No']
  ]);

  drawSection('DEDUCTIONS & DISBURSEMENT', [
    ['Mehar Deduction', fmtCur(loan.mehar_deduction)], ['Mehar PF', fmtCur(loan.mehar_pf)], ['Total Deduction', fmtCur(loan.total_deduction)],
    ['Hold Amount', fmtCur(loan.hold_amount)], ['Net Seed Amount', fmtCur(loan.net_seed_amount)], ['Payment In Favour', fmt(loan.payment_in_favour)],
    ['Net Disbursement', fmtCur(loan.net_disbursement_amount)], ['Payment Received', formatDate(loan.payment_received_date)]
  ]);

  drawSection('IMPORTANT DATES', [
    ['Login Date', formatDate(loan.login_date)], ['Approval Date', formatDate(loan.approval_date)], ['Sourcing Person', fmt(loan.sourcing_person_name)],
    ['Created', formatDate(loan.created_at)], ['Last Updated', formatDate(loan.updated_at)]
  ]);

  drawSection('RTO DETAILS', [
    ['RC Owner', fmt(loan.rc_owner_name)], ['HPN Status', fmt(loan.hpn_at_login)], ['RTO Agent', fmt(loan.rto_agent_name)], ['Agent Mobile', fmt(loan.agent_mobile_no)]
  ]);

  // Signature area
  if (y + 25 > 280) { doc.addPage(); y = 12; }
  y += 8;
  const sigW = pw / 3;
  const sigLabels = ['Applicant Signature', 'Co-Applicant Signature', 'Authorized Signatory'];
  sigLabels.forEach((label, i) => {
    const x = lm + i * sigW + sigW / 2;
    doc.setDrawColor(51, 51, 51); doc.setLineWidth(0.3);
    doc.line(lm + i * sigW + 5, y + 15, lm + (i + 1) * sigW - 5, y + 15);
    doc.setFontSize(7); doc.setFont('helvetica', 'normal'); doc.setTextColor(85, 85, 85);
    doc.text(label, x, y + 19, { align: 'center' });
  });
  y += 24;

  // Footer
  doc.setDrawColor(...colors.light); doc.setLineWidth(0.3); doc.line(lm, y, lm + pw, y);
  doc.setFontSize(6); doc.setFont('helvetica', 'normal'); doc.setTextColor(...colors.gray);
  doc.text(`Generated on ${new Date().toLocaleString('en-IN')} • Mehar Finance`, lm, y + 4);
  doc.text('This is a system-generated document', lm + pw, y + 4, { align: 'right' });

  return doc.output('blob');
}

export async function shareLoanPDF(loan: LoanData) {
  const text = `🏦 *MEHAR FINANCE* \n� *Loan Application Document*\n\n` +
    `*ID:* ${loan.id}\n` +
    `*Applicant:* ${loan.applicant_name || '—'}\n` +
    `*Mobile:* ${loan.mobile || '—'}\n\n` +
    `🚗 *Vehicle:*\n${loan.maker_name || loan.car_make || '—'} ${loan.model_variant_name || loan.car_model || '—'}\n` +
    `*Reg No:* ${loan.vehicle_number || '—'}\n\n` +
    `💰 *Loan Info:*\n` +
    `*Amount:* ${fmtCur(loan.loan_amount)}\n` +
    `*EMI:* ${fmtCur(loan.emi_amount || loan.emi)} / ${loan.tenure_months || loan.tenure || '—'}m\n` +
    `*Status:* ${loan.status ? String(loan.status).toUpperCase() : '—'}\n\n` +
    `🏢 *Bank:* ${loan.bank_name || loan.assigned_bank_name || '—'}\n` +
    `📍 *Branch:* ${loan.our_branch || '—'}\n\n` +
    `_Please find the attached PDF for complete details._`;

  try {
    const pdfBlob = generatePDFBlob(loan);
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

  const waText = encodeURIComponent(text);
  window.open(`https://wa.me/?text=${waText}`, '_blank');
}

export function downloadLoanPDF(loan: LoanData) {
  const pdfBlob = generatePDFBlob(loan);
  const url = URL.createObjectURL(pdfBlob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Loan-${loan.id}-${loan.applicant_name?.replace(/\s+/g, '_') || 'Application'}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
