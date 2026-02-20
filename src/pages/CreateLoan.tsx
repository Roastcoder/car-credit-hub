import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { BANKS, CAR_MAKES, calculateEMI, formatCurrency } from '@/lib/mock-data';
import { ArrowLeft, Calculator } from 'lucide-react';
import { toast } from 'sonner';

export default function CreateLoan() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    applicantName: '', mobile: '', pan: '', aadhaar: '', address: '',
    carMake: '', carModel: '', carVariant: '', onRoadPrice: '',
    dealerName: '', loanAmount: '', downPayment: '', tenure: '60',
    interestRate: '8.5', assignedBank: '',
  });

  const update = (key: string, val: string) => setForm(f => ({ ...f, [key]: val }));

  const emi = useMemo(() => {
    const p = Number(form.loanAmount);
    const r = Number(form.interestRate);
    const t = Number(form.tenure);
    if (p > 0 && r > 0 && t > 0) return calculateEMI(p, r, t);
    return 0;
  }, [form.loanAmount, form.interestRate, form.tenure]);

  const totalPayable = emi * Number(form.tenure);
  const totalInterest = totalPayable - Number(form.loanAmount);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Loan application created successfully!');
    navigate('/loans');
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
        {/* Applicant */}
        <div className="stat-card">
          <h2 className="font-semibold text-foreground mb-4">Applicant Details</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label className={labelClass}>Full Name *</label><input required className={inputClass} value={form.applicantName} onChange={e => update('applicantName', e.target.value)} /></div>
            <div><label className={labelClass}>Mobile *</label><input required className={inputClass} value={form.mobile} onChange={e => update('mobile', e.target.value)} maxLength={10} /></div>
            <div><label className={labelClass}>PAN *</label><input required className={inputClass} value={form.pan} onChange={e => update('pan', e.target.value.toUpperCase())} maxLength={10} /></div>
            <div><label className={labelClass}>Aadhaar *</label><input required className={inputClass} value={form.aadhaar} onChange={e => update('aadhaar', e.target.value)} /></div>
            <div className="sm:col-span-2"><label className={labelClass}>Address *</label><textarea required className={inputClass} rows={2} value={form.address} onChange={e => update('address', e.target.value)} /></div>
          </div>
        </div>

        {/* Car */}
        <div className="stat-card">
          <h2 className="font-semibold text-foreground mb-4">Car Details</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Car Make *</label>
              <select required className={inputClass} value={form.carMake} onChange={e => update('carMake', e.target.value)}>
                <option value="">Select Make</option>
                {CAR_MAKES.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div><label className={labelClass}>Model *</label><input required className={inputClass} value={form.carModel} onChange={e => update('carModel', e.target.value)} /></div>
            <div><label className={labelClass}>Variant</label><input className={inputClass} value={form.carVariant} onChange={e => update('carVariant', e.target.value)} /></div>
            <div><label className={labelClass}>On-Road Price (₹) *</label><input required type="number" className={inputClass} value={form.onRoadPrice} onChange={e => update('onRoadPrice', e.target.value)} /></div>
            <div><label className={labelClass}>Dealer Name</label><input className={inputClass} value={form.dealerName} onChange={e => update('dealerName', e.target.value)} /></div>
          </div>
        </div>

        {/* Loan */}
        <div className="stat-card">
          <h2 className="font-semibold text-foreground mb-4">Loan Details</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label className={labelClass}>Loan Amount (₹) *</label><input required type="number" className={inputClass} value={form.loanAmount} onChange={e => update('loanAmount', e.target.value)} /></div>
            <div><label className={labelClass}>Down Payment (₹)</label><input type="number" className={inputClass} value={form.downPayment} onChange={e => update('downPayment', e.target.value)} /></div>
            <div>
              <label className={labelClass}>Tenure (Months) *</label>
              <select required className={inputClass} value={form.tenure} onChange={e => update('tenure', e.target.value)}>
                {[12, 24, 36, 48, 60, 72, 84].map(t => <option key={t} value={t}>{t} months</option>)}
              </select>
            </div>
            <div><label className={labelClass}>Interest Rate (%) *</label><input required type="number" step="0.1" className={inputClass} value={form.interestRate} onChange={e => update('interestRate', e.target.value)} /></div>
            <div>
              <label className={labelClass}>Assign to Bank</label>
              <select className={inputClass} value={form.assignedBank} onChange={e => update('assignedBank', e.target.value)}>
                <option value="">Select Bank</option>
                {BANKS.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
          </div>

          {/* EMI Calculator */}
          {emi > 0 && (
            <div className="mt-6 p-4 rounded-xl bg-accent/5 border border-accent/20">
              <div className="flex items-center gap-2 mb-3 text-accent font-semibold text-sm">
                <Calculator size={16} />
                EMI Calculator
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Monthly EMI</p>
                  <p className="text-lg font-bold text-foreground">{formatCurrency(emi)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total Interest</p>
                  <p className="text-lg font-bold text-foreground">{formatCurrency(totalInterest > 0 ? totalInterest : 0)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total Payable</p>
                  <p className="text-lg font-bold text-foreground">{formatCurrency(totalPayable)}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3 justify-end">
          <button type="button" onClick={() => navigate(-1)} className="px-5 py-2.5 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:bg-muted transition-colors">
            Cancel
          </button>
          <button type="submit" className="px-6 py-2.5 rounded-xl bg-accent text-accent-foreground text-sm font-semibold hover:opacity-90 transition-opacity">
            Create Application
          </button>
        </div>
      </form>
    </div>
  );
}
