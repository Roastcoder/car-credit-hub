import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { 
  X, 
  CreditCard, 
  Landmark, 
  Files, 
  ClipboardCheck, 
  ShieldCheck, 
  Timer, 
  Save, 
  AlertCircle, 
  Info,
  Calendar,
  User,
  Phone,
  MapPin,
  FileText
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface PDDFormProps {
  loan: any;
  onCancel: () => void;
  onSuccess: () => void;
}

const FormSection = ({ title, icon, children, colorClass }: { title: string, icon: React.ReactNode, children: React.ReactNode, colorClass: string }) => (
  <div className="bg-card rounded-2xl border border-border/60 shadow-sm overflow-hidden flex flex-col h-full transform transition-all hover:shadow-md">
    <div className={cn("px-4 py-3 flex items-center gap-2 border-b border-border/40", colorClass)}>
      <div className="p-1.5 rounded-lg bg-white/20 text-white shadow-sm">
        {icon}
      </div>
      <h3 className="text-[11px] font-black uppercase tracking-widest text-white">{title}</h3>
    </div>
    <div className="p-5 space-y-4 flex-1">
      {children}
    </div>
  </div>
);

const InputField = ({ label, icon, ...props }: { label: string, icon?: React.ReactNode } & React.InputHTMLAttributes<HTMLInputElement>) => (
  <div className="space-y-1.5">
    <label className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1.5 ml-1">
      {icon}
      {label}
    </label>
    <div className="relative group">
      <input 
        {...props} 
        className={cn(
          "w-full px-3 py-2.5 bg-background border border-border rounded-xl text-sm transition-all focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent disabled:opacity-50 disabled:grayscale group-hover:border-accent/40",
          props.className
        )} 
      />
    </div>
  </div>
);

export default function PDDForm({ loan, onCancel, onSuccess }: PDDFormProps) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    payment_received_date: loan.payment_received_date?.split('T')[0] || '',
    financier_m_parivahan: loan.financier_m_parivahan || '',
    balance_payment_status: loan.balance_payment_status || '',
    pdd_update_finance_company: loan.pdd_update_finance_company || '',
    fc_deposited_by: loan.fc_deposited_by || '',
    fc_deposit_date: loan.fc_deposit_date?.split('T')[0] || '',
    fc_receipt: loan.fc_receipt || '',
    zero_statement: loan.zero_statement || '',
    current_fc_status: loan.current_fc_status || '',
    prev_financier_account_status: loan.prev_financier_account_status || '',
    noc_status: loan.noc_status || '',
    noc_checked_by: loan.noc_checked_by || '',
    previous_dto_noc: loan.previous_dto_noc || '',
    rto_paper_details: loan.rto_paper_details || '',
    pending_rto_documents: loan.pending_rto_documents || '',
    rto_docs_location: loan.rto_docs_location || '',
    rto_work_description: loan.rto_work_description || '',
    rto_work_status: loan.rto_work_status || '',
    dto_location: loan.dto_location || '',
    rto_agent_name: loan.rto_agent_name || '',
    rto_agent_mobile: loan.rto_agent_mobile || '',
    rto_mail: loan.rto_mail || '',
    pollution_status: loan.pollution_status || '',
    insurance_status: loan.insurance_status || '',
    vehicle_check_status: loan.vehicle_check_status || '',
    insurance_endorsement: loan.insurance_endorsement || '',
    challan_status: loan.challan_status || '',
    police_case_status: loan.police_case_status || '',
    commitment_date: loan.commitment_date?.split('T')[0] || '',
    delay_days: loan.delay_days || '',
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEmployee = user?.role === 'employee' || user?.role === 'admin' || user?.role === 'super_admin';
  const isRejected = loan.pdd_status === 'rejected';
  const isBT = loan.scheme === 'BT' || loan.scheme === 'Purchase & BT';

  const validateForm = () => {
    if (isBT) {
      if (!formData.fc_deposited_by) { toast.error('FC Deposited By is required for BT scheme'); return false; }
      if (!formData.fc_deposit_date) { toast.error('FC Deposit Date is required for BT scheme'); return false; }
      if (!formData.current_fc_status) { toast.error('Current FC Status is required for BT scheme'); return false; }
      if (!formData.noc_status) { toast.error('NOC Status is required for BT scheme'); return false; }
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsSubmitting(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/loans/${loan.loan_number || loan.id}/pdd`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify(formData)
      });
      if (response.ok) {
        toast.success('🎉 PDD Application Submitted Successfully for Manager Review!');
        onSuccess();
      } else {
        const error = await response.json().catch(() => ({}));
        toast.error(error.error || 'Failed to update PDD details');
      }
    } catch (error) {
      console.error('Failed to update PDD:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-7xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-8 pb-12">
        {/* Modern Header Info Card */}
        <div className="bg-card rounded-3xl border-2 border-accent/20 shadow-xl shadow-accent/5 p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-accent/5 rounded-full -mr-32 -mt-32 blur-3xl opacity-50" />
          
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-2">
              <span className="px-2 py-0.5 rounded-full bg-accent/10 text-accent text-[10px] font-black uppercase tracking-wider">PDD Submission</span>
              {isRejected && <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-600 text-[10px] font-black uppercase tracking-wider">Revision Required</span>}
            </div>
            <h2 className="text-3xl font-black text-foreground tracking-tighter">
              {loan.applicant_name}
            </h2>
            <p className="text-sm text-muted-foreground font-medium flex items-center gap-2 mt-1">
              <span className="text-accent font-bold">{loan.loan_number}</span>
              <span className="w-1 h-1 rounded-full bg-border" />
              <span>{loan.car_make} {loan.car_model}</span>
            </p>
          </div>

          <div className="flex items-center gap-3 relative z-10">
            <button 
              type="button" 
              onClick={onCancel} 
              className="px-6 py-3 rounded-2xl text-sm font-bold text-muted-foreground hover:text-foreground hover:bg-muted transition-all active:scale-95"
            >
              Cancel
            </button>
            {isEmployee && (
              <button 
                type="submit" 
                disabled={isSubmitting} 
                className="px-8 py-3 bg-blue-600 text-white rounded-2xl text-sm font-black hover:bg-blue-700 disabled:opacity-50 shadow-lg shadow-blue-600/30 transition-all flex items-center gap-2 active:scale-95"
              >
                {isSubmitting ? (
                  <>Saving...</>
                ) : (
                  <>
                    <Save size={18} />
                    {isRejected ? 'Re-Submit PDD' : 'Submit for Approval'}
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Alerts Section */}
        {(isRejected || isBT) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {isRejected && (
              <div className="bg-red-50 border-2 border-red-100 p-5 rounded-2xl flex gap-4 items-start">
                <div className="p-2 rounded-xl bg-red-500 text-white shadow-md">
                  <AlertCircle size={20} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-red-800 uppercase tracking-widest mb-1">Rejection Remarks</p>
                  <p className="text-sm text-red-700 font-medium italic">"{loan.pdd_rejection_reason || 'No specific reason provided'}"</p>
                </div>
              </div>
            )}
            {isBT && (
              <div className="bg-blue-50 border-2 border-blue-100 p-5 rounded-2xl flex gap-4 items-start">
                <div className="p-2 rounded-xl bg-blue-500 text-white shadow-md">
                  <Info size={20} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-blue-800 uppercase tracking-widest mb-1">Policy Notice</p>
                  <p className="text-sm text-blue-700 font-medium">BT Scheme requires mandatory FC and NOC details for processing.</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Form Grid with Section Outline */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <FormSection title="Finance & Payment" icon={<CreditCard size={18} />} colorClass="bg-blue-600">
            <InputField 
              label="Payment Received Date" icon={<Calendar size={12}/>}
              type="date" value={formData.payment_received_date} onChange={(e) => setFormData({...formData, payment_received_date: e.target.value})} 
              disabled={!isEmployee}
            />
            <InputField 
              label="Financier in M-Parivahan" icon={<Landmark size={12}/>}
              type="text" placeholder="e.g. HDFC Bank"
              value={formData.financier_m_parivahan} onChange={(e) => setFormData({...formData, financier_m_parivahan: e.target.value})} 
              disabled={!isEmployee}
            />
            <InputField 
              label="Balance Status" icon={<ShieldCheck size={12}/>}
              type="text" placeholder="Pending/Clear"
              value={formData.balance_payment_status} onChange={(e) => setFormData({...formData, balance_payment_status: e.target.value})} 
              disabled={!isEmployee}
            />
          </FormSection>

          <FormSection title="FC Details" icon={<Landmark size={18} />} colorClass="bg-indigo-600">
            <InputField 
              label={`FC Deposited By ${isBT ? '*' : ''}`} icon={<User size={12}/>}
              type="text" value={formData.fc_deposited_by} onChange={(e) => setFormData({...formData, fc_deposited_by: e.target.value})} 
              disabled={!isEmployee}
            />
            <InputField 
              label={`FC Deposit Date ${isBT ? '*' : ''}`} icon={<Calendar size={12}/>}
              type="date" value={formData.fc_deposit_date} onChange={(e) => setFormData({...formData, fc_deposit_date: e.target.value})} 
              disabled={!isEmployee}
            />
            <InputField 
              label={`Current FC Status ${isBT ? '*' : ''}`} icon={<AlertCircle size={12}/>}
              type="text" value={formData.current_fc_status} onChange={(e) => setFormData({...formData, current_fc_status: e.target.value})} 
              disabled={!isEmployee}
            />
          </FormSection>

          <FormSection title="RTO & Documents" icon={<Files size={18} />} colorClass="bg-emerald-600">
            <InputField 
              label="RTO Paper Details" icon={<FileText size={12}/>}
              type="text" value={formData.rto_paper_details} onChange={(e) => setFormData({...formData, rto_paper_details: e.target.value})} 
              disabled={!isEmployee}
            />
            <InputField 
              label="Work Description" icon={<Info size={12}/>}
              type="text" value={formData.rto_work_description} onChange={(e) => setFormData({...formData, rto_work_description: e.target.value})} 
              disabled={!isEmployee}
            />
            <InputField 
              label="Agent Name" icon={<User size={12}/>}
              type="text" value={formData.rto_agent_name} onChange={(e) => setFormData({...formData, rto_agent_name: e.target.value})} 
              disabled={!isEmployee}
            />
            <InputField 
              label="Agent Mobile" icon={<Phone size={12}/>}
              type="text" value={formData.rto_agent_mobile} onChange={(e) => setFormData({...formData, rto_agent_mobile: e.target.value})} 
              disabled={!isEmployee}
            />
          </FormSection>

          <FormSection title="Vehicle Verification" icon={<ClipboardCheck size={18} />} colorClass="bg-amber-600">
            <div className="grid grid-cols-2 gap-4">
              <InputField 
                label="Pollution" type="text" 
                value={formData.pollution_status} onChange={(e) => setFormData({...formData, pollution_status: e.target.value})} 
                disabled={!isEmployee}
              />
              <InputField 
                label="Insurance" type="text"
                value={formData.insurance_status} onChange={(e) => setFormData({...formData, insurance_status: e.target.value})} 
                disabled={!isEmployee}
              />
              <InputField 
                label="Vechicle Check" type="text"
                value={formData.vehicle_check_status} onChange={(e) => setFormData({...formData, vehicle_check_status: e.target.value})} 
                disabled={!isEmployee}
              />
              <InputField 
                label="Challan" type="text"
                value={formData.challan_status} onChange={(e) => setFormData({...formData, challan_status: e.target.value})} 
                disabled={!isEmployee}
              />
            </div>
            <InputField 
              label="Location" icon={<MapPin size={12}/>}
              type="text" value={formData.dto_location} onChange={(e) => setFormData({...formData, dto_location: e.target.value})} 
              disabled={!isEmployee}
            />
          </FormSection>

          <FormSection title="NOC & Timeline" icon={<ShieldCheck size={18} />} colorClass="bg-purple-600">
            <InputField 
              label={`NOC Status ${isBT ? '*' : ''}`} icon={<ShieldCheck size={12}/>}
              type="text" value={formData.noc_status} onChange={(e) => setFormData({...formData, noc_status: e.target.value})} 
              disabled={!isEmployee}
            />
            <InputField 
              label="Commitment Date" icon={<Timer size={12}/>}
              type="date" value={formData.commitment_date} onChange={(e) => setFormData({...formData, commitment_date: e.target.value})} 
              disabled={!isEmployee}
            />
            <InputField 
              label="Delay Days" icon={<AlertCircle size={12}/>}
              type="number" value={formData.delay_days} onChange={(e) => setFormData({...formData, delay_days: e.target.value})} 
              disabled={!isEmployee}
            />
          </FormSection>

          {/* Optional: Add a summary or guide section here */}
          <div className="bg-slate-900 rounded-2xl p-6 text-white flex flex-col justify-center h-full relative overflow-hidden">
            <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-white/5 rounded-full blur-2xl" />
            <h4 className="text-xl font-black mb-2 flex items-center gap-2">
              <ClipboardCheck className="text-accent" />
              Submission Guide
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Ensure all mandatory fields marked with an asterisk (*) are filled correctly. Submitted data will be sent to the PDD Manager for final verification and approval.
            </p>
            <div className="mt-6 flex items-center gap-3">
              <div className="flex -space-x-2">
                {[1,2,3].map(i => <div key={i} className="w-8 h-8 rounded-full border-2 border-slate-900 bg-slate-700 overflow-hidden flex items-center justify-center text-[10px] font-bold">{i}</div>)}
              </div>
              <p className="text-[10px] font-bold text-slate-400">Step-by-step verification active</p>
            </div>
          </div>
        </div>

        {/* Footer info for admins */}
        {!isEmployee && (
          <div className="p-4 rounded-xl border border-dashed border-border text-center">
            <p className="text-xs text-muted-foreground">You are viewing this form in read-only mode. Only assigned employees can edit PDD details.</p>
          </div>
        )}
      </form>
    </div>
  );
}
