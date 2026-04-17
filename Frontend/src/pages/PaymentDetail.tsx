import { useState, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import logo from '../assets/logo.png';
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

interface PaymentApplication {
  id: number;
  payment_id?: string;
  loan_id?: number | string;
  loan_number: string;
  applicant_name: string;
  applicant_phone?: string;
  applicant_email?: string;
  amount: number | string;
  payment_amount?: number | string;
  status: PaymentStatus;
  payment_purpose?: string;
  description?: string;
  created_at: string;
  released_at?: string;
  utr_number?: string;
  payment_proof_path?: string;
  kyc_documents?: string;
  created_by_name?: string;
  bank_name?: string;
  account_number?: string;
  ifsc_code?: string;
  branch_name?: string;
  payment_in_favour_name?: string;
  dm_approval?: boolean;
  vehicle_name?: string;
  vehicle_model?: string;
  vehicle_number?: string;
  vehicle_type?: string;
  rto_agent_name?: string;
  rto_mobile?: string;
  dto_location?: string;
  rto_work_type?: string;
  rc_status?: string;
  noc_status?: string;
  financier_name?: string;
  loan_amount?: number | string;
  disbursement_amount?: number | string;
  disbursement_date?: string;
  tenure_months?: number;
  emi_amount?: number | string;
  emi_mode?: string;
  irr_percentage?: number | string;
  loan_type?: string;
  file_booked_code?: string;
  foreclosure_amount?: number | string;
  foreclosure_name?: string;
  old_release_amount?: number | string;
  today_release_amount?: number | string;
  total_release_amount?: number | string;
  total_release_percentage?: number | string;
  hold_amount?: number | string;
  hold_percentage?: number | string;
  challan_amount?: number | string;
  disbursement_branch?: string;
  creator_role?: string;
  referred_by_name?: string;
  branch_manager_name?: string;
  noc_checked_by?: string;
  insurance_available?: boolean;
  third_party_stamp?: boolean;
  noc_stamp?: boolean;
  is_third_party?: boolean;
  voucher_number?: string;
  voucher_date?: string;
  payment_method?: string;
  reference_number?: string;
  prepared_by?: string;
  approved_by?: string;
  narration?: string;
  manager_remarks?: string;
  remarks?: string;
  banking_documents?: string | any[];
  ledger_entries?: any[];
  vouchers?: any[];
}

const PAYMENT_STATUSES: { value: PaymentStatus; label: string; color: string; icon: any }[] = [
  { value: 'draft', label: 'Draft', color: 'bg-gray-100 text-gray-800', icon: FileText },
  { value: 'submitted', label: 'Submitted', color: 'bg-blue-100 text-blue-800', icon: Calendar },
  { value: 'manager_approved', label: 'RBM Approved', color: 'bg-indigo-100 text-indigo-800', icon: CheckCircle },
  { value: 'manager_rejected', label: 'RBM Rejected', color: 'bg-red-100 text-red-800', icon: XCircle },
  { value: 'sent_back', label: 'Sent Back', color: 'bg-orange-100 text-orange-800', icon: ArrowLeft },
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
  const [releaseAmount, setReleaseAmount] = useState('');
  const [releaseNarration, setReleaseNarration] = useState('');

  // Ledger state
  const [ledgerEntries, setLedgerEntries] = useState<{ date: string; debit: string; credit: string; narration: string }[]>([]);
  const [ledgerSaved, setLedgerSaved] = useState(false);

  // Aadhaar Verification State
  const [verificationStep, setVerificationStep] = useState<'aadhaar' | 'otp' | 'utr'>('aadhaar');
  const [aadhaarNumber, setAadhaarNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [maskedPhone, setMaskedPhone] = useState('');

  // Fetch payment details
  const { data: payment, isLoading } = useQuery<PaymentApplication>({
    queryKey: ['payment', id],
    queryFn: async () => paymentApplicationAPI.getById(parseInt(id!)),
    enabled: !!id,
  });

  useEffect(() => {
    if (payment?.ledger_entries?.length) {
      setLedgerEntries(payment.ledger_entries);
    }
  }, [payment]);

  // Fetch banking documents attached to the application
  const { data: bankingDocuments = [] } = useQuery({
    queryKey: ['payment-banking-docs', id],
    queryFn: async () => {
      if (!payment?.banking_documents) return [];
      const docPaths = typeof payment.banking_documents === 'string'
        ? JSON.parse(payment.banking_documents)
        : payment.banking_documents;

      if (!Array.isArray(docPaths) || docPaths.length === 0) return [];

      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const baseUrl = apiUrl.replace(/\/api$/, '');

      return docPaths.map(path => ({
        url: path.startsWith('http') ? path : `${baseUrl}${path}`,
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
    mutationFn: async ({ utr, amount, narration }: { utr: string; amount: number; narration?: string }) => {
      const result = await paymentApplicationAPI.addUTR(parseInt(id!), utr, { amount, narration });
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment', id] });
      setShowUTRModal(false);
      setUtrNumber('');
      setReleaseAmount('');
      setReleaseNarration('');
      toast.success('UTR number added and payment released.');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to add UTR number');
    }
  });

  const saveLedger = useMutation({
    mutationFn: async (entries: any[]) => paymentApplicationAPI.saveLedger(parseInt(id!), entries),
    onSuccess: () => { setLedgerSaved(true); toast.success('Ledger saved'); },
    onError: (error: any) => toast.error(error.message || 'Failed to save ledger')
  });

  const addLedgerRow = () => setLedgerEntries(prev => [...prev, { date: '', debit: '', credit: '', narration: '' }]);
  const removeLedgerRow = (i: number) => setLedgerEntries(prev => prev.filter((_, idx) => idx !== i));
  const updateLedgerRow = (i: number, field: string, value: string) => {
    setLedgerSaved(false);
    setLedgerEntries(prev => prev.map((row, idx) => idx === i ? { ...row, [field]: value } : row));
  };

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
    const amt = parseFloat(releaseAmount);
    if (isNaN(amt) || amt <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    addUTRNumber.mutate({
      utr: utrNumber.trim(),
      amount: amt,
      narration: releaseNarration.trim()
    });
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

  const downloadLedgerPDF = () => {
    if (!payment) return;

    const doc = new jsPDF();
    const margin = 20;
    const pageWidth = doc.internal.pageSize.getWidth();
    let y = 25;

    // Helper: Right Align Text
    const rightAlign = (text: string, x: number, y: number) => {
      doc.text(text, x, y, { align: 'right' });
    };

    // --- Header ---
    try {
      doc.addImage(logo, 'PNG', margin, y - 6, 12, 12);
    } catch (e) {}

    doc.setFontSize(22);
    doc.setTextColor(15, 23, 42); // slate-900
    doc.setFont('helvetica', 'bold');
    doc.text('MEHAR FINANCE', margin + 15, y + 2);

    y += 8;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139); // slate-500
    doc.text('Premium Automotive Financing & Credit Services', margin, y);

    y += 15;
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.line(margin, y, pageWidth - margin, y);

    y += 12;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59); // slate-800
    doc.text('LOAN ACCOUNT LEDGER', margin, y);

    // --- Application Details Grid ---
    y += 12;
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105); // slate-600

    // Left Col
    doc.setFont('helvetica', 'bold'); doc.text('APPLICANT:', margin, y);
    doc.setFont('helvetica', 'normal'); doc.text(payment.applicant_name, margin + 25, y);
    y += 6;
    doc.setFont('helvetica', 'bold'); doc.text('VEHICLE:', margin, y);
    doc.setFont('helvetica', 'normal'); doc.text(`${payment.vehicle_name} ${payment.vehicle_model}`, margin + 25, y);

    // Right Col (Reset Y for right side)
    let ry = y - 6;
    doc.setFont('helvetica', 'bold'); doc.text('LOAN NUMBER:', 110, ry);
    doc.setFont('helvetica', 'normal'); doc.text(payment.loan_number, 140, ry);
    ry += 6;
    doc.setFont('helvetica', 'bold'); doc.text('REPORT DATE:', 110, ry);
    doc.setFont('helvetica', 'normal'); doc.text(new Date().toLocaleDateString('en-IN'), 140, ry);

    // --- Table Configuration ---
    y += 15;
    const tableTop = y;
    const colDates = margin + 5;
    const colCredit = margin + 55;
    const colDebit = margin + 95;
    const colNarr = margin + 105;
    const tableWidth = pageWidth - (margin * 2);

    // Table Header
    doc.setFillColor(30, 41, 59); // slate-800
    doc.rect(margin, y - 6, tableWidth, 10, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text('Date', colDates, y);
    rightAlign('Credit (INR)', colCredit, y);
    rightAlign('Debit (INR)', colDebit, y);
    doc.text('Narration', colNarr, y);

    y += 10;
    doc.setTextColor(30, 41, 59);
    doc.setFont('helvetica', 'normal');

    // Helper: Add Row with zebra striping
    let rowCount = 0;
    const addRow = (date: string, credit: string, debit: string, narr: string) => {
      if (rowCount % 2 === 0) {
        doc.setFillColor(248, 250, 252); // slate-50
        doc.rect(margin, y - 5, tableWidth, 8, 'F');
      }
      doc.text(date, colDates, y);
      rightAlign(credit, colCredit, y);
      rightAlign(debit, colDebit, y);

      // Handle narration wrapping if long
      const splitNarr = doc.splitTextToSize(narr, 70);
      doc.text(splitNarr, colNarr, y);

      const rowHeight = splitNarr.length > 1 ? 6 + (splitNarr.length - 1) * 4 : 8;
      y += rowHeight;
      rowCount++;

      if (y > 270) {
        doc.addPage();
        y = 30;
      }
    };

    // 1. Fixed Sanction Row
    doc.setFont('helvetica', 'bold');
    addRow(
      new Date(payment.disbursement_date || payment.created_at).toLocaleDateString('en-IN'),
      Number(payment.disbursement_amount).toLocaleString('en-IN'),
      '0',
      'Initial Loan Sanction (Net Disbursement)'
    );
    doc.setFont('helvetica', 'normal');

    // 2. Ledger Entries
    ledgerEntries.forEach((entry) => {
      addRow(
        entry.date ? new Date(entry.date).toLocaleDateString('en-IN') : '-',
        Number(entry.credit || 0).toLocaleString('en-IN'),
        Number(entry.debit || 0).toLocaleString('en-IN'),
        entry.narration || '-'
      );
    });

    // --- Footer / Summary ---
    y += 10;
    // Check if enough space for summary
    if (y > 240) { doc.addPage(); y = 30; }

    doc.setDrawColor(203, 213, 225); // slate-300
    doc.setLineWidth(0.5);
    doc.line(margin, y, pageWidth - margin, y);

    y += 12;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('SUMMARY OF ACCOUNT', margin, y);

    y += 10;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    const summaryX = 140;
    doc.text('Total Credit Amount:', margin, y);
    rightAlign(`${Number(payment.disbursement_amount).toLocaleString('en-IN')}`, summaryX, y);

    y += 7;
    doc.text('Total Payment Released:', margin, y);
    rightAlign(`${totalReleased.toLocaleString('en-IN')}`, summaryX, y);

    y += 10;
    doc.setFillColor(241, 245, 249); // slate-100
    doc.rect(margin, y - 5, 130, 10, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(79, 70, 229); // indigo-600
    doc.text('TOTAL REMAINING BALANCE:', margin + 5, y + 2);
    rightAlign(`${remainingLoanBalance.toLocaleString('en-IN')}`, summaryX, y + 2);

    // --- Page Bottom ---
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184); // slate-400
    doc.setFont('helvetica', 'italic');
    doc.text('This is a computer generated document and does not require a physical signature.', pageWidth / 2, 285, { align: 'center' });

    doc.save(`Mehar_Ledger_${payment.loan_number}.pdf`);
  };

  const statusConfig = PAYMENT_STATUSES.find(s => s.value === payment.status);

  const totalReleased = (payment.vouchers || []).reduce((sum, v) => sum + (Number(v.amount) || 0), 0);
  const targetAmount = Number(payment.today_release_amount || 0);
  const remainingAppBalance = Math.max(0, targetAmount - totalReleased);
  const totalLoanDisbursement = Number(payment.disbursement_amount || 0);
  const remainingLoanBalance = Math.max(0, totalLoanDisbursement - totalReleased);

  const canApprove = ['rbm', 'admin', 'super_admin'].includes(user?.role || '') && payment.status === 'submitted';
  const canProcess = (['accountant', 'admin', 'super_admin'].includes(user?.role || '')) && payment.status === 'manager_approved';
  const canAddUTR = (['accountant', 'admin', 'super_admin'].includes(user?.role || '')) &&
    (payment.status === 'voucher_created' || 
     (payment.status === 'payment_released' && remainingAppBalance > 0) ||
     (payment.status === 'completed' && remainingAppBalance > 0));
  const canEditLedger = (['accountant', 'admin', 'super_admin'].includes(user?.role || '')) &&
    ['voucher_created', 'manager_approved', 'payment_released', 'completed'].includes(payment.status);
  const canUploadProof = (['accountant', 'admin', 'super_admin'].includes(user?.role || '')) &&
    (payment.status === 'payment_released' || payment.status === 'completed');

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
      <div className="w-full px-4 pb-20 lg:pb-4">
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

          <div />
        </div>

        {/* Dual Layout */}
        <div className="flex flex-col lg:flex-row gap-6 mb-6">
          {/* Left: Main Details */}
          <div className="flex-1 min-w-0">
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
                        href={payment.payment_proof_path.startsWith('http')
                          ? payment.payment_proof_path
                          : `${(import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api$/, '')}${payment.payment_proof_path}`
                        }
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
                  {(payment.creator_role === 'broker' || payment.referred_by_name) ? (
                    <Field label="Referred By" value={payment.referred_by_name} />
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
            <div className="grid grid-cols-1 gap-6 mb-6">
              <Section title="Banking Proofs" icon={<FileText size={20} />}>
                {bankingDocuments.length > 0 ? (
                  <div className="grid grid-cols-1 gap-4">
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
                  <div className="grid grid-cols-1 gap-4">
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

              <Section title="Payment Proof" icon={<CreditCard size={20} />}>
                {payment.payment_proof_path ? (
                  <DocumentPreviewCard
                    doc={{
                      url: payment.payment_proof_path.startsWith('http')
                        ? payment.payment_proof_path
                        : `${(import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api$/, '')}${payment.payment_proof_path}`,
                      name: payment.payment_proof_path.split('/').pop() || 'Payment Proof',
                      type: 'Payment Release Proof'
                    }}
                    onView={previewDocument}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 border border-dashed border-border rounded-xl bg-muted/20">
                    <Camera size={24} className="text-muted-foreground/30 mb-2" />
                    <p className="text-sm text-muted-foreground italic">No payment proof uploaded yet</p>
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

            {/* Payment History (Vouchers) */}
            {(payment.vouchers && payment.vouchers.length > 0) && (
              <Section title="Payment History (Vouchers)" icon={<CreditCard size={20} />}>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-2 text-muted-foreground font-semibold">Date</th>
                        <th className="text-left py-2 text-muted-foreground font-semibold">UTR / Reference</th>
                        <th className="text-right py-2 text-muted-foreground font-semibold">Amount (₹)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payment.vouchers.map((v, i) => (
                        <tr key={i} className="border-b border-border/50">
                          <td className="py-2">{formatDisplayDate(v.voucher_date)}</td>
                          <td className="py-2">
                            <span className="font-mono font-bold text-accent">{v.reference_number}</span>
                            <p className="text-[10px] text-muted-foreground">{v.description}</p>
                          </td>
                          <td className="py-2 text-right font-mono font-bold">₹{Number(v.amount).toLocaleString()}</td>
                        </tr>
                      ))}
                      <tr className="bg-muted/30 font-bold">
                        <td className="py-2 pl-2" colSpan={2}>Total Released</td>
                        <td className="py-2 pr-2 text-right">₹{totalReleased.toLocaleString()}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </Section>
            )}
          </div>

          {/* Right: Sticky Action Panel */}
          <div className="w-full lg:w-[450px] shrink-0">
            <div className="sticky top-4 space-y-4">

              <div className="bg-card border border-border rounded-lg p-4">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Status & Balances</p>
                {statusConfig && (
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${statusConfig.color}`}>
                    {statusConfig.label}
                  </span>
                )}

                <div className="mt-4 space-y-3">
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Target Amount</p>
                    <p className="text-sm font-bold text-blue-700 dark:text-blue-400">₹{targetAmount.toLocaleString()}</p>
                  </div>

                  <div className="p-3 bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Total Released</p>
                    <p className="text-sm font-bold text-green-700 dark:text-green-400">₹{totalReleased.toLocaleString()}</p>
                  </div>

                  {remainingAppBalance > 0 && (
                    <div className="p-3 bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-800 rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1">Remaining Application Balance</p>
                      <p className="text-sm font-bold text-orange-700 dark:text-orange-400">₹{remainingAppBalance.toLocaleString()}</p>
                    </div>
                  )}

                  <div className="p-3 bg-purple-50 dark:bg-purple-900/10 border border-purple-200 dark:border-purple-800 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Overall Loan Balance</p>
                    <p className="text-sm font-bold text-purple-700 dark:text-purple-400">₹{remainingLoanBalance.toLocaleString()}</p>
                  </div>
                </div>

                {payment.status === 'completed' && (
                  <button
                    onClick={downloadLedgerPDF}
                    className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors text-sm font-bold shadow-md shadow-indigo-500/20"
                  >
                    <Download size={16} /> Download Ledger Report
                  </button>
                )}
              </div>

              {/* Ledger */}
              {(canEditLedger || (payment.ledger_entries?.length > 0)) && (
                <div className="bg-card border border-border rounded-lg p-4">
                  <p className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                    <FileText size={16} className="text-blue-500" /> Payment Ledger
                  </p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-1.5 pr-2 text-muted-foreground font-semibold">Date</th>
                          <th className="text-left py-1.5 pr-2 text-muted-foreground font-semibold">Credit (₹)</th>
                          <th className="text-left py-1.5 pr-2 text-muted-foreground font-semibold">Debit (₹)</th>
                          <th className="text-left py-1.5 text-muted-foreground font-semibold">Narration</th>
                          {canEditLedger && <th className="w-6" />}
                        </tr>
                      </thead>
                      <tbody>
                        {/* Fixed Sanction Credit Row */}
                        <tr className="bg-muted/30 border-b border-border font-medium">
                          <td className="py-2 pr-2">{formatDisplayDate(payment.disbursement_date || payment.created_at)}</td>
                          <td className="py-2 pr-2 text-green-600">₹{Number(payment.disbursement_amount || 0).toLocaleString()}</td>
                          <td className="py-2 pr-2 text-muted-foreground">-</td>
                          <td className="py-2 text-muted-foreground italic">Initial Sanction (Credit)</td>
                          {canEditLedger && <td />}
                        </tr>

                        {ledgerEntries.map((row, i) => (
                          <tr key={i} className="border-b border-border/50">
                            <td className="py-1 pr-2">
                              {canEditLedger
                                ? <input type="date" value={row.date} onChange={e => updateLedgerRow(i, 'date', e.target.value)}
                                  className="w-full px-1 py-0.5 border border-border rounded bg-background text-xs focus:outline-none focus:ring-1 focus:ring-accent" />
                                : <span>{row.date}</span>}
                            </td>
                            <td className="py-1 pr-2">
                              {canEditLedger
                                ? <input type="number" value={row.credit} onChange={e => updateLedgerRow(i, 'credit', e.target.value)}
                                  className="w-full px-1 py-0.5 border border-border rounded bg-background text-xs focus:outline-none focus:ring-1 focus:ring-accent" placeholder="0" />
                                : <span className="font-mono">{Number(row.credit || 0).toLocaleString()}</span>}
                            </td>
                            <td className="py-1 pr-2">
                              {canEditLedger
                                ? <input type="number" value={row.debit} onChange={e => updateLedgerRow(i, 'debit', e.target.value)}
                                  className="w-full px-1 py-0.5 border border-border rounded bg-background text-xs focus:outline-none focus:ring-1 focus:ring-accent" placeholder="0" />
                                : <span className="font-mono">{Number(row.debit || 0).toLocaleString()}</span>}
                            </td>
                            <td className="py-1">
                              {canEditLedger
                                ? <input type="text" value={row.narration} onChange={e => updateLedgerRow(i, 'narration', e.target.value)}
                                  className="w-full px-1 py-0.5 border border-border rounded bg-background text-xs focus:outline-none focus:ring-1 focus:ring-accent" placeholder="Narration" />
                                : <span>{row.narration}</span>}
                            </td>
                            {canEditLedger && (
                              <td className="py-1 pl-1">
                                <button type="button" onClick={() => removeLedgerRow(i)} className="text-red-400 hover:text-red-600">
                                  <XCircle size={14} />
                                </button>
                              </td>
                            )}
                          </tr>
                        ))}
                        {ledgerEntries.length > 0 && (
                          <>
                            <tr className="font-bold border-t border-border">
                              <td className="pt-2 text-muted-foreground">Ledger Sum</td>
                              <td className="pt-2 font-mono text-green-600">₹{ledgerEntries.reduce((s, r) => s + (Number(r.credit) || 0), 0).toLocaleString()}</td>
                              <td className="pt-2 font-mono text-red-600">₹{ledgerEntries.reduce((s, r) => s + (Number(r.debit) || 0), 0).toLocaleString()}</td>
                              <td />{canEditLedger && <td />}
                            </tr>
                            <tr className="font-bold text-accent">
                              <td className="pt-1 text-muted-foreground" colSpan={2}>Total Released Vouchers</td>
                              <td className="pt-1 font-mono text-right pr-2">₹{totalReleased.toLocaleString()}</td>
                              <td />{canEditLedger && <td />}
                            </tr>
                            <tr className="font-bold text-purple-600">
                              <td className="pt-1 text-muted-foreground" colSpan={2}>Remaining Loan Balance</td>
                              <td className="pt-1 font-mono text-right pr-2">₹{remainingLoanBalance.toLocaleString()}</td>
                              <td />{canEditLedger && <td />}
                            </tr>
                          </>
                        )}
                      </tbody>
                    </table>
                  </div>
                  {canEditLedger && (
                    <div className="flex gap-2 mt-3">
                      <button type="button" onClick={addLedgerRow}
                        className="flex-1 px-3 py-1.5 border border-dashed border-border rounded-lg text-xs text-muted-foreground hover:border-accent hover:text-accent transition-colors">
                        + Add Row
                      </button>
                      <button type="button" onClick={() => saveLedger.mutate(ledgerEntries)} disabled={saveLedger.isPending}
                        className="flex-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors">
                        {saveLedger.isPending ? 'Saving...' : ledgerSaved ? '✓ Saved' : 'Save Ledger'}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {canAddUTR && (
                <div className="bg-card border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <p className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                    <DollarSign size={16} className="text-green-600" /> Enter UTR Number
                  </p>
                  <form onSubmit={handleUTRSubmit} className="space-y-3">
                    <div>
                      <label className="text-[10px] font-bold text-muted-foreground uppercase mb-1 block">UTR / Transaction ID</label>
                      <input
                        type="text"
                        value={utrNumber}
                        onChange={(e) => setUtrNumber(e.target.value)}
                        placeholder="Enter UTR Number"
                        required
                        className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-muted-foreground uppercase mb-1 block">Release Amount (₹)</label>
                      <input
                        type="number"
                        value={releaseAmount}
                        onChange={(e) => setReleaseAmount(e.target.value)}
                        placeholder={`Max ₹${remainingAppBalance}`}
                        required
                        className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm font-bold text-green-600 focus:outline-none focus:ring-2 focus:ring-green-500/20"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-muted-foreground uppercase mb-1 block">Narration (Optional)</label>
                      <input
                        type="text"
                        value={releaseNarration}
                        onChange={(e) => setReleaseNarration(e.target.value)}
                        placeholder="e.g. Partial release for PDD"
                        className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={addUTRNumber.isPending || !utrNumber.trim() || !releaseAmount}
                      className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-semibold disabled:opacity-50"
                    >
                      {addUTRNumber.isPending ? 'Releasing...' : 'Confirm & Release Payment'}
                    </button>
                  </form>
                </div>
              )}

              {canUploadProof && (
                <div className="bg-card border border-purple-200 dark:border-purple-800 rounded-lg p-4">
                  <p className="text-sm font-semibold text-foreground mb-3">Upload Payment Proof</p>
                  <ProofUploader onFile={(f) => uploadProof.mutate(f)} isPending={uploadProof.isPending} />
                </div>
              )}

              {canApprove && (
                <div className="bg-card border border-border rounded-lg p-4 space-y-2">
                  <p className="text-sm font-semibold text-foreground mb-1">Manager Actions</p>
                  <button onClick={() => managerAction.mutate({ action: 'approve' })} disabled={managerAction.isPending}
                    className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-semibold disabled:opacity-50 transition-colors">
                    Approve
                  </button>
                  <button onClick={() => { const r = prompt('Rejection reason?'); if (r) managerAction.mutate({ action: 'reject', remarks: r }); }} disabled={managerAction.isPending}
                    className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-semibold disabled:opacity-50 transition-colors">
                    Reject
                  </button>
                  <button onClick={() => { const r = prompt('Send back reason?'); if (r) managerAction.mutate({ action: 'send_back', remarks: r }); }} disabled={managerAction.isPending}
                    className="w-full px-4 py-2 border border-orange-500 text-orange-600 rounded-lg hover:bg-orange-50 text-sm font-semibold disabled:opacity-50 transition-colors">
                    Send Back
                  </button>
                </div>
              )}

              {canProcess && (
                <button onClick={() => navigate(`/account/vouchers/create/${id}`)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-semibold transition-colors">
                  <FileText size={16} /> Generate Voucher
                </button>
              )}

            </div>
          </div>
        </div>
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

function ProofUploader({ onFile, isPending }: { onFile: (f: File) => void; isPending: boolean }) {
  const [preview, setPreview] = useState<{ name: string; url: string; type: string } | null>(null);
  const [dragging, setDragging] = useState(false);

  const handle = (file: File | null | undefined) => {
    if (!file) return;
    if (!file.type.match(/image\/(jpeg|jpg|png|webp)|application\/pdf/)) return;
    setPreview({ name: file.name, url: URL.createObjectURL(file), type: file.type });
  };

  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const item = Array.from(e.clipboardData?.items || []).find(i => i.type.startsWith('image/'));
      if (item) handle(item.getAsFile());
    };
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  }, []);

  return (
    <div className="space-y-3">
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); handle(e.dataTransfer.files[0]); }}
        className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors ${dragging ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20' : 'border-purple-300 dark:border-purple-700 hover:border-purple-500'
          }`}
      >
        <input type="file" id="proof-sidebar" className="hidden"
          accept="image/jpeg,image/jpg,image/png,image/webp,application/pdf"
          onChange={(e) => handle(e.target.files?.[0])} />
        <label htmlFor="proof-sidebar" className="cursor-pointer block">
          <Download size={20} className="mx-auto mb-1 text-purple-400" />
          <p className="text-xs text-purple-600 font-medium">Click, drag & drop, or paste</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">JPG · PNG · WEBP · PDF</p>
        </label>
      </div>

      {preview && (
        <div className="border border-border rounded-lg p-3 space-y-2">
          {preview.type === 'application/pdf' ? (
            <div className="flex items-center gap-2 text-sm">
              <FileText size={16} className="text-red-500" />
              <span className="truncate text-foreground text-xs">{preview.name}</span>
            </div>
          ) : (
            <img src={preview.url} alt="preview" className="w-full max-h-40 object-contain rounded border border-border" />
          )}
          <div className="flex gap-2">
            <button type="button" onClick={() => setPreview(null)}
              className="flex-1 px-3 py-1.5 border border-border rounded text-xs text-muted-foreground hover:bg-muted transition-colors">
              Remove
            </button>
            <button type="button" disabled={isPending}
              onClick={() => {
                fetch(preview.url).then(r => r.blob()).then(blob => {
                  onFile(new File([blob], preview.name || 'proof', { type: blob.type }));
                });
              }}
              className="flex-1 px-3 py-1.5 bg-purple-600 text-white rounded text-xs font-semibold hover:bg-purple-700 disabled:opacity-50 transition-colors">
              {isPending ? 'Uploading...' : 'Upload'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
