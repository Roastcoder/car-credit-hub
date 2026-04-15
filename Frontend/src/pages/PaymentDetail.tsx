import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';
import { paymentApplicationAPI } from '@/lib/api';
import { ArrowLeft, FileText, CreditCard, Building2, User, Calendar, CheckCircle, XCircle, Eye, Edit, DollarSign, Download, Info, Camera } from 'lucide-react';

const DocumentPreviewCard = ({ 
  doc, 
  onView 
}: { 
  doc: any; 
  onView: (doc: any) => void;
}) => {
  const isImage = doc.url.match(/\.(jpeg|jpg|gif|png|webp|svg)/i);

  return (
    <div className="group relative bg-card border border-border rounded-xl p-3 transition-all hover:shadow-md hover:border-accent/40">
      <div className="flex flex-col gap-3">
        <div className="flex justify-between items-start">
          <h4 className="text-[10px] font-bold text-foreground/80 uppercase tracking-widest truncate flex-1">
            {doc.type || 'DOCUMENT'}
          </h4>
          <span className="px-1.5 py-0.5 rounded-full bg-green-500/10 text-green-600 text-[8px] font-bold border border-green-500/20">
            SAVED
          </span>
        </div>
        
        <div className="relative aspect-video rounded-lg overflow-hidden bg-muted/30 border border-dashed border-border group-hover:border-accent/20 transition-colors flex items-center justify-center">
          {isImage ? (
            <img src={doc.url} alt={doc.name} className="w-full h-full object-cover" />
          ) : (
            <div className="flex flex-col items-center gap-2">
              <FileText size={32} className="text-accent/60" />
              <span className="text-[10px] font-medium text-muted-foreground uppercase">PDF Document</span>
            </div>
          )}
          
          {/* Hover Actions */}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <button 
              type="button"
              onClick={() => onView(doc)}
              className="p-2 bg-white text-black rounded-full hover:bg-blue-600 hover:text-white transition-all shadow-xl"
            >
              <Eye size={16} />
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground truncate max-w-[150px]">
             {doc.name}
          </span>
        </div>
      </div>
    </div>
  );
};


type PaymentStatus = 'draft' | 'submitted' | 'manager_approved' | 'manager_rejected' | 'sent_back' | 'account_processing' | 'voucher_created' | 'payment_released' | 'completed';

const PAYMENT_STATUSES = [
  { value: 'draft', label: 'Draft', color: 'bg-gray-100 text-gray-800', icon: FileText },
  { value: 'submitted', label: 'Submitted', color: 'bg-blue-100 text-blue-800', icon: Calendar },
  { value: 'manager_approved', label: 'RBM Approved', color: 'bg-indigo-100 text-indigo-800', icon: CheckCircle },
  { value: 'manager_rejected', label: 'RBM Rejected', color: 'bg-red-100 text-red-800', icon: XCircle },
  { value: 'sent_back', label: 'Sent Back', color: 'bg-orange-100 text-orange-800', icon:ArrowLeft },
  { value: 'voucher_created', label: 'Voucher Created', color: 'bg-purple-100 text-purple-800', icon: FileText },
  { value: 'payment_released', label: 'Payment Released', color: 'bg-blue-100 text-blue-800', icon: DollarSign },
  { value: 'completed', label: 'Completed', color: 'bg-green-100 text-green-800', icon: CheckCircle }
];

export default function PaymentDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [showUTRModal, setShowUTRModal] = useState(false);
  const [showProofModal, setShowProofModal] = useState(false);
  const [utrNumber, setUtrNumber] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [previewDoc, setPreviewDoc] = useState<{ url: string; name: string } | null>(null);
  const [uploadingProof, setUploadingProof] = useState(false);

  // Aadhaar Verification State
  const [verificationStep, setVerificationStep] = useState<'aadhaar' | 'otp' | 'utr'>('aadhaar');
  const [aadhaarNumber, setAadhaarNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [maskedPhone, setMaskedPhone] = useState('');

  // Fetch payment details
  const { data: payment, isLoading } = useQuery({
    queryKey: ['payment', id],
    queryFn: async () => paymentApplicationAPI.getById(parseInt(id!)),
    enabled: !!id,
  });

  // Fetch banking documents attached to the application
  const { data: bankingDocuments = [] } = useQuery({
    queryKey: ['payment-banking-docs', id],
    queryFn: async () => {
      if (!payment?.banking_documents) return [];
      const docPaths = typeof payment.banking_documents === 'string' 
        ? JSON.parse(payment.banking_documents) 
        : payment.banking_documents;
        
      if (!Array.isArray(docPaths) || docPaths.length === 0) return [];
      
      return docPaths.map(path => ({
        url: `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}${path}`,
        name: path.split('/').pop() || 'Document',
        type: 'Banking Proof'
      }));
    },
    enabled: !!payment,
  });

  // Fetch all loan documents - use loan_id or fall back to loan_number
  const loanIdentifier = payment?.loan_id || payment?.loan_number;
  const { data: loanDocuments = [] } = useQuery({
    queryKey: ['payment-loan-docs', loanIdentifier],
    queryFn: async () => {
      if (!loanIdentifier) return [];
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const response = await fetch(`${apiUrl}/loans/${loanIdentifier}/documents`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
      });
      if (!response.ok) {
        console.warn('Failed to fetch loan documents:', response.status);
        return [];
      }
      const data = await response.json();
      const baseUrl = apiUrl.replace(/\/api$/, '');
      return (Array.isArray(data) ? data : []).map((doc: any) => ({
        ...doc,
        url: doc.file_url?.startsWith('http') ? doc.file_url : `${baseUrl}${doc.file_url}`,
        name: doc.document_name || doc.document_type || doc.file_name || 'Document',
        type: doc.document_type || 'Loan Document'
      }));
    },
    enabled: !!loanIdentifier,
  });

  // Update payment status (manager action)
  const managerAction = useMutation({
    mutationFn: async ({ action, remarks }: { action: 'approve' | 'reject' | 'send_back'; remarks?: string }) => {
      const result = await paymentApplicationAPI.managerAction(parseInt(id!), action, remarks);
      return result;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['payment', id] });
      toast.success(data.message);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to process application');
    }
  });

  // Add UTR number
  const addUTRNumber = useMutation({
    mutationFn: async (utr: string) => {
      const result = await paymentApplicationAPI.addUTR(parseInt(id!), utr);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment', id] });
      setShowUTRModal(false);
      setUtrNumber('');
      toast.success('UTR number added and payment released. Please upload proof next.');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to add UTR number');
    }
  });

  // Upload Proof
  const uploadProof = useMutation({
    mutationFn: async (file: File) => {
      const result = await paymentApplicationAPI.uploadProof(parseInt(id!), file);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment', id] });
      toast.success('Payment proof uploaded and application completed!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to upload proof');
    }
  });

  // Aadhaar Verification Mutations
  const initiateAadhaarVerify = useMutation({
    mutationFn: async (aadhaar: string) => {
      return paymentApplicationAPI.initiateAadhaarVerification(parseInt(id!), aadhaar);
    },
    onSuccess: (data: any) => {
      setMaskedPhone(data.phone || '');
      setVerificationStep('otp');
      toast.success(data.message || 'Verification code sent to customer');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Aadhaar verification failed');
    }
  });

  const verifyOTP = useMutation({
    mutationFn: async (otp: string) => {
      return paymentApplicationAPI.verifyAadhaarOTP(parseInt(id!), otp);
    },
    onSuccess: (data: any) => {
      setVerificationStep('utr');
      toast.success(data.message || 'Verification successful. You can now enter the UTR.');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Invalid or expired OTP');
    }
  });

  const previewDocument = async (doc: any) => {
    try {
      const url = doc.url || doc.file_url;
      const name = doc.name || doc.document_name || doc.file_name;
      
      setPreviewDoc({ url, name });
    } catch (error) {
      toast.error('Failed to load document');
    }
  };

  const handleUTRSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!utrNumber.trim()) {
      toast.error('Please enter UTR number');
      return;
    }
    addUTRNumber.mutate(utrNumber.trim());
  };

  if (isLoading) {
    return (
      <div className="py-20 text-center">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-muted-foreground text-sm">Loading payment details...</p>
      </div>
    );
  }

  if (!payment) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Payment not found</p>
        <button onClick={() => navigate('/payments')} className="mt-4 text-accent hover:underline text-sm">
          ← Back to payments
        </button>
      </div>
    );
  }

  const formatDisplayDate = (value: unknown) => {
    if (!value) return '—';
    if (typeof value !== 'string') {
      const date = new Date(value as string | number | Date);
      return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString('en-IN');
    }

    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const [year, month, day] = value.split('-');
      return `${day}/${month}/${year}`;
    }

    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('en-IN');
  };

  const statusConfig = PAYMENT_STATUSES.find(s => s.value === payment.status);
  const canApprove = ['manager', 'admin', 'super_admin'].includes(user?.role || '') && payment.status === 'submitted';
  const canProcess = (['accountant', 'admin', 'super_admin'].includes(user?.role || '')) && payment.status === 'manager_approved';
  const canAddUTR = (['accountant', 'admin', 'super_admin'].includes(user?.role || '')) && payment.status === 'voucher_created';
  const canUploadProof = (['accountant', 'admin', 'super_admin'].includes(user?.role || '')) && payment.status === 'payment_released';

  const Section = ({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) => (
    <div className="bg-card rounded-lg border border-border p-6">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-accent">{icon}</span>
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      </div>
      {children}
    </div>
  );

  const Field = ({ label, value, className = "" }: { label: string; value: string | React.ReactNode; className?: string }) => (
    <div className={className}>
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <div className="text-sm font-medium text-foreground">{value || '—'}</div>
    </div>
  );

  return (
    <>
      <div className="max-w-6xl mx-auto px-4 pb-20 lg:pb-4">
        <button 
          onClick={() => navigate('/payments')} 
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
        >
          <ArrowLeft size={16} /> Back to Payments
        </button>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-foreground">
                {payment.payment_id || `PAY-${payment.id}`}
              </h1>
              {statusConfig && (
                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${statusConfig.color}`}>
                  <statusConfig.icon size={14} />
                  {statusConfig.label}
                </span>
              )}
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>Loan: <span className="font-medium text-accent">{payment.loan_number}</span></span>
              <span>•</span>
              <span>Customer: <span className="font-medium">{payment.applicant_name}</span></span>
              <span>•</span>
              <span>Amount: <span className="font-medium text-green-600">{formatCurrency(Number(payment.amount))}</span></span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            {canApprove && (
              <>
                <button
                  onClick={() => managerAction.mutate({ action: 'approve' })}
                  disabled={managerAction.isPending}
                  className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm font-medium disabled:opacity-50"
                >
                  <CheckCircle size={16} />
                  {managerAction.isPending ? 'Processing...' : 'RBM Approve'}
                </button>
                <button
                  onClick={() => {
                    const remarks = prompt('Enter send back remarks (instructions for corrections):');
                    if (remarks) managerAction.mutate({ action: 'send_back', remarks });
                  }}
                  disabled={managerAction.isPending}
                  className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-sm font-medium disabled:opacity-50"
                >
                  <ArrowLeft size={16} />
                  Send Back
                </button>
                <button
                  onClick={() => {
                    const remarks = prompt('Enter rejection remarks:');
                    if (remarks) managerAction.mutate({ action: 'reject', remarks });
                  }}
                  disabled={managerAction.isPending}
                  className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm font-medium disabled:opacity-50"
                >
                  <XCircle size={16} />
                  Reject
                </button>
              </>
            )}
            
            {canProcess && (
              <button
                onClick={() => navigate(`/account/vouchers/create/${id}`)}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
              >
                <FileText size={16} />
                Generate Voucher
              </button>
            )}
            
            {canAddUTR && (
              <form onSubmit={handleUTRSubmit} className="flex items-center gap-2">
                <input
                  type="text"
                  value={utrNumber}
                  onChange={(e) => setUtrNumber(e.target.value)}
                  placeholder="Enter UTR number"
                  required
                  className="px-3 py-2 border border-border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 w-48"
                />
                <button
                  type="submit"
                  disabled={addUTRNumber.isPending || !utrNumber.trim()}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium disabled:opacity-50"
                >
                  <DollarSign size={16} />
                  {addUTRNumber.isPending ? 'Releasing...' : 'Confirm & Release'}
                </button>
              </form>
            )}

            {canUploadProof && (
              <button
                onClick={() => document.getElementById('final-proof-upload')?.click()}
                disabled={uploadProof.isPending}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium disabled:opacity-50"
              >
                <Download size={16} />
                {uploadProof.isPending ? 'Uploading...' : 'Upload Payment Proof'}
              </button>
            )}

            <input 
              type="file" 
              id="final-proof-upload" 
              className="hidden" 
              accept="image/*,.pdf"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) uploadProof.mutate(file);
              }}
            />
          </div>
        </div>

        {/* Main Details Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Beneficiary & Bank Information - HIGHLIGHTED */}
          <div className="lg:col-span-2">
            <Section title="Beneficiary & Bank Details" icon={<Building2 size={20} />}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 bg-blue-50/50 dark:bg-blue-900/10 p-4 rounded-xl border border-blue-100 dark:border-blue-900/20">
                <div className="col-span-1 md:col-span-2">
                  <Field label="Payment In Favour (Beneficiary)" value={payment.payment_in_favour_name} className="text-lg font-bold text-blue-700 dark:text-blue-400" />
                </div>
                <Field label="Bank Name" value={payment.bank_name} />
                <Field label="Account Number" value={payment.account_number} className="font-mono tracking-wider text-green-600 dark:text-green-400" />
                <Field label="IFSC Code" value={payment.ifsc_code} className="font-mono text-gray-700 dark:text-gray-300" />
                <Field label="Branch Name" value={payment.branch_name} />
                <Field label="Total Amount to Pay" value={formatCurrency(Number(payment.payment_amount || payment.amount))} className="text-xl font-bold" />
                <Field label="RBM Approval Status" value={payment.dm_approval ? 'APPROVED' : 'PENDING'} />
              </div>
            </Section>
          </div>

          {/* Customer & Info */}
          <Section title="Contact & KYC Information" icon={<User size={20} />}>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Applicant Name" value={payment.applicant_name} />
              <Field label="Phone Number" value={payment.applicant_phone} />
              <div className="col-span-2">
                <Field label="Email Address" value={payment.applicant_email} />
              </div>
              <Field label="KYC Documents Verified" value={payment.kyc_documents === 'Yes' ? 'YES' : 'NO'} />
              <Field label="Status" value={payment.status?.toUpperCase()} />
              <Field label="Created By" value={payment.created_by_name || 'System'} />
              <Field label="Application Date" value={formatDisplayDate(payment.created_at)} />
              
              {payment.utr_number && (
                <div className="col-span-1 bg-green-50 dark:bg-green-900/10 p-3 rounded-lg border border-green-100 dark:border-green-900/20">
                  <Field label="UTR Number" value={payment.utr_number} />
                </div>
              )}
              {payment.payment_proof_path && (
                <div className="col-span-1 bg-blue-50 dark:bg-blue-900/10 p-3 rounded-lg border border-blue-100 dark:border-blue-900/20">
                  <p className="text-xs text-muted-foreground mb-1">Payment Proof</p>
                  <a 
                    href={`${import.meta.env.VITE_API_URL}${payment.payment_proof_path}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-sm font-bold text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    <Eye size={14} /> View Attachment
                  </a>
                </div>
              )}
              <Field label="Payment Date" value={formatDisplayDate(payment.released_at)} />
            </div>
          </Section>

          {/* Vehicle Information */}
          <Section title="Vehicle & RTO Details" icon={<Building2 size={20} />}>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Vehicle Name" value={payment.vehicle_name} />
              <Field label="Vehicle Model" value={payment.vehicle_model} />
              <Field label="Vehicle Number" value={payment.vehicle_number} />
              <Field label="Vehicle Type" value={payment.vehicle_type} />
              <Field label="RTO Agent" value={payment.rto_agent_name} />
              <Field label="RTO Mobile" value={payment.rto_mobile} />
              <Field label="DTO Location" value={payment.dto_location} />
              <Field label="RTO Work Type" value={payment.rto_work_type} />
              <Field label="RC Status" value={payment.rc_status} />
              <Field label="NOC Status" value={payment.noc_status} />
            </div>
          </Section>

          {/* Loan & Financial Information */}
          <Section title="Loan & Financial Details" icon={<DollarSign size={20} />}>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Financier Name" value={payment.financier_name} />
              <Field label="Loan Amount" value={formatCurrency(Number(payment.loan_amount || 0))} />
              <Field label="Disbursement Amount" value={formatCurrency(Number(payment.disbursement_amount || 0))} />
              <Field label="Disbursement Date" value={formatDisplayDate(payment.disbursement_date)} />
              <Field label="Tenure (Months)" value={String(payment.tenure_months || 0)} />
              <Field label="EMI Amount" value={formatCurrency(Number(payment.emi_amount || 0))} />
              <Field label="EMI Mode" value={payment.emi_mode || '—'} />
              <Field label="IRR (%)" value={`${payment.irr_percentage || 0}%`} />
              <Field label="Loan Type" value={payment.loan_type} />
              <div className="col-span-2">
                <Field label="Purpose/Description" value={payment.payment_purpose || payment.description} />
              </div>
              <Field label="File Booked Code" value={payment.file_booked_code} />
            </div>
          </Section>

          {/* Payment Release Breakdown */}
          <Section title="Payment Release Breakdown" icon={<CreditCard size={20} />}>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Foreclosure Amount" value={formatCurrency(Number(payment.foreclosure_amount || 0))} />
              <Field label="Foreclosure Name" value={payment.foreclosure_name} />
              <Field label="Old Release Amount" value={formatCurrency(Number(payment.old_release_amount || 0))} />
              <Field label="Today Release Amount" value={formatCurrency(Number(payment.today_release_amount || 0))} />
              <Field label="Total Release Amount" value={formatCurrency(Number(payment.total_release_amount || 0))} />
              <Field label="Total Release (%)" value={`${payment.total_release_percentage || 0}%`} />
              <Field label="Mehar Deduction" value={formatCurrency(Number(payment.hold_amount || 0))} />
              <Field label="Mehar Deduction (%)" value={`${payment.hold_percentage || 0}%`} />
              <Field label="Challan Amount" value={formatCurrency(Number(payment.challan_amount || 0))} />
              <Field label="Payment In Favour" value={payment.payment_in_favour_name} />
            </div>
          </Section>

          {/* Verification & Status Details */}
          <Section title="Verification & Office Details" icon={<CheckCircle size={20} />}>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Our Branch" value={payment.branch_name} />
              <Field label="Disbursement Branch" value={payment.disbursement_branch} />
              { (payment.creator_role === 'broker' || (payment as any).referred_by_name) ? (
                <Field label="Referred By" value={(payment as any).referred_by_name} />
              ) : (
                <Field label="Branch Manager" value={payment.branch_manager_name} />
              )}
              <Field label="NOC Checked By" value={payment.noc_checked_by} />
              <Field label="RC Status" value={payment.rc_status} />
              <Field label="NOC Status" value={payment.noc_status} />
              <Field label="Insurance Available" value={payment.insurance_available ? 'YES' : 'NO'} />
              <Field label="3rd Party Stamp" value={payment.third_party_stamp ? 'YES' : 'NO'} />
              <Field label="NOC Stamp" value={payment.noc_stamp ? 'YES' : 'NO'} />
              <Field label="Is Third Party" value={payment.is_third_party ? 'YES' : 'NO'} />
            </div>
          </Section>

          {/* Voucher Information */}
          {payment.voucher_number && (
            <Section title="Voucher Information" icon={<FileText size={20} />}>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Voucher Number" value={payment.voucher_number} />
                <Field label="Voucher Date" value={formatDisplayDate(payment.voucher_date)} />
                <Field label="Payment Method" value={payment.payment_method?.toUpperCase()} />
                <Field label="Reference Number" value={payment.reference_number} />
                <Field label="Prepared By" value={payment.prepared_by} />
                <Field label="Approved By" value={payment.approved_by} />
                {payment.narration && (
                  <div className="col-span-2">
                    <Field label="Narration" value={payment.narration} />
                  </div>
                )}
              </div>
            </Section>
          )}
        </div>

        {/* Supporting Documents (Banking & PDD) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <Section title="Banking Proofs" icon={<FileText size={20} />}>
            {bankingDocuments.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {bankingDocuments.map((doc, idx) => (
                  <DocumentPreviewCard 
                    key={idx}
                    doc={doc}
                    onView={previewDocument}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 border border-dashed border-border rounded-xl bg-muted/20">
                <Camera size={24} className="text-muted-foreground/30 mb-2" />
                <p className="text-sm text-muted-foreground italic">No banking documents attached</p>
              </div>
            )}
          </Section>

          <Section title="Loan Documents" icon={<FileText size={20} />}>
            {loanDocuments.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {loanDocuments.map((doc: any, idx: number) => (
                  <DocumentPreviewCard 
                    key={idx}
                    doc={doc}
                    onView={previewDocument}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 border border-dashed border-border rounded-xl bg-muted/20">
                <Camera size={24} className="text-muted-foreground/30 mb-2" />
                <p className="text-sm text-muted-foreground italic">No documents found for this loan</p>
              </div>
            )}
          </Section>
        </div>

        {/* Remarks */}
        {payment.manager_remarks && (
          <Section title="RBM Remarks" icon={<Info size={20} className="text-orange-500" />}>
            <div className="p-4 bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-800 rounded-lg">
              <p className="text-sm font-semibold text-orange-800 dark:text-orange-300 mb-1">Feedback from RBM (Regional Business Manager):</p>
              <p className="text-sm text-foreground whitespace-pre-wrap">{payment.manager_remarks}</p>
            </div>
          </Section>
        )}

        {payment.remarks && (
          <Section title="Applicant Remarks" icon={<FileText size={20} />}>
            <p className="text-sm text-foreground whitespace-pre-wrap">{payment.remarks}</p>
          </Section>
        )}
      </div>

      {/* Document Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="text-lg font-semibold text-foreground truncate">
                {previewDoc.name}
              </h3>
              <button
                onClick={() => setPreviewDoc(null)}
                className="p-2 rounded-lg hover:bg-muted transition-colors"
              >
                <XCircle size={20} className="text-muted-foreground" />
              </button>
            </div>
            <div className="p-4 max-h-[calc(90vh-80px)] overflow-auto">
              {previewDoc.url.toLowerCase().includes('.pdf') ? (
                <iframe
                  src={previewDoc.url}
                  className="w-full h-[600px] border border-border rounded-lg"
                  title={previewDoc.name}
                />
              ) : (
                <img
                  src={previewDoc.url}
                  alt={previewDoc.name}
                  className="max-w-full h-auto rounded-lg"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
