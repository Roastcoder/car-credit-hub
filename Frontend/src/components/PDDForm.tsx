import { useState, useEffect } from 'react';
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
  Eye,
  FileText,
  MessageSquare,
  Car,
  IndianRupee,
  CheckCircle2,
  Trash2,
  Camera,
  Upload,
  ArrowLeft,
  ChevronUp,
  ChevronDown,
  ExternalLink
} from 'lucide-react';

import { cn } from '@/lib/utils';

interface PDDFormProps {
  loan: any;
  onCancel: () => void;
  onSuccess: () => void;
  existingDocuments?: any[];
}

// Design System Tokens (Matching CreateLoan.tsx)
const labelClass = "text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block ml-1";
const inputClass = "w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm transition-all focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent disabled:opacity-50 disabled:bg-muted/30 font-medium";

const DocumentUploadCard = ({
  label,
  file,
  existingDocs,
  types,
  onChange,
  onClear,
  disabled
}: {
  label: string;
  file: File | null;
  existingDocs: any[];
  types: string[];
  onChange: (file: File | null) => void;
  onClear: () => void;
  disabled?: boolean;
}) => {
  const [preview, setPreview] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const matchedDocs = existingDocs.filter(d => types.includes(d.document_type));

  useEffect(() => {
    if (file) {
      const url = URL.createObjectURL(file);
      setPreview(url);
      return () => URL.revokeObjectURL(url);
    } else if (matchedDocs.length > 0) {
      const doc = matchedDocs[0];
      const baseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/api$/, '');
      setPreview(`${baseUrl}${doc.file_url}`);
    } else {
      setPreview(null);
    }
  }, [file, matchedDocs]);

  const isImage = (url: string | null) => {
    if (!url) return false;
    return url.match(/\.(jpeg|jpg|gif|png|webp|svg)/i) || url.startsWith('blob:');
  };

  const toggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (preview && isImage(preview)) {
      setIsExpanded(!isExpanded);
    } else if (preview) {
      window.open(preview, '_blank');
    }
  };

  return (
    <div className={cn(
      "group relative bg-card border border-border rounded-2xl p-4 transition-all hover:shadow-md",
      isExpanded ? "col-span-full border-accent/40 bg-accent/5" : "hover:border-accent/40"
    )}>
      <div className="flex flex-col gap-3">
        <div className="flex justify-between items-center">
          <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
            <FileText size={12} className="text-accent" />
            {label}
          </h4>
          {(file || matchedDocs.length > 0) && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500/10 text-[9px] font-black text-green-600 border border-green-500/20 uppercase tracking-tighter">
              <CheckCircle2 size={10} /> {file ? 'NEW' : 'SAVED'}
            </span>
          )}
        </div>

        <div 
          onClick={toggleExpand}
          className={cn(
            "relative cursor-pointer rounded-xl overflow-hidden bg-muted/30 border border-dashed border-border group-hover:border-accent/20 transition-all flex items-center justify-center",
            isExpanded ? "aspect-auto max-h-[80vh]" : "aspect-video"
          )}
        >
          {preview ? (
            <>
              {isImage(preview) ? (
                <img 
                  src={preview} 
                  alt={label} 
                  className={cn(
                    "transition-all",
                    isExpanded ? "w-full h-auto p-2 object-contain" : "w-full h-full object-cover"
                  )} 
                />
              ) : (
                <div className="flex flex-col items-center gap-2 py-6">
                  <FileText size={32} className="text-accent/60" />
                  <span className="text-[10px] font-black text-muted-foreground uppercase">PDF Document</span>
                </div>
              )}
              {!isExpanded && (
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="p-2 bg-white text-black rounded-full shadow-lg">
                    {isImage(preview) ? <Eye size={18} /> : <ExternalLink size={18} />}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center gap-2 py-6">
              <Upload size={24} className="text-muted-foreground/40" />
              <span className="text-[10px] font-black text-muted-foreground/60 tracking-wider">NO DOCUMENT</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-2">
          {preview && isImage(preview) && (
            <button
              type="button"
              onClick={toggleExpand}
              className="flex items-center gap-1 text-[10px] font-black text-accent hover:underline uppercase tracking-tight"
            >
              {isExpanded ? <><ChevronUp size={12} /> Collapse</> : <><ChevronDown size={12} /> Inline Preview</>}
            </button>
          )}
          
          <div className="flex items-center gap-2 ml-auto">
            {!disabled && (
              <label className="p-2 bg-muted text-foreground rounded-xl cursor-pointer hover:bg-accent hover:text-white transition-all shadow-sm">
                <Camera size={16} />
                <input 
                  type="file" 
                  className="hidden" 
                  onChange={(e) => onChange(e.target.files?.[0] || null)}
                  accept="image/*,application/pdf"
                />
              </label>
            )}
            {file && !disabled && (
              <button
                type="button"
                onClick={onClear}
                className="p-2 bg-muted text-foreground rounded-xl hover:bg-red-600 hover:text-white transition-all shadow-sm"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const FormSection = ({ title, icon, children, index }: { title: string, icon: React.ReactNode, children: React.ReactNode, index: number }) => (
  <div className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-6 text-foreground">
    <h2 className="text-lg font-bold flex items-center gap-3 pb-3 border-b border-border/50">
      <span className="w-8 h-8 rounded-full bg-accent text-accent-foreground text-xs font-black flex items-center justify-center shadow-lg shadow-accent/20">
        {index}
      </span>
      <span className="flex items-center gap-2 uppercase tracking-tight">
        {icon}
        {title}
      </span>
    </h2>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {children}
    </div>
  </div>
);

const InputField = ({ label, icon, ...props }: { label: string, icon?: React.ReactNode } & React.InputHTMLAttributes<HTMLInputElement>) => (
  <div className="space-y-1">
    <label className={labelClass}>
      <span className="flex items-center gap-1.5">
        {icon && <span className="opacity-70">{icon}</span>}
        {label}
      </span>
    </label>
    <input 
      {...props} 
      className={cn(inputClass, props.className)} 
    />
  </div>
);

export default function PDDForm({ loan, onCancel, onSuccess, existingDocuments = [] }: PDDFormProps) {
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
    pdd_remarks: '',
  });

  const [files, setFiles] = useState<{ [key: string]: File | null }>({
    fc: null,
    noc: null,
    rc: null,
    dm: null,
    insurance: null
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
      if (Object.values(files).some(f => !!f)) {
        const docFormData = new FormData();
        if (files.fc) docFormData.append('foreclose_document', files.fc);
        if (files.noc) docFormData.append('noc', files.noc);
        if (files.rc) docFormData.append('rc_document', files.rc);
        if (files.dm) docFormData.append('dm_document', files.dm);
        if (files.insurance) docFormData.append('insurance', files.insurance);
        
        await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/loans/${loan.loan_number || loan.id}/documents/multiple`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
          },
          body: docFormData
        }).catch(err => console.error('Failed to upload documents', err));
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/loans/${loan.loan_number || loan.id}/pdd`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify(formData)
      });
      if (response.ok) {
        toast.success('🎉 PDD Application Submitted Successfully!');
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
    <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 max-w-7xl mx-auto px-4 sm:px-6">
      <form onSubmit={handleSubmit} className="space-y-8 pb-12">
        {/* Loan App Style Header */}
        <div className="bg-card rounded-2xl border border-border shadow-lg p-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex gap-4 items-center">
            <div className="w-16 h-16 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
              <Car size={32} />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 rounded bg-accent/10 text-accent text-[10px] font-bold uppercase tracking-widest">{loan.loan_number}</span>
                <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 text-[10px] font-bold uppercase tracking-widest">PDD UPDATE</span>
              </div>
              <h2 className="text-2xl font-bold text-foreground tracking-tight">{loan.applicant_name}</h2>
              <p className="text-xs font-medium text-muted-foreground">{loan.car_make} {loan.car_model} • ₹{new Intl.NumberFormat('en-IN').format(loan.loan_amount || 0)}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <button 
              type="button" 
              onClick={onCancel} 
              className="flex-1 md:flex-none px-6 py-3 rounded-xl text-xs font-bold text-muted-foreground hover:bg-muted transition-all active:scale-95 border border-border uppercase tracking-widest"
            >
              Cancel
            </button>
            {isEmployee && (
              <button 
                type="submit" 
                disabled={isSubmitting} 
                className="flex-1 md:flex-none px-8 py-3 bg-accent text-white rounded-xl text-xs font-black hover:brightness-110 shadow-lg shadow-accent/20 transition-all flex items-center justify-center gap-2 active:scale-95 uppercase tracking-widest"
              >
                {isSubmitting ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Save size={16} />
                    {isRejected ? 'RE-SUBMIT' : 'SAVE PDD'}
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Alerts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {isRejected && (
            <div className="bg-red-500/5 border border-red-500/20 p-5 rounded-2xl flex gap-4 items-start">
              <AlertCircle size={20} className="text-red-500 mt-1" />
              <div>
                <p className="text-[10px] font-black text-red-600 uppercase tracking-widest mb-1">Correction Required</p>
                <p className="text-sm text-red-700/80 font-medium italic">"{loan.pdd_rejection_reason || 'Please review and fix documents.'}"</p>
              </div>
            </div>
          )}
          {isBT && (
            <div className="bg-indigo-500/5 border border-indigo-500/20 p-5 rounded-2xl flex gap-4 items-start">
              <Landmark size={20} className="text-indigo-500 mt-1" />
              <div>
                <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-1">BT Protocol</p>
                <p className="text-sm text-indigo-700/80 font-medium italic">Mandatory FC and NOC documents required.</p>
              </div>
            </div>
          )}
        </div>

        {/* Stacked Layout - Single Page Form Style */}
        <div className="flex flex-col gap-6 max-w-5xl mx-auto">
          
          <FormSection title="Finance & Bank" icon={<CreditCard size={18} />} index={1}>
            <InputField 
              label="Payment Received Date" icon={<Calendar size={12}/>}
              type="date" value={formData.payment_received_date} onChange={(e) => setFormData({...formData, payment_received_date: e.target.value})} 
              disabled={!isEmployee}
            />
            <InputField 
              label="M-Parivahan Financier" icon={<Landmark size={12}/>}
              placeholder="e.g. HDFC Bank"
              value={formData.financier_m_parivahan} onChange={(e) => setFormData({...formData, financier_m_parivahan: e.target.value})} 
              disabled={!isEmployee}
            />
            <InputField 
              label="Balance Status" icon={<IndianRupee size={12}/>}
              placeholder="Full Payment Clear"
              value={formData.balance_payment_status} onChange={(e) => setFormData({...formData, balance_payment_status: e.target.value})} 
              disabled={!isEmployee}
            />
            <InputField 
              label="Finance Co. Update" icon={<Files size={12}/>}
              placeholder="PDD Updated at Finance Co."
              value={formData.pdd_update_finance_company} onChange={(e) => setFormData({...formData, pdd_update_finance_company: e.target.value})} 
              disabled={!isEmployee}
            />
          </FormSection>

          {isBT && (
            <FormSection title="FC Details" icon={<Landmark size={18} />} index={2}>
              <InputField 
                label="FC Deposited By *" icon={<User size={12}/>}
                value={formData.fc_deposited_by} onChange={(e) => setFormData({...formData, fc_deposited_by: e.target.value})} 
                disabled={!isEmployee}
              />
              <InputField 
                label="Deposit Date *" icon={<Calendar size={12}/>}
                type="date" value={formData.fc_deposit_date} onChange={(e) => setFormData({...formData, fc_deposit_date: e.target.value})} 
                disabled={!isEmployee}
              />
              <InputField 
                label="Current FC Status *" icon={<AlertCircle size={12}/>}
                value={formData.current_fc_status} onChange={(e) => setFormData({...formData, current_fc_status: e.target.value})} 
                disabled={!isEmployee}
              />
              <InputField 
                label="FC Receipt Number" icon={<FileText size={12}/>}
                value={formData.fc_receipt} onChange={(e) => setFormData({...formData, fc_receipt: e.target.value})} 
                disabled={!isEmployee}
              />
              <InputField 
                label="Zero Statement" icon={<FileText size={12}/>}
                value={formData.zero_statement} onChange={(e) => setFormData({...formData, zero_statement: e.target.value})} 
                disabled={!isEmployee}
              />
              <InputField 
                label="Prev Financier Name" icon={<Landmark size={12}/>}
                value={formData.prev_financier_account_status} onChange={(e) => setFormData({...formData, prev_financier_account_status: e.target.value})} 
                disabled={!isEmployee}
              />
            </FormSection>
          )}

          <FormSection title="RTO & Description" icon={<Files size={18} />} index={isBT ? 3 : 2}>
            <InputField 
              label="RTO Paper Details" icon={<FileText size={12}/>}
              value={formData.rto_paper_details} onChange={(e) => setFormData({...formData, rto_paper_details: e.target.value})} 
              disabled={!isEmployee}
            />
            <InputField 
              label="Agent Name" icon={<User size={12}/>}
              value={formData.rto_agent_name} onChange={(e) => setFormData({...formData, rto_agent_name: e.target.value})} 
              disabled={!isEmployee}
            />
            <InputField 
              label="Agent Contact" icon={<Phone size={12}/>}
              value={formData.rto_agent_mobile} onChange={(e) => setFormData({...formData, rto_agent_mobile: e.target.value})} 
              disabled={!isEmployee}
            />
            <InputField 
              label="Work Status" icon={<AlertCircle size={12}/>}
              value={formData.rto_work_status} onChange={(e) => setFormData({...formData, rto_work_status: e.target.value})} 
              disabled={!isEmployee}
            />
            <InputField 
              label="Docs Location" icon={<MapPin size={12}/>}
              value={formData.rto_docs_location} onChange={(e) => setFormData({...formData, rto_docs_location: e.target.value})} 
              disabled={!isEmployee}
            />
            <InputField 
              label="Work Description" icon={<Info size={12}/>}
              value={formData.rto_work_description} onChange={(e) => setFormData({...formData, rto_work_description: e.target.value})} 
              disabled={!isEmployee}
            />
          </FormSection>

          <FormSection title="Verification" icon={<ClipboardCheck size={18} />} index={isBT ? 4 : 3}>
            <InputField 
              label="Pollution" value={formData.pollution_status} 
              onChange={(e) => setFormData({...formData, pollution_status: e.target.value})} 
              disabled={!isEmployee}
            />
            <InputField 
              label="Insurance" value={formData.insurance_status} 
              onChange={(e) => setFormData({...formData, insurance_status: e.target.value})} 
              disabled={!isEmployee}
            />
            <InputField 
              label="Challan" value={formData.challan_status} 
              onChange={(e) => setFormData({...formData, challan_status: e.target.value})} 
              disabled={!isEmployee}
            />
            <InputField 
              label="Police Case" value={formData.police_case_status} 
              onChange={(e) => setFormData({...formData, police_case_status: e.target.value})} 
              disabled={!isEmployee}
            />
            <InputField 
              label="Insurance Endorsement" icon={<ShieldCheck size={12}/>}
              value={formData.insurance_endorsement} onChange={(e) => setFormData({...formData, insurance_endorsement: e.target.value})} 
              disabled={!isEmployee}
            />
            <InputField 
              label="Location" icon={<MapPin size={12}/>}
              value={formData.dto_location} onChange={(e) => setFormData({...formData, dto_location: e.target.value})} 
              disabled={!isEmployee}
            />
          </FormSection>

          <FormSection title="NOC & Schedule" icon={<ShieldCheck size={18} />} index={isBT ? 5 : 4}>
            <InputField 
              label={`NOC Status ${isBT ? '*' : ''}`} icon={<ShieldCheck size={12}/>}
              value={formData.noc_status} onChange={(e) => setFormData({...formData, noc_status: e.target.value})} 
              disabled={!isEmployee}
            />
            <InputField 
              label="Checked By" icon={<User size={12}/>}
              value={formData.noc_checked_by} onChange={(e) => setFormData({...formData, noc_checked_by: e.target.value})} 
              disabled={!isEmployee}
            />
            <InputField 
              label="Commitment Date" icon={<Timer size={12}/>}
              type="date" value={formData.commitment_date} onChange={(e) => setFormData({...formData, commitment_date: e.target.value})} 
              disabled={!isEmployee}
            />
            <InputField 
              label="Delay (Days)" icon={<AlertCircle size={12}/>}
              type="number" value={formData.delay_days} onChange={(e) => setFormData({...formData, delay_days: e.target.value})} 
              disabled={!isEmployee}
            />
          </FormSection>

          {/* Consolidated Document Upload Section */}
          <FormSection title="Document Verification" icon={<Files size={18} />} index={isBT ? 6 : 5}>
            <DocumentUploadCard 
              label="RC Image"
              file={files.rc}
              existingDocs={existingDocuments}
              types={['rc_front', 'rc_back', 'rc_document']}
              onChange={(f) => setFiles({...files, rc: f})}
              onClear={() => setFiles({...files, rc: null})}
              disabled={!isEmployee}
            />
            <DocumentUploadCard 
              label="Insurance Policy"
              file={files.insurance}
              existingDocs={existingDocuments}
              types={['insurance', 'insurance_document']}
              onChange={(f) => setFiles({...files, insurance: f})}
              onClear={() => setFiles({...files, insurance: null})}
              disabled={!isEmployee}
            />
            <DocumentUploadCard 
              label="NOC Document"
              file={files.noc}
              existingDocs={existingDocuments}
              types={['noc']}
              onChange={(f) => setFiles({...files, noc: f})}
              onClear={() => setFiles({...files, noc: null})}
              disabled={!isEmployee}
            />
            <DocumentUploadCard 
              label="DM Document"
              file={files.dm}
              existingDocs={existingDocuments}
              types={['dm_document']}
              onChange={(f) => setFiles({...files, dm: f})}
              onClear={() => setFiles({...files, dm: null})}
              disabled={!isEmployee}
            />
            {isBT && (
              <DocumentUploadCard 
                label="Foreclose Document"
                file={files.fc}
                existingDocs={existingDocuments}
                types={['foreclose_document', 'fitness_document']}
                onChange={(f) => setFiles({...files, fc: f})}
                onClear={() => setFiles({...files, fc: null})}
                disabled={!isEmployee}
              />
            )}
          </FormSection>

          <FormSection title="Other Remarks" icon={<MessageSquare size={18} />} index={isBT ? 7 : 6}>
            <div className="md:col-span-2 lg:col-span-3 space-y-4">
              <div className="space-y-2">
                <label className={labelClass}>Process Remarks</label>
                <textarea 
                  className={cn(inputClass, "min-h-[120px] resize-none")}
                  placeholder="Enter any additional notes for the manager..."
                  value={formData.pdd_remarks}
                  onChange={(e) => setFormData({...formData, pdd_remarks: e.target.value})}
                  disabled={!isEmployee}
                />
              </div>
              <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/10 flex gap-3">
                <Info size={16} className="text-amber-600 shrink-0 mt-0.5" />
                <p className="text-xs font-medium text-amber-700/80 leading-relaxed">
                  Submitting this form will move the application to the Manager's PDD Approval queue. Ensure all required documents are attached.
                </p>
              </div>
            </div>
          </FormSection>

        </div>
      </form>
    </div>
  );
}
