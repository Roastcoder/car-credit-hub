import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { CAR_MAKES, calculateEMI, formatCurrency } from '@/lib/mock-data';
import { ArrowLeft, Calculator } from 'lucide-react';
import { toast } from 'sonner';

export default function CreateLoan() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    { id: 'customer', label: 'Customer Details', icon: '1' },
    { id: 'income', label: 'Income & Agriculture', icon: '2' },
    { id: 'vehicle', label: 'Loan & Vehicle Details', icon: '3' },
    { id: 'emi', label: 'EMI Details', icon: '4' },
    { id: 'financier', label: 'Financier Details', icon: '5' },
    { id: 'insurance', label: 'Insurance Details', icon: '6' },
    { id: 'deduction', label: 'Deduction & Disbursement', icon: '7' },
    { id: 'rto', label: 'RTO', icon: '8' },
    { id: 'documents', label: 'Documents', icon: '9' },
    { id: 'others', label: 'Others', icon: '10' },
  ];

  const { data: banks = [] } = useQuery({
    queryKey: ['banks-list'],
    queryFn: async () => {
      const { data } = await supabase.from('banks').select('id, name').eq('is_active', true).order('name');
      return data ?? [];
    },
  });

  const { data: brokers = [] } = useQuery({
    queryKey: ['brokers-list'],
    queryFn: async () => {
      const { data } = await supabase.from('brokers').select('id, name').eq('is_active', true).order('name');
      return data ?? [];
    },
  });

  const [form, setForm] = useState({
    // Customer Details
    customerId: '', customerName: '', mobile: '', coApplicantName: '', coApplicantMobile: '',
    guarantorName: '', guarantorMobile: '', ourBranch: '',
    currentAddress: '', currentVillage: '', currentTehsil: '', currentDistrict: '', currentPincode: '',
    sameAsCurrentAddress: false,
    permanentAddress: '', permanentVillage: '', permanentTehsil: '', permanentDistrict: '', permanentPincode: '',
    // Loan & Vehicle Details
    loanNumber: '', grid: '', loanAmount: '', actualLoanAmount: '', ltv: '', loanTypeVehicle: '',
    vehicleNumber: '', makerName: '', modelVariantName: '', mfgYear: '', vertical: '', scheme: '',
    // Income Details
    incomeSource: '', monthlyIncome: '', nipIp: 'nip',
    previousTrackDetails: '', loanType: '', trackStatus: '', record: '',
    // Agriculture Details
    agriculture: '',
    // RTO Details
    rcOwnerName: '', rcMfgDate: '', rcExpiryDate: '', hpnAtLogin: '', newFinancier: '', rtoDocsHandoverDate: '',
    rtoAgentName: '', agentMobileNo: '', dtoLocation: '', rtoWorkDescription: '', challan: 'No', fc: 'No', rtoPapers: '',
    // RTO Papers Checkboxes
    rtoRC: false, rtoNOC: false, rtoPermit: false, rtoPollution: false, rto2930Form: false,
    rtoSellAgreement: false, rtoRCOwnerKYC: false, rtoStampPapers: false,
    // EMI Details
    emiAmount: '', totalEmi: '', totalInterest: '', firstEmiAmount: '', firstInstallmentDueDate: '',
    irr: '', tenure: '60', emiMode: 'Monthly', emiStartDate: '', emiEndDate: '', advanceEmi: '',
    principalAmount: '', processingFee: '', bounceCharges: '', penaltyCharges: '',
    // Financier Details
    financierName: '', assignedBankId: '', financierExecutiveName: '', financierTeamVertical: '',
    disburseBranchName: '', branchManagerName: '', assignedBrokerId: '', financierLoanId: '',
    financierContactNo: '', financierEmail: '', financierAddress: '', sanctionAmount: '',
    sanctionDate: '', agreementDate: '', agreementNumber: '',
    // Insurance Details
    insuranceCompanyName: '', insuredName: '', idv: '', insuranceTransfer: '', insuranceHpn: '',
    insuranceMadeBy: '', premiumAmount: '', insuranceDate: '', insuranceRenewalDate: '',
    insurancePolicyNumber: '', insuranceType: '', insuranceCoverageAmount: '', insuranceAgentName: '',
    insuranceAgentContact: '', insuranceNominee: '', insuranceStatus: '',
    // Deductions & Disbursement Details
    fileCharge: '', loanSuraksha: '', stamping: '', valuation: '', deferralCharges: '', gst: '',
    documentationCharges: '', otherCharges: '', totalDeduction: '',
    netReceivedAmount: '', netDisbursementAmount: '', firstPaymentCredited: '', holdAmount: '', paymentReceivedDate: '',
    // Others
    loginDate: '', approvalDate: '', financierDisburseDate: '', tat: '', bookingMode: '', sourcingPersonName: '',
    bookingMonth: '', bookingYear: '', meharDisburseDate: '', remark: '', fileStage: '', fileStatus: 'draft',
    // Documents
    aadharFront: null, aadharBack: null, panCard: null, drivingLicence: null, lightBill: null,
    bankStatement: null, cheque: null, rcFront: null, rcBack: null, incomeProof: null,
    rentAgreement: null, customerPhoto: null, disbursementMemo: null, insurance: null, customerLedger: null,
    coAadharFront: null, coAadharBack: null, coPanCard: null, coPhoto: null,
    guarantorAadharFront: null, guarantorAadharBack: null, guarantorPanCard: null,
    guarantorRcFront: null, guarantorRcBack: null, guarantorPhoto: null,
  });

  const update = (key: string, val: string | File | null) => setForm(f => ({ ...f, [key]: val }));

  const handleSameAddress = (checked: boolean) => {
    setForm(f => ({
      ...f,
      sameAsCurrentAddress: checked,
      ...(checked ? {
        permanentAddress: f.currentAddress,
        permanentVillage: f.currentVillage,
        permanentTehsil: f.currentTehsil,
        permanentDistrict: f.currentDistrict,
        permanentPincode: f.currentPincode,
      } : {})
    }));
  };

  const emi = useMemo(() => {
    const p = Number(form.loanAmount);
    const r = Number(form.irr);
    const t = Number(form.tenure);
    if (p > 0 && r > 0 && t > 0) return calculateEMI(p, r, t);
    return 0;
  }, [form.loanAmount, form.irr, form.tenure]);

  const totalPayable = emi * Number(form.tenure);
  const totalInterest = totalPayable - Number(form.loanAmount);

  const generateLoanId = () => {
    const year = new Date().getFullYear();
    const num = Math.floor(Math.random() * 9000) + 1000;
    return `CL-${year}-${num}`;
  };

  const createLoan = useMutation({
    mutationFn: async () => {
      const loanId = form.loanNumber || generateLoanId();
      const { data, error } = await supabase.from('loans').insert({
        id: loanId,
        // Application Details
        loan_number: loanId,
        applicant_name: form.customerName,
        mobile: form.mobile,
        co_applicant_name: form.coApplicantName,
        co_applicant_mobile: form.coApplicantMobile,
        guarantor_name: form.guarantorName,
        guarantor_mobile: form.guarantorMobile,
        current_address: form.currentAddress,
        permanent_address: form.permanentAddress,
        login_date: form.loginDate || null,
        file_sign_date: form.fileSignDate || null,
        approval_date: form.approvalDate || null,
        disburse_date: form.disburseDate || null,
        disburse_branch_name: form.disburseBranchName,
        our_branch: form.ourBranch,
        remark: form.remark,
        // Vehicle & Product
        vehicle_number: form.vehicleNumber,
        product_name: form.productName,
        model_year: form.model,
        vertical: form.vertical,
        product_code: form.productCode,
        // Loan Details
        loan_amount: Number(form.loanAmount),
        grid: Number(form.grid) || null,
        ltv: Number(form.ltv) || null,
        // Income
        income_source: form.incomeSource,
        monthly_income: Number(form.monthlyIncome) || null,
        nip_ip: form.nipIp,
        // Agriculture
        agriculture: form.agriculture,
        // RTO
        rc_owner_name: form.rcOwnerName,
        rc_mfg_date: form.rcMfgDate,
        rc_expiry_date: form.rcExpiryDate || null,
        hpn_at_login: form.hpnAtLogin,
        hpn_after_pdd: form.hpnAfterPdd,
        rto_rc_handover_date: form.rtoRcHandoverDate || null,
        rto_agent_name: form.rtoAgentName,
        agent_mobile_no: form.agentMobileNo,
        dto_location: form.dtoLocation,
        challan: form.challan,
        rto_papers: form.rtoPapers,
        for_closure: form.forClosure,
        // EMI & Financier
        emi_amount: Number(form.emiAmount) || emi,
        total_emi: Number(form.totalEmi) || Number(form.tenure),
        total_interest: Number(form.totalInterest) || totalInterest,
        first_emi_amount: Number(form.firstEmiAmount) || emi,
        first_installment_due_date: form.firstInstallmentDueDate || null,
        irr: Number(form.irr),
        tenure: Number(form.tenure),
        emi_mode: form.emiMode,
        emi: emi,
        interest_rate: Number(form.irr),
        customer_track_company: form.customerTrackCompany,
        assigned_bank_id: form.assignedBankId || null,
        assigned_broker_id: form.assignedBrokerId || null,
        // Insurance
        insurance_company_name: form.insuranceCompanyName,
        insured_name: form.insuredName,
        idv: Number(form.idv) || null,
        insurance_transfer: form.insuranceTransfer,
        insurance_hpn: form.insuranceHpn,
        insurance_date: form.insuranceDate || null,
        insurance_renewal_date: form.insuranceRenewalDate || null,
        // Deductions
        file_charge: Number(form.fileCharge) || null,
        loan_suraksha: Number(form.loanSuraksha) || null,
        stamping: Number(form.stamping) || null,
        valuation: Number(form.valuation) || null,
        deferral_charges: Number(form.deferralCharges) || null,
        gst: Number(form.gst) || null,
        documentation_charges: Number(form.documentationCharges) || null,
        other_charges: Number(form.otherCharges) || null,
        // Status
        status: form.fileStatus || 'draft',
        created_by: user?.id,
      }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['loans'] });
      queryClient.invalidateQueries({ queryKey: ['loans-dashboard'] });
      toast.success('Loan application created successfully!');
      navigate(`/loans/${data.id}`);
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to create loan');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createLoan.mutate();
  };

  const handleNext = () => currentStep < steps.length - 1 && setCurrentStep(currentStep + 1);
  const handlePrev = () => currentStep > 0 && setCurrentStep(currentStep - 1);

  const inputClass = "w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all";
  const labelClass = "block text-xs font-semibold text-foreground/70 mb-2 uppercase tracking-wide";

  return (
    <div className="w-full max-w-full mx-auto px-4">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
        <ArrowLeft size={16} /> Back
      </button>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">New Loan Application</h1>
        <p className="text-muted-foreground">Step {currentStep + 1} of {steps.length}: {steps[currentStep].label}</p>
      </div>

      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          {steps.map((step, idx) => (
            <div key={step.id} className="flex flex-col items-center flex-1">
              <button
                type="button"
                onClick={() => setCurrentStep(idx)}
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                  idx === currentStep ? 'bg-accent text-accent-foreground scale-110 shadow-lg' :
                  idx < currentStep ? 'bg-accent/30 text-accent' : 'bg-muted text-muted-foreground'
                }`}
              >
                {step.icon}
              </button>
              <span className={`text-xs mt-2 text-center hidden sm:block ${idx === currentStep ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                {step.label}
              </span>
              {idx < steps.length - 1 && <div className={`absolute h-0.5 w-full top-5 left-1/2 -z-10 ${idx < currentStep ? 'bg-accent' : 'bg-border'}`} style={{width: 'calc(100% / 9)'}} />}
            </div>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="bg-card rounded-2xl border border-border p-8 shadow-sm mb-6">
          {/* Step 0: Customer Details */}
          {currentStep === 0 && (
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-6">Customer Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div><label className={labelClass}>Customer ID</label><input className={inputClass} value={form.customerId} onChange={e => update('customerId', e.target.value)} /></div>
                <div><label className={labelClass}>Customer Name *</label><input required className={inputClass} value={form.customerName} onChange={e => update('customerName', e.target.value)} /></div>
                <div><label className={labelClass}>Mobile No *</label><input required className={inputClass} value={form.mobile} onChange={e => update('mobile', e.target.value)} maxLength={10} /></div>
                <div><label className={labelClass}>Co-Applicant Name</label><input className={inputClass} value={form.coApplicantName} onChange={e => update('coApplicantName', e.target.value)} /></div>
                <div><label className={labelClass}>Co-Applicant Mobile</label><input className={inputClass} value={form.coApplicantMobile} onChange={e => update('coApplicantMobile', e.target.value)} /></div>
                <div><label className={labelClass}>Guarantor Name</label><input className={inputClass} value={form.guarantorName} onChange={e => update('guarantorName', e.target.value)} /></div>
                <div><label className={labelClass}>Guarantor Mobile</label><input className={inputClass} value={form.guarantorMobile} onChange={e => update('guarantorMobile', e.target.value)} /></div>
                <div><label className={labelClass}>Our Branch</label><input className={inputClass} value={form.ourBranch} onChange={e => update('ourBranch', e.target.value)} /></div>
                <div className="md:col-span-3 mt-4"><h3 className="font-semibold text-foreground mb-3">Current Address</h3></div>
                <div className="md:col-span-3"><label className={labelClass}>Address</label><textarea className={inputClass} rows={2} value={form.currentAddress} onChange={e => update('currentAddress', e.target.value)} /></div>
                <div><label className={labelClass}>Village</label><input className={inputClass} value={form.currentVillage} onChange={e => update('currentVillage', e.target.value)} /></div>
                <div><label className={labelClass}>Tehsil</label><input className={inputClass} value={form.currentTehsil} onChange={e => update('currentTehsil', e.target.value)} /></div>
                <div><label className={labelClass}>District</label><input className={inputClass} value={form.currentDistrict} onChange={e => update('currentDistrict', e.target.value)} /></div>
                <div><label className={labelClass}>Pincode</label><input className={inputClass} value={form.currentPincode} onChange={e => update('currentPincode', e.target.value)} maxLength={6} /></div>
                <div className="md:col-span-3 mt-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.sameAsCurrentAddress} onChange={e => handleSameAddress(e.target.checked)} className="w-4 h-4 rounded border-border" />
                    <span className="text-sm font-medium text-foreground">Same As Current Address</span>
                  </label>
                </div>
                <div className="md:col-span-3"><h3 className="font-semibold text-foreground mb-3">Permanent Address</h3></div>
                <div className="md:col-span-3"><label className={labelClass}>Address</label><textarea className={inputClass} rows={2} value={form.permanentAddress} onChange={e => update('permanentAddress', e.target.value)} disabled={form.sameAsCurrentAddress} /></div>
                <div><label className={labelClass}>Village</label><input className={inputClass} value={form.permanentVillage} onChange={e => update('permanentVillage', e.target.value)} disabled={form.sameAsCurrentAddress} /></div>
                <div><label className={labelClass}>Tehsil</label><input className={inputClass} value={form.permanentTehsil} onChange={e => update('permanentTehsil', e.target.value)} disabled={form.sameAsCurrentAddress} /></div>
                <div><label className={labelClass}>District</label><input className={inputClass} value={form.permanentDistrict} onChange={e => update('permanentDistrict', e.target.value)} disabled={form.sameAsCurrentAddress} /></div>
                <div><label className={labelClass}>Pincode</label><input className={inputClass} value={form.permanentPincode} onChange={e => update('permanentPincode', e.target.value)} maxLength={6} disabled={form.sameAsCurrentAddress} /></div>
              </div>
            </div>
          )}

          {/* Step 1: Income & Agriculture */}
          {currentStep === 1 && (
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-6">Income & Agriculture Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div><label className={labelClass}>Income Source</label><input className={inputClass} value={form.incomeSource} onChange={e => update('incomeSource', e.target.value)} /></div>
                <div><label className={labelClass}>Monthly Income (₹)</label><input type="number" className={inputClass} value={form.monthlyIncome} onChange={e => update('monthlyIncome', e.target.value)} /></div>
                <div><label className={labelClass}>NIP / IP</label><select className={inputClass} value={form.nipIp} onChange={e => update('nipIp', e.target.value)}><option value="nip">NIP</option><option value="ip">IP</option></select></div>
                <div className="md:col-span-3 mt-4"><h3 className="font-semibold text-foreground mb-3">Repayment Track Details</h3></div>
                <div><label className={labelClass}>Previous Track Details</label><input className={inputClass} value={form.previousTrackDetails} onChange={e => update('previousTrackDetails', e.target.value)} placeholder="NA" /></div>
                <div><label className={labelClass}>Loan Type</label><input className={inputClass} value={form.loanType} onChange={e => update('loanType', e.target.value)} placeholder="NA" /></div>
                <div><label className={labelClass}>Track Status</label><select className={inputClass} value={form.trackStatus} onChange={e => update('trackStatus', e.target.value)}><option value="">Select</option><option value="Closed">Closed</option><option value="Active">Active</option><option value="Overdue">Overdue</option></select></div>
                <div><label className={labelClass}>Record</label><input className={inputClass} value={form.record} onChange={e => update('record', e.target.value)} placeholder="ETR" /></div>
                <div className="md:col-span-3 mt-4"><h3 className="font-semibold text-foreground mb-3">Agriculture Details</h3></div>
                <div className="md:col-span-3"><label className={labelClass}>Agriculture</label><input className={inputClass} value={form.agriculture} onChange={e => update('agriculture', e.target.value)} placeholder="JAMAMANDI" /></div>
              </div>
            </div>
          )}

          {/* Step 2: Loan & Vehicle */}
          {currentStep === 2 && (
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-6">Loan & Vehicle Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-3"><h3 className="font-semibold text-foreground mb-3">Loan Details</h3></div>
                <div><label className={labelClass}>Grid (₹)</label><input type="number" className={inputClass} value={form.grid} onChange={e => update('grid', e.target.value)} /></div>
                <div><label className={labelClass}>Loan Amount (₹) *</label><input required type="number" className={inputClass} value={form.loanAmount} onChange={e => update('loanAmount', e.target.value)} /></div>
                <div><label className={labelClass}>Actual Loan Amount (₹)</label><input type="number" className={inputClass} value={form.actualLoanAmount} onChange={e => update('actualLoanAmount', e.target.value)} /></div>
                <div><label className={labelClass}>LTV (%)</label><input type="number" className={inputClass} value={form.ltv} onChange={e => update('ltv', e.target.value)} /></div>
                <div><label className={labelClass}>Loan Type (Vehicle Basis)</label><select className={inputClass} value={form.loanTypeVehicle} onChange={e => update('loanTypeVehicle', e.target.value)}><option value="">Select</option><option value="New Vehicle Loan">New Vehicle Loan</option><option value="Used Vehicle Loan">Used Vehicle Loan</option></select></div>
                <div className="md:col-span-3 mt-4"><h3 className="font-semibold text-foreground mb-3">Vehicle Details</h3></div>
                <div><label className={labelClass}>Reg. No</label><input className={inputClass} value={form.vehicleNumber} onChange={e => update('vehicleNumber', e.target.value.toUpperCase())} /></div>
                <div><label className={labelClass}>Maker's Name</label><input className={inputClass} value={form.makerName} onChange={e => update('makerName', e.target.value)} /></div>
                <div><label className={labelClass}>Model / Variant Name</label><input className={inputClass} value={form.modelVariantName} onChange={e => update('modelVariantName', e.target.value)} /></div>
                <div><label className={labelClass}>Mfg Year</label><input type="number" className={inputClass} value={form.mfgYear} onChange={e => update('mfgYear', e.target.value)} min="2000" max="2025" /></div>
                <div><label className={labelClass}>Vertical</label><select className={inputClass} value={form.vertical} onChange={e => update('vertical', e.target.value)}><option value="">Select</option><option value="LCV">LCV</option><option value="HCV">HCV</option><option value="PV">PV</option><option value="CV">CV</option></select></div>
                <div><label className={labelClass}>Scheme</label><select className={inputClass} value={form.scheme} onChange={e => update('scheme', e.target.value)}><option value="">Select</option><option value="Re-finance">Re-finance</option><option value="New Finance">New Finance</option><option value="Balance Transfer">Balance Transfer</option></select></div>
              </div>
            </div>
          )}

          {/* Step 3: EMI Details */}
          {currentStep === 3 && (
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-6">EMI Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div><label className={labelClass}>EMI Amount (₹)</label><input type="number" className={inputClass} value={form.emiAmount} onChange={e => update('emiAmount', e.target.value)} placeholder="12683" /></div>
                <div><label className={labelClass}>Total EMI</label><input type="number" className={inputClass} value={form.totalEmi} onChange={e => update('totalEmi', e.target.value)} placeholder="24" /></div>
                <div><label className={labelClass}>Total Interest (₹)</label><input type="number" className={inputClass} value={form.totalInterest} onChange={e => update('totalInterest', e.target.value)} placeholder="74392" /></div>
                <div><label className={labelClass}>First EMI Amount (₹)</label><input type="number" className={inputClass} value={form.firstEmiAmount} onChange={e => update('firstEmiAmount', e.target.value)} placeholder="12683" /></div>
                <div><label className={labelClass}>First Installment Due Date</label><input type="date" className={inputClass} value={form.firstInstallmentDueDate} onChange={e => update('firstInstallmentDueDate', e.target.value)} /></div>
                <div><label className={labelClass}>IRR (%)</label><input type="number" step="0.01" className={inputClass} value={form.irr} onChange={e => update('irr', e.target.value)} placeholder="28.50" /></div>
                <div><label className={labelClass}>Tenure</label><select className={inputClass} value={form.tenure} onChange={e => update('tenure', e.target.value)}>{[12, 18, 24, 36, 48, 60, 72, 84].map(t => <option key={t} value={t}>{t} MONTH</option>)}</select></div>
                <div><label className={labelClass}>EMI Mode</label><select className={inputClass} value={form.emiMode} onChange={e => update('emiMode', e.target.value)}><option value="Monthly">Monthly</option><option value="Quarterly">Quarterly</option></select></div>
              </div>
              {emi > 0 && (
                <div className="mt-6 p-5 rounded-xl bg-gradient-to-br from-accent/5 to-accent/10 border-2 border-accent/20">
                  <div className="flex items-center gap-2 mb-4"><Calculator size={18} className="text-accent" /><span className="text-accent font-bold">EMI Calculator</span></div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-3 rounded-lg bg-background/50"><p className="text-xs text-muted-foreground mb-1">Monthly EMI</p><p className="text-xl font-bold text-accent">{formatCurrency(emi)}</p></div>
                    <div className="text-center p-3 rounded-lg bg-background/50"><p className="text-xs text-muted-foreground mb-1">Total Interest</p><p className="text-xl font-bold text-foreground">{formatCurrency(totalInterest > 0 ? totalInterest : 0)}</p></div>
                    <div className="text-center p-3 rounded-lg bg-background/50"><p className="text-xs text-muted-foreground mb-1">Total Payable</p><p className="text-xl font-bold text-foreground">{formatCurrency(totalPayable)}</p></div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 4: Financier */}
          {currentStep === 4 && (
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-6">Financier Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div><label className={labelClass}>Financier Name</label><select className={inputClass} value={form.assignedBankId} onChange={e => update('assignedBankId', e.target.value)}><option value="">Select Financier</option>{(banks as any[]).map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}</select></div>
                <div><label className={labelClass}>Financier Executive Name</label><input className={inputClass} value={form.financierExecutiveName} onChange={e => update('financierExecutiveName', e.target.value)} placeholder="MANOJ KUMAR" /></div>
                <div><label className={labelClass}>Financier Team Vertical</label><select className={inputClass} value={form.financierTeamVertical} onChange={e => update('financierTeamVertical', e.target.value)}><option value="">Select</option><option value="LCV">LCV</option><option value="HCV">HCV</option><option value="PV">PV</option><option value="CV">CV</option></select></div>
                <div><label className={labelClass}>Disburse Branch Name</label><input className={inputClass} value={form.disburseBranchName} onChange={e => update('disburseBranchName', e.target.value)} placeholder="BIKANER" /></div>
                <div><label className={labelClass}>Branch Manager Name</label><input className={inputClass} value={form.branchManagerName} onChange={e => update('branchManagerName', e.target.value)} placeholder="SHER SINGH" /></div>
              </div>
            </div>
          )}

          {/* Step 5: Insurance */}
          {currentStep === 5 && (
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-6">Insurance Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div><label className={labelClass}>Insurance Company Name</label><input className={inputClass} value={form.insuranceCompanyName} onChange={e => update('insuranceCompanyName', e.target.value)} placeholder="TATA AIG INSURANCE" /></div>
                <div><label className={labelClass}>Insured Name</label><input className={inputClass} value={form.insuredName} onChange={e => update('insuredName', e.target.value)} placeholder="JAGDISH" /></div>
                <div><label className={labelClass}>IDV (₹)</label><input type="number" className={inputClass} value={form.idv} onChange={e => update('idv', e.target.value)} placeholder="269280" /></div>
                <div><label className={labelClass}>Insurance Transfer</label><select className={inputClass} value={form.insuranceTransfer} onChange={e => update('insuranceTransfer', e.target.value)}><option value="">Select</option><option value="Done">Done</option><option value="Pending">Pending</option></select></div>
                <div><label className={labelClass}>Insurance HPN</label><input className={inputClass} value={form.insuranceHpn} onChange={e => update('insuranceHpn', e.target.value)} placeholder="NA" /></div>
                <div><label className={labelClass}>Insurance Made By</label><select className={inputClass} value={form.insuranceMadeBy} onChange={e => update('insuranceMadeBy', e.target.value)}><option value="">Select</option><option value="Customer">Customer</option><option value="Company">Company</option><option value="Agent">Agent</option></select></div>
                <div><label className={labelClass}>Premium Amount (₹)</label><input type="number" className={inputClass} value={form.premiumAmount} onChange={e => update('premiumAmount', e.target.value)} placeholder="17974" /></div>
                <div><label className={labelClass}>Insurance Start Date</label><input type="date" className={inputClass} value={form.insuranceDate} onChange={e => update('insuranceDate', e.target.value)} /></div>
                <div><label className={labelClass}>Insurance Renewal Date</label><input type="date" className={inputClass} value={form.insuranceRenewalDate} onChange={e => update('insuranceRenewalDate', e.target.value)} /></div>
              </div>
            </div>
          )}

          {/* Step 6: Deduction & Disbursement */}
          {currentStep === 6 && (
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-6">Deduction & Disbursement</h2>
              
              {/* Deductions Details */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">Deductions Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div><label className={labelClass}>File Charge (₹)</label><input type="number" className={inputClass} value={form.fileCharge} onChange={e => update('fileCharge', e.target.value)} placeholder="7300" /></div>
                  <div><label className={labelClass}>Loan Suraksha (₹)</label><input type="number" className={inputClass} value={form.loanSuraksha} onChange={e => update('loanSuraksha', e.target.value)} placeholder="3250" /></div>
                  <div><label className={labelClass}>Stamping (₹)</label><input type="number" className={inputClass} value={form.stamping} onChange={e => update('stamping', e.target.value)} placeholder="1200" /></div>
                  <div><label className={labelClass}>Valuation (₹)</label><input type="number" className={inputClass} value={form.valuation} onChange={e => update('valuation', e.target.value)} placeholder="0" /></div>
                  <div><label className={labelClass}>Deferral Charges (₹)</label><input type="number" className={inputClass} value={form.deferralCharges} onChange={e => update('deferralCharges', e.target.value)} placeholder="0" /></div>
                  <div><label className={labelClass}>GST (₹)</label><input type="number" className={inputClass} value={form.gst} onChange={e => update('gst', e.target.value)} placeholder="0" /></div>
                  <div><label className={labelClass}>Documentation Charges (₹)</label><input type="number" className={inputClass} value={form.documentationCharges} onChange={e => update('documentationCharges', e.target.value)} placeholder="1251" /></div>
                  <div><label className={labelClass}>Other Charges (₹)</label><input type="number" className={inputClass} value={form.otherCharges} onChange={e => update('otherCharges', e.target.value)} placeholder="0" /></div>
                  <div><label className={labelClass}>Total Deduction (₹)</label><input type="number" className={inputClass} value={form.totalDeduction} onChange={e => update('totalDeduction', e.target.value)} placeholder="13001" /></div>
                </div>
              </div>

              {/* Disbursement Details */}
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-4">Disbursement Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div><label className={labelClass}>Net Received Amount (₹)</label><input type="number" className={inputClass} value={form.netReceivedAmount} onChange={e => update('netReceivedAmount', e.target.value)} placeholder="216999" /></div>
                  <div><label className={labelClass}>Net Disbursement Amount (₹)</label><input type="number" className={inputClass} value={form.netDisbursementAmount} onChange={e => update('netDisbursementAmount', e.target.value)} placeholder="216999" /></div>
                  <div><label className={labelClass}>1st Payment Credited</label><input className={inputClass} value={form.firstPaymentCredited} onChange={e => update('firstPaymentCredited', e.target.value)} placeholder="100% in Favor of MAPL" /></div>
                  <div><label className={labelClass}>Hold Amount (₹)</label><input type="number" className={inputClass} value={form.holdAmount} onChange={e => update('holdAmount', e.target.value)} placeholder="0" /></div>
                  <div><label className={labelClass}>Payment Received Date</label><input type="date" className={inputClass} value={form.paymentReceivedDate} onChange={e => update('paymentReceivedDate', e.target.value)} /></div>
                </div>
              </div>
            </div>
          )}

          {/* Step 7: RTO */}
          {currentStep === 7 && (
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-6">RTO Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div><label className={labelClass}>RC Owner Name</label><input className={inputClass} value={form.rcOwnerName} onChange={e => update('rcOwnerName', e.target.value)} placeholder="JAGDISH" /></div>
                <div><label className={labelClass}>RC Mfg. Date</label><input type="month" className={inputClass} value={form.rcMfgDate} onChange={e => update('rcMfgDate', e.target.value)} /></div>
                <div><label className={labelClass}>RC Expiry Date</label><input type="date" className={inputClass} value={form.rcExpiryDate} onChange={e => update('rcExpiryDate', e.target.value)} /></div>
                <div><label className={labelClass}>HPN at time of login</label><input className={inputClass} value={form.hpnAtLogin} onChange={e => update('hpnAtLogin', e.target.value)} placeholder="NA" /></div>
                <div><label className={labelClass}>New Financier</label><input className={inputClass} value={form.newFinancier} onChange={e => update('newFinancier', e.target.value)} placeholder="KAMAL FINANCE" /></div>
                <div><label className={labelClass}>RTO Docs Handover Date</label><input type="date" className={inputClass} value={form.rtoDocsHandoverDate} onChange={e => update('rtoDocsHandoverDate', e.target.value)} /></div>
                <div className="md:col-span-3 mt-4"><h3 className="font-semibold text-foreground mb-3">RTO Work Details</h3></div>
                <div><label className={labelClass}>RTO Agent Name</label><input className={inputClass} value={form.rtoAgentName} onChange={e => update('rtoAgentName', e.target.value)} placeholder="DHANESH" /></div>
                <div><label className={labelClass}>Agent Mobile No</label><input className={inputClass} value={form.agentMobileNo} onChange={e => update('agentMobileNo', e.target.value)} maxLength={10} placeholder="6367966369" /></div>
                <div><label className={labelClass}>DTO Location</label><input className={inputClass} value={form.dtoLocation} onChange={e => update('dtoLocation', e.target.value)} placeholder="BIKANER" /></div>
                <div className="md:col-span-3"><label className={labelClass}>RTO Work Description</label><textarea className={inputClass} rows={2} value={form.rtoWorkDescription} onChange={e => update('rtoWorkDescription', e.target.value)} placeholder="HPN" /></div>
                <div><label className={labelClass}>Challan</label><select className={inputClass} value={form.challan} onChange={e => update('challan', e.target.value)}><option value="No">No</option><option value="Yes">Yes</option></select></div>
                <div><label className={labelClass}>FC</label><select className={inputClass} value={form.fc} onChange={e => update('fc', e.target.value)}><option value="No">No</option><option value="Yes">Yes</option></select></div>
                
                <div className="md:col-span-3 mt-4"><h3 className="font-semibold text-foreground mb-3">RTO Papers Checklist</h3></div>
                <div className="md:col-span-3 grid grid-cols-2 md:grid-cols-4 gap-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.rtoRC} onChange={e => setForm({...form, rtoRC: e.target.checked})} className="w-4 h-4 rounded border-border" />
                    <span className="text-sm text-foreground">RC Copy</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.rtoNOC} onChange={e => setForm({...form, rtoNOC: e.target.checked})} className="w-4 h-4 rounded border-border" />
                    <span className="text-sm text-foreground">NOC</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.rtoPermit} onChange={e => setForm({...form, rtoPermit: e.target.checked})} className="w-4 h-4 rounded border-border" />
                    <span className="text-sm text-foreground">Permit</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.rtoPollution} onChange={e => setForm({...form, rtoPollution: e.target.checked})} className="w-4 h-4 rounded border-border" />
                    <span className="text-sm text-foreground">Pollution</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.rto2930Form} onChange={e => setForm({...form, rto2930Form: e.target.checked})} className="w-4 h-4 rounded border-border" />
                    <span className="text-sm text-foreground">29-30 Form</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.rtoSellAgreement} onChange={e => setForm({...form, rtoSellAgreement: e.target.checked})} className="w-4 h-4 rounded border-border" />
                    <span className="text-sm text-foreground">Sell Agreement</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.rtoRCOwnerKYC} onChange={e => setForm({...form, rtoRCOwnerKYC: e.target.checked})} className="w-4 h-4 rounded border-border" />
                    <span className="text-sm text-foreground">RC Owner KYC</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.rtoStampPapers} onChange={e => setForm({...form, rtoStampPapers: e.target.checked})} className="w-4 h-4 rounded border-border" />
                    <span className="text-sm text-foreground">Stamp Papers</span>
                  </label>
                </div>
                
                <div className="md:col-span-3"><label className={labelClass}>RTO Papers (Additional Notes)</label><textarea className={inputClass} rows={2} value={form.rtoPapers} onChange={e => update('rtoPapers', e.target.value)} placeholder="Any additional RTO papers or notes" /></div>
              </div>
            </div>
          )}

          {/* Step 8: Documents */}
          {currentStep === 8 && (
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-6">Documents</h2>
              
              {/* Customer Documents */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">Customer Documents</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><label className={labelClass}>Aadhar Card Front</label><input type="file" className={inputClass} onChange={e => update('aadharFront', e.target.files?.[0] || null)} accept="image/*,.pdf" /></div>
                  <div><label className={labelClass}>Aadhar Card Back</label><input type="file" className={inputClass} onChange={e => update('aadharBack', e.target.files?.[0] || null)} accept="image/*,.pdf" /></div>
                  <div><label className={labelClass}>Pan Card</label><input type="file" className={inputClass} onChange={e => update('panCard', e.target.files?.[0] || null)} accept="image/*,.pdf" /></div>
                  <div><label className={labelClass}>Driving Licence</label><input type="file" className={inputClass} onChange={e => update('drivingLicence', e.target.files?.[0] || null)} accept="image/*,.pdf" /></div>
                  <div><label className={labelClass}>Light Bill</label><input type="file" className={inputClass} onChange={e => update('lightBill', e.target.files?.[0] || null)} accept="image/*,.pdf" /></div>
                  <div><label className={labelClass}>Last 6 Month Bank Statement</label><input type="file" className={inputClass} onChange={e => update('bankStatement', e.target.files?.[0] || null)} accept="image/*,.pdf" /></div>
                  <div><label className={labelClass}>Cheque</label><input type="file" className={inputClass} onChange={e => update('cheque', e.target.files?.[0] || null)} accept="image/*,.pdf" /></div>
                  <div><label className={labelClass}>RC (Front)</label><input type="file" className={inputClass} onChange={e => update('rcFront', e.target.files?.[0] || null)} accept="image/*,.pdf" /></div>
                  <div><label className={labelClass}>RC (Back)</label><input type="file" className={inputClass} onChange={e => update('rcBack', e.target.files?.[0] || null)} accept="image/*,.pdf" /></div>
                  <div><label className={labelClass}>Income Proof</label><input type="file" className={inputClass} onChange={e => update('incomeProof', e.target.files?.[0] || null)} accept="image/*,.pdf" /></div>
                  <div><label className={labelClass}>Rent Agreement</label><input type="file" className={inputClass} onChange={e => update('rentAgreement', e.target.files?.[0] || null)} accept="image/*,.pdf" /></div>
                  <div><label className={labelClass}>Customer Photo</label><input type="file" className={inputClass} onChange={e => update('customerPhoto', e.target.files?.[0] || null)} accept="image/*" /></div>
                  <div><label className={labelClass}>Disbursement Memo</label><input type="file" className={inputClass} onChange={e => update('disbursementMemo', e.target.files?.[0] || null)} accept="image/*,.pdf" /></div>
                  <div><label className={labelClass}>Insurance</label><input type="file" className={inputClass} onChange={e => update('insurance', e.target.files?.[0] || null)} accept="image/*,.pdf" /></div>
                  <div><label className={labelClass}>Customer Ledger</label><input type="file" className={inputClass} onChange={e => update('customerLedger', e.target.files?.[0] || null)} accept="image/*,.pdf" /></div>
                </div>
              </div>

              {/* Co-Applicant Documents */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">Co Applicant Documents</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><label className={labelClass}>Co Applicant Aadhar Card Front</label><input type="file" className={inputClass} onChange={e => update('coAadharFront', e.target.files?.[0] || null)} accept="image/*,.pdf" /></div>
                  <div><label className={labelClass}>Co Applicant Aadhar Card Back</label><input type="file" className={inputClass} onChange={e => update('coAadharBack', e.target.files?.[0] || null)} accept="image/*,.pdf" /></div>
                  <div><label className={labelClass}>Co Applicant Pan Card</label><input type="file" className={inputClass} onChange={e => update('coPanCard', e.target.files?.[0] || null)} accept="image/*,.pdf" /></div>
                  <div><label className={labelClass}>Co Applicant Photo</label><input type="file" className={inputClass} onChange={e => update('coPhoto', e.target.files?.[0] || null)} accept="image/*" /></div>
                </div>
              </div>

              {/* Guarantor Documents */}
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-4">Guarantor Documents</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><label className={labelClass}>Guarantor Aadhar Card Front</label><input type="file" className={inputClass} onChange={e => update('guarantorAadharFront', e.target.files?.[0] || null)} accept="image/*,.pdf" /></div>
                  <div><label className={labelClass}>Guarantor Aadhar Card Back</label><input type="file" className={inputClass} onChange={e => update('guarantorAadharBack', e.target.files?.[0] || null)} accept="image/*,.pdf" /></div>
                  <div><label className={labelClass}>Guarantor Pan Card</label><input type="file" className={inputClass} onChange={e => update('guarantorPanCard', e.target.files?.[0] || null)} accept="image/*,.pdf" /></div>
                  <div><label className={labelClass}>Rc Of Guarantor (Front)</label><input type="file" className={inputClass} onChange={e => update('guarantorRcFront', e.target.files?.[0] || null)} accept="image/*,.pdf" /></div>
                  <div><label className={labelClass}>Rc Of Guarantor (Back)</label><input type="file" className={inputClass} onChange={e => update('guarantorRcBack', e.target.files?.[0] || null)} accept="image/*,.pdf" /></div>
                  <div><label className={labelClass}>Guarantor Photo</label><input type="file" className={inputClass} onChange={e => update('guarantorPhoto', e.target.files?.[0] || null)} accept="image/*" /></div>
                </div>
              </div>
            </div>
          )}

          {/* Step 9: Others */}
          {currentStep === 9 && (
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-6">Other Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div><label className={labelClass}>Login Date</label><input type="date" className={inputClass} value={form.loginDate} onChange={e => update('loginDate', e.target.value)} /></div>
                <div><label className={labelClass}>Approval Date</label><input type="date" className={inputClass} value={form.approvalDate} onChange={e => update('approvalDate', e.target.value)} /></div>
                <div><label className={labelClass}>Financer Disburse Date</label><input type="date" className={inputClass} value={form.financierDisburseDate} onChange={e => update('financierDisburseDate', e.target.value)} /></div>
                <div><label className={labelClass}>TAT (Days)</label><input type="number" className={inputClass} value={form.tat} onChange={e => update('tat', e.target.value)} placeholder="16" /></div>
                <div><label className={labelClass}>Booking Mode</label><select className={inputClass} value={form.bookingMode} onChange={e => update('bookingMode', e.target.value)}><option value="">Select</option><option value="Self">Self</option><option value="Broker">Broker</option><option value="Agent">Agent</option></select></div>
                <div><label className={labelClass}>Sourcing Person Name</label><input className={inputClass} value={form.sourcingPersonName} onChange={e => update('sourcingPersonName', e.target.value)} /></div>
                <div><label className={labelClass}>Booking Month</label><select className={inputClass} value={form.bookingMonth} onChange={e => update('bookingMonth', e.target.value)}><option value="">Select</option><option value="Jan">Jan</option><option value="Feb">Feb</option><option value="Mar">Mar</option><option value="Apr">Apr</option><option value="May">May</option><option value="Jun">Jun</option><option value="Jul">Jul</option><option value="Aug">Aug</option><option value="Sep">Sep</option><option value="Oct">Oct</option><option value="Nov">Nov</option><option value="Dec">Dec</option></select></div>
                <div><label className={labelClass}>Booking Year</label><input type="number" className={inputClass} value={form.bookingYear} onChange={e => update('bookingYear', e.target.value)} placeholder="2026" min="2020" max="2030" /></div>
                <div><label className={labelClass}>Mehar Disburse Date</label><input type="date" className={inputClass} value={form.meharDisburseDate} onChange={e => update('meharDisburseDate', e.target.value)} /></div>
                <div><label className={labelClass}>File Stage</label><select className={inputClass} value={form.fileStage} onChange={e => update('fileStage', e.target.value)}><option value="">Select</option><option value="Login">Login</option><option value="Approval">Approval</option><option value="Disburse">Disburse</option><option value="Closed">Closed</option></select></div>
                <div><label className={labelClass}>File Status</label><select className={inputClass} value={form.fileStatus} onChange={e => update('fileStatus', e.target.value)}><option value="draft">Draft</option><option value="Pending">Pending</option><option value="Approved">Approved</option><option value="Rejected">Rejected</option><option value="Disbursed">Disbursed</option></select></div>
                <div className="md:col-span-3"><label className={labelClass}>Remark</label><textarea className={inputClass} rows={3} value={form.remark} onChange={e => update('remark', e.target.value)} placeholder="Enter any additional remarks" /></div>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8">
          <button type="button" onClick={handlePrev} disabled={currentStep === 0} className="px-6 py-3 rounded-xl border-2 border-border font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-muted transition-all">← Previous</button>
          <div className="flex gap-3">
            <button type="button" onClick={() => navigate(-1)} className="px-6 py-3 rounded-xl border-2 border-border font-semibold hover:bg-muted transition-all">Cancel</button>
            {currentStep < steps.length - 1 ? (
              <button type="button" onClick={handleNext} className="px-8 py-3 rounded-xl bg-gradient-to-r from-accent to-accent/90 text-accent-foreground font-bold shadow-lg hover:shadow-xl transition-all">Next →</button>
            ) : (
              <button type="submit" disabled={createLoan.isPending} className="px-8 py-3 rounded-xl bg-gradient-to-r from-accent to-accent/90 text-accent-foreground font-bold shadow-lg hover:shadow-xl transition-all disabled:opacity-60">
                {createLoan.isPending ? 'Creating...' : 'Create Application'}
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
