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
    // Application Details
    loanNumber: '', loanAmount: '', grid: '', ltv: '', vehicleNumber: '', productName: '', model: '', vertical: '',
    productCode: '', customerName: '', mobile: '', coApplicantName: '', coApplicantMobile: '',
    guarantorName: '', guarantorMobile: '', currentAddress: '', permanentAddress: '',
    loginDate: '', fileSignDate: '', approvalDate: '', disburseBranchName: '', disburseDate: '', ourBranch: '', remark: '',
    // Income Details
    incomeSource: '', monthlyIncome: '', nipIp: 'nip',
    // Agriculture Details
    agriculture: '',
    // RTO Details
    rcOwnerName: '', rcMfgDate: '', rcExpiryDate: '', hpnAtLogin: '', hpnAfterPdd: '', rtoRcHandoverDate: '',
    rtoAgentName: '', agentMobileNo: '', dtoLocation: '', challan: 'No', rtoPapers: '', forClosure: 'No',
    // EMI & Financier Details
    emiAmount: '', totalEmi: '', totalInterest: '', firstEmiAmount: '', firstInstallmentDueDate: '',
    irr: '8.5', tenure: '60', emiMode: 'Monthly', financierName: '', assignedBankId: '', customerTrackCompany: '',
    // Insurance Details
    insuranceCompanyName: '', insuredName: '', idv: '', insuranceTransfer: '', insuranceHpn: '',
    insuranceDate: '', insuranceRenewalDate: '',
    // Deductions Details
    fileCharge: '', loanSuraksha: '', stamping: '', valuation: '', deferralCharges: '', gst: '',
    documentationCharges: '', otherCharges: '',
    // Assignment
    assignedBrokerId: '',
    // Status
    fileStatus: 'draft',
  });

  const update = (key: string, val: string) => setForm(f => ({ ...f, [key]: val }));

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
      const loanId = generateLoanId();
      const { data, error } = await supabase.from('loans').insert({
        id: loanId,
        applicant_name: form.customerName,
        mobile: form.mobile,
        pan: form.pan,
        aadhaar: form.aadhaar,
        address: form.address,
        car_make: form.carMake,
        car_model: form.carModel,
        car_variant: form.carVariant,
        loan_amount: Number(form.loanAmount),
        down_payment: Number(form.downPayment) || 0,
        tenure: Number(form.tenure),
        interest_rate: Number(form.irr),
        emi: emi,
        status: form.fileStatus || 'draft',
        assigned_bank_id: form.assignedBankId || null,
        assigned_broker_id: form.assignedBrokerId || null,
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

  const inputClass = "w-full px-3 py-2.5 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all";
  const labelClass = "block text-sm font-medium text-foreground mb-1.5";

  return (
    <div className="max-w-4xl mx-auto">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors">
        <ArrowLeft size={16} /> Back
      </button>

      <h1 className="text-2xl font-bold text-foreground mb-1">New Car Loan Application</h1>
      <p className="text-muted-foreground text-sm mb-6">Fill in the details to create a new loan application</p>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* a) Application Details */}
        <div className="stat-card">
          <h2 className="font-semibold text-foreground mb-4">a) Application Details</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div><label className={labelClass}>Loan Number</label><input className={inputClass} value={form.loanNumber} onChange={e => update('loanNumber', e.target.value)} /></div>
            <div><label className={labelClass}>Loan Amount (₹) *</label><input required type="number" className={inputClass} value={form.loanAmount} onChange={e => update('loanAmount', e.target.value)} /></div>
            <div><label className={labelClass}>Grid (₹)</label><input type="number" className={inputClass} value={form.grid} onChange={e => update('grid', e.target.value)} /></div>
            <div><label className={labelClass}>LTV (%)</label><input type="number" className={inputClass} value={form.ltv} onChange={e => update('ltv', e.target.value)} /></div>
            <div><label className={labelClass}>Vehicle Number</label><input className={inputClass} value={form.vehicleNumber} onChange={e => update('vehicleNumber', e.target.value.toUpperCase())} /></div>
            <div><label className={labelClass}>Product Name</label><input className={inputClass} value={form.productName} onChange={e => update('productName', e.target.value)} /></div>
            <div><label className={labelClass}>Model Year</label><input type="number" className={inputClass} value={form.model} onChange={e => update('model', e.target.value)} min="2000" max="2025" /></div>
            <div><label className={labelClass}>Vertical</label><input className={inputClass} value={form.vertical} onChange={e => update('vertical', e.target.value)} placeholder="CV/PV" /></div>
            <div className="sm:col-span-3"><label className={labelClass}>Product Code</label><input className={inputClass} value={form.productCode} onChange={e => update('productCode', e.target.value)} /></div>
            <div><label className={labelClass}>Customer Name *</label><input required className={inputClass} value={form.customerName} onChange={e => update('customerName', e.target.value)} /></div>
            <div><label className={labelClass}>Mobile No *</label><input required className={inputClass} value={form.mobile} onChange={e => update('mobile', e.target.value)} maxLength={10} /></div>
            <div><label className={labelClass}>Co-Applicant Name</label><input className={inputClass} value={form.coApplicantName} onChange={e => update('coApplicantName', e.target.value)} placeholder="NA" /></div>
            <div><label className={labelClass}>Co-Applicant Mobile</label><input className={inputClass} value={form.coApplicantMobile} onChange={e => update('coApplicantMobile', e.target.value)} placeholder="0" /></div>
            <div><label className={labelClass}>Guarantor Name</label><input className={inputClass} value={form.guarantorName} onChange={e => update('guarantorName', e.target.value)} placeholder="NA" /></div>
            <div><label className={labelClass}>Guarantor Mobile</label><input className={inputClass} value={form.guarantorMobile} onChange={e => update('guarantorMobile', e.target.value)} placeholder="0" /></div>
            <div className="sm:col-span-3"><label className={labelClass}>Current Address</label><textarea className={inputClass} rows={2} value={form.currentAddress} onChange={e => update('currentAddress', e.target.value)} /></div>
            <div className="sm:col-span-3"><label className={labelClass}>Permanent Address</label><textarea className={inputClass} rows={2} value={form.permanentAddress} onChange={e => update('permanentAddress', e.target.value)} /></div>
            <div><label className={labelClass}>Login Date</label><input type="date" className={inputClass} value={form.loginDate} onChange={e => update('loginDate', e.target.value)} /></div>
            <div><label className={labelClass}>File Sign Date</label><input type="date" className={inputClass} value={form.fileSignDate} onChange={e => update('fileSignDate', e.target.value)} /></div>
            <div><label className={labelClass}>Approval Date</label><input type="date" className={inputClass} value={form.approvalDate} onChange={e => update('approvalDate', e.target.value)} /></div>
            <div><label className={labelClass}>Disburse Branch Name</label><input className={inputClass} value={form.disburseBranchName} onChange={e => update('disburseBranchName', e.target.value)} /></div>
            <div><label className={labelClass}>Disburse Date</label><input type="date" className={inputClass} value={form.disburseDate} onChange={e => update('disburseDate', e.target.value)} /></div>
            <div><label className={labelClass}>Our Branch</label><input className={inputClass} value={form.ourBranch} onChange={e => update('ourBranch', e.target.value)} /></div>
            <div className="sm:col-span-3"><label className={labelClass}>Remark</label><textarea className={inputClass} rows={2} value={form.remark} onChange={e => update('remark', e.target.value)} /></div>
          </div>
        </div>

        {/* b) Income Details */}
        <div className="stat-card">
          <h2 className="font-semibold text-foreground mb-4">b) Income Details</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div><label className={labelClass}>Income Source</label><input className={inputClass} value={form.incomeSource} onChange={e => update('incomeSource', e.target.value)} placeholder="DRIVER/BUSINESS" /></div>
            <div><label className={labelClass}>Monthly Income (₹)</label><input type="number" className={inputClass} value={form.monthlyIncome} onChange={e => update('monthlyIncome', e.target.value)} /></div>
            <div>
              <label className={labelClass}>NIP / IP</label>
              <select className={inputClass} value={form.nipIp} onChange={e => update('nipIp', e.target.value)}>
                <option value="nip">NIP</option>
                <option value="ip">IP</option>
              </select>
            </div>
          </div>
        </div>

        {/* c) Agriculture Details */}
        <div className="stat-card">
          <h2 className="font-semibold text-foreground mb-4">c) Agriculture Details</h2>
          <div className="grid grid-cols-1 gap-4">
            <div><label className={labelClass}>Agriculture</label><input className={inputClass} value={form.agriculture} onChange={e => update('agriculture', e.target.value)} placeholder="JAMAMANDI" /></div>
          </div>
        </div>

        {/* d) RTO Details & Work */}
        <div className="stat-card">
          <h2 className="font-semibold text-foreground mb-4">d) RTO Details & Work</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div><label className={labelClass}>RC Owner Name</label><input className={inputClass} value={form.rcOwnerName} onChange={e => update('rcOwnerName', e.target.value)} /></div>
            <div><label className={labelClass}>RC Mfg. Date</label><input type="month" className={inputClass} value={form.rcMfgDate} onChange={e => update('rcMfgDate', e.target.value)} /></div>
            <div><label className={labelClass}>RC Expiry Date</label><input type="date" className={inputClass} value={form.rcExpiryDate} onChange={e => update('rcExpiryDate', e.target.value)} /></div>
            <div><label className={labelClass}>HPN at Login</label><input className={inputClass} value={form.hpnAtLogin} onChange={e => update('hpnAtLogin', e.target.value)} placeholder="NA" /></div>
            <div><label className={labelClass}>HPN After PDD</label><input className={inputClass} value={form.hpnAfterPdd} onChange={e => update('hpnAfterPdd', e.target.value)} /></div>
            <div><label className={labelClass}>RTO RC Handover Date</label><input type="date" className={inputClass} value={form.rtoRcHandoverDate} onChange={e => update('rtoRcHandoverDate', e.target.value)} /></div>
            <div><label className={labelClass}>RTO Agent Name</label><input className={inputClass} value={form.rtoAgentName} onChange={e => update('rtoAgentName', e.target.value)} /></div>
            <div><label className={labelClass}>Agent Mobile No</label><input className={inputClass} value={form.agentMobileNo} onChange={e => update('agentMobileNo', e.target.value)} /></div>
            <div><label className={labelClass}>DTO Location</label><input className={inputClass} value={form.dtoLocation} onChange={e => update('dtoLocation', e.target.value)} /></div>
            <div>
              <label className={labelClass}>Challan</label>
              <select className={inputClass} value={form.challan} onChange={e => update('challan', e.target.value)}>
                <option value="No">No</option>
                <option value="Yes">Yes</option>
              </select>
            </div>
            <div><label className={labelClass}>RTO Papers</label><input className={inputClass} value={form.rtoPapers} onChange={e => update('rtoPapers', e.target.value)} placeholder="RC, Insurance" /></div>
            <div>
              <label className={labelClass}>For Closure</label>
              <select className={inputClass} value={form.forClosure} onChange={e => update('forClosure', e.target.value)}>
                <option value="No">No</option>
                <option value="Yes">Yes</option>
              </select>
            </div>
          </div>
        </div>

        {/* e) EMI & Financier Details */}
        <div className="stat-card">
          <h2 className="font-semibold text-foreground mb-4">e) EMI & Financier Details</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div><label className={labelClass}>EMI Amount (₹)</label><input type="number" className={inputClass} value={form.emiAmount} onChange={e => update('emiAmount', e.target.value)} /></div>
            <div><label className={labelClass}>Total EMI</label><input type="number" className={inputClass} value={form.totalEmi} onChange={e => update('totalEmi', e.target.value)} /></div>
            <div><label className={labelClass}>Total Interest (₹)</label><input type="number" className={inputClass} value={form.totalInterest} onChange={e => update('totalInterest', e.target.value)} /></div>
            <div><label className={labelClass}>First EMI Amount (₹)</label><input type="number" className={inputClass} value={form.firstEmiAmount} onChange={e => update('firstEmiAmount', e.target.value)} /></div>
            <div><label className={labelClass}>First Installment Due Date</label><input type="date" className={inputClass} value={form.firstInstallmentDueDate} onChange={e => update('firstInstallmentDueDate', e.target.value)} /></div>
            <div><label className={labelClass}>IRR (%) *</label><input required type="number" step="0.01" className={inputClass} value={form.irr} onChange={e => update('irr', e.target.value)} /></div>
            <div>
              <label className={labelClass}>Tenure *</label>
              <select required className={inputClass} value={form.tenure} onChange={e => update('tenure', e.target.value)}>
                {[12, 18, 24, 36, 48, 60, 72, 84].map(t => <option key={t} value={t}>{t} MONTH</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>EMI Mode</label>
              <select className={inputClass} value={form.emiMode} onChange={e => update('emiMode', e.target.value)}>
                <option value="Monthly">Monthly</option>
                <option value="Quarterly">Quarterly</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Financier Name</label>
              <select className={inputClass} value={form.assignedBankId} onChange={e => update('assignedBankId', e.target.value)}>
                <option value="">Select Financier</option>
                {(banks as any[]).map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
            <div><label className={labelClass}>Customer Track Company</label><input className={inputClass} value={form.customerTrackCompany} onChange={e => update('customerTrackCompany', e.target.value)} placeholder="NA" /></div>
            <div>
              <label className={labelClass}>Assign to Broker</label>
              <select className={inputClass} value={form.assignedBrokerId} onChange={e => update('assignedBrokerId', e.target.value)}>
                <option value="">Select Broker</option>
                {(brokers as any[]).map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
          </div>

          {emi > 0 && (
            <div className="mt-6 p-4 rounded-xl bg-accent/5 border border-accent/20">
              <div className="flex items-center gap-2 mb-3 text-accent font-semibold text-sm">
                <Calculator size={16} /> EMI Calculator
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div><p className="text-xs text-muted-foreground">Monthly EMI</p><p className="text-lg font-bold text-foreground">{formatCurrency(emi)}</p></div>
                <div><p className="text-xs text-muted-foreground">Total Interest</p><p className="text-lg font-bold text-foreground">{formatCurrency(totalInterest > 0 ? totalInterest : 0)}</p></div>
                <div><p className="text-xs text-muted-foreground">Total Payable</p><p className="text-lg font-bold text-foreground">{formatCurrency(totalPayable)}</p></div>
              </div>
            </div>
          )}
        </div>

        {/* f) Insurance Details */}
        <div className="stat-card">
          <h2 className="font-semibold text-foreground mb-4">f) Insurance Details</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div><label className={labelClass}>Insurance Company Name</label><input className={inputClass} value={form.insuranceCompanyName} onChange={e => update('insuranceCompanyName', e.target.value)} /></div>
            <div><label className={labelClass}>Insured Name</label><input className={inputClass} value={form.insuredName} onChange={e => update('insuredName', e.target.value)} /></div>
            <div><label className={labelClass}>IDV (₹)</label><input type="number" className={inputClass} value={form.idv} onChange={e => update('idv', e.target.value)} /></div>
            <div>
              <label className={labelClass}>Insurance Transfer</label>
              <select className={inputClass} value={form.insuranceTransfer} onChange={e => update('insuranceTransfer', e.target.value)}>
                <option value="">Select</option>
                <option value="Done">Done</option>
                <option value="Pending">Pending</option>
              </select>
            </div>
            <div><label className={labelClass}>Insurance HPN</label><input className={inputClass} value={form.insuranceHpn} onChange={e => update('insuranceHpn', e.target.value)} placeholder="NA" /></div>
            <div><label className={labelClass}>Insurance Date</label><input type="date" className={inputClass} value={form.insuranceDate} onChange={e => update('insuranceDate', e.target.value)} /></div>
            <div><label className={labelClass}>Insurance Renewal Date</label><input type="date" className={inputClass} value={form.insuranceRenewalDate} onChange={e => update('insuranceRenewalDate', e.target.value)} /></div>
          </div>
        </div>

        {/* g) Deductions Details */}
        <div className="stat-card">
          <h2 className="font-semibold text-foreground mb-4">g) Deductions Details</h2>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div><label className={labelClass}>File Charge (₹)</label><input type="number" className={inputClass} value={form.fileCharge} onChange={e => update('fileCharge', e.target.value)} /></div>
            <div><label className={labelClass}>Loan Suraksha (₹)</label><input type="number" className={inputClass} value={form.loanSuraksha} onChange={e => update('loanSuraksha', e.target.value)} /></div>
            <div><label className={labelClass}>Stamping (₹)</label><input type="number" className={inputClass} value={form.stamping} onChange={e => update('stamping', e.target.value)} /></div>
            <div><label className={labelClass}>Valuation (₹)</label><input type="number" className={inputClass} value={form.valuation} onChange={e => update('valuation', e.target.value)} /></div>
            <div><label className={labelClass}>Deferral Charges (₹)</label><input type="number" className={inputClass} value={form.deferralCharges} onChange={e => update('deferralCharges', e.target.value)} /></div>
            <div><label className={labelClass}>GST (₹)</label><input type="number" className={inputClass} value={form.gst} onChange={e => update('gst', e.target.value)} /></div>
            <div><label className={labelClass}>Documentation Charges (₹)</label><input type="number" className={inputClass} value={form.documentationCharges} onChange={e => update('documentationCharges', e.target.value)} /></div>
            <div><label className={labelClass}>Other Charges (₹)</label><input type="number" className={inputClass} value={form.otherCharges} onChange={e => update('otherCharges', e.target.value)} /></div>
          </div>
        </div>

        <div className="flex gap-3 justify-end">
          <button type="button" onClick={() => navigate(-1)} className="px-5 py-2.5 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:bg-muted transition-colors">
            Cancel
          </button>
          <button type="submit" disabled={createLoan.isPending} className="px-6 py-2.5 rounded-xl bg-accent text-accent-foreground text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-60">
            {createLoan.isPending ? 'Creating…' : 'Create Application'}
          </button>
        </div>
      </form>
    </div>
  );
}
