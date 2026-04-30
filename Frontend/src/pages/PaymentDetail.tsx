import { useState, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import logo from '../assets/logo.png';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';
import { paymentApplicationAPI } from '@/lib/api';
import { ArrowLeft, FileText, CreditCard, Building2, User, Calendar, CheckCircle, XCircle, Eye, Edit, DollarSign, Download, Info, Camera, IndianRupee } from 'lucide-react';
import DocumentPreviewCard from '@/components/DocumentPreviewCard';

const safeParseNumber = (val: any): number => {
  if (typeof val === 'number') return val;
  if (!val) return 0;
  const cleaned = String(val).replace(/[₹, \s]/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
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
  received_amount?: number | string;
  disbursement_date?: string;
  tenure_months?: number;
  emi_amount?: number | string;
  emi_mode?: string;
  irr_percentage?: number | string;
  loan_type?: string;
  mehar_deduction?: number | string;
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
  all_loan_ledger_entries?: any[];
  vouchers?: any[];
  payment_history?: any[];
  purpose_loan_amount?: number | string;
  sanction_amount?: number | string;
  net_seed_amount?: number | string;
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
  const [uploadingProof, setUploadingProof] = useState(false);
  const [releaseAmount, setReleaseAmount] = useState('');
  const [releaseNarration, setReleaseNarration] = useState('');

  // Ledger state: editable rows = current app only; display rows = all apps for this loan
  const [ledgerEntries, setLedgerEntries] = useState<{ date: string; debit: string; credit: string; narration: string; isNew?: boolean }[]>([]);
  const [allLoanLedgerEntries, setAllLoanLedgerEntries] = useState<any[]>([]);
  const [ledgerSaved, setLedgerSaved] = useState(false);
  const [savedLedgerCount, setSavedLedgerCount] = useState(0);
  const [pendingRemark, setPendingRemark] = useState('');

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
    let entries = payment?.ledger_entries || [];
    const hasInitialCredit = entries.some((e: any) => 
      e.narration?.includes('Initial Sanction') || 
      e.narration?.includes('Received Amount')
    );

    const creditAmount = payment?.received_amount || payment?.disbursement_amount || payment?.loan_amount || 0;

    if (!hasInitialCredit && creditAmount) {
      const initialEntry = {
        date: payment?.created_at ? new Date(payment.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        credit: String(creditAmount),
        debit: '0',
        narration: 'Initial Sanction (Received Amount)',
        isNew: true
      };
      entries = [initialEntry, ...entries];
    }

    const hasMeharPF = entries.some((e: any) => 
      e.narration?.includes('Mehar PF') || 
      e.narration?.includes('Processing Fee')
    );

    if (!hasMeharPF && payment?.mehar_deduction && Number(payment.mehar_deduction) > 0) {
      const pfEntry = {
        date: payment?.created_at ? new Date(payment.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        credit: '0',
        debit: String(payment.mehar_deduction),
        narration: 'Mehar PF (Processing Fee)',
        isNew: true
      };
      entries = [...entries, pfEntry];
    }

    if (entries.length) {
      setLedgerEntries(entries);
      setSavedLedgerCount(entries.length);
    }

    // Show all ledger entries for the loan
    let allEntries = payment?.all_loan_ledger_entries || [];
    const hasInitialCreditAll = allEntries.some((e: any) => 
      e.narration?.includes('Initial Sanction') || 
      e.narration?.includes('Received Amount')
    );

    if (!hasInitialCreditAll && creditAmount) {
      const initialEntry = {
        date: payment?.created_at ? new Date(payment.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        credit: String(creditAmount),
        debit: '0',
        narration: 'Initial Sanction (Received Amount)',
        isNew: true
      };
      allEntries = [initialEntry, ...allEntries];
    }

    const hasMeharPFAll = allEntries.some((e: any) => 
      e.narration?.includes('Mehar PF') || 
      e.narration?.includes('Processing Fee')
    );

    if (!hasMeharPFAll && payment?.mehar_deduction && Number(payment.mehar_deduction) > 0) {
      const pfEntry = {
        date: payment?.created_at ? new Date(payment.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        credit: '0',
        debit: String(payment.mehar_deduction),
        narration: 'Mehar PF (Processing Fee)',
        isNew: true
      };
      allEntries = [...allEntries, pfEntry];
    }

    if (allEntries.length) {
      setAllLoanLedgerEntries(allEntries);
    } else if (entries.length) {
      setAllLoanLedgerEntries(entries);
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

  // Sync pendingRemark when payment data loads
  useEffect(() => {
    if (payment?.manager_remarks || payment?.remarks) {
      setPendingRemark(payment.manager_remarks || payment.remarks || '');
    }
  }, [payment?.manager_remarks, payment?.remarks]);

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

  const updateRemarksMutation = useMutation({
    mutationFn: (remarks: string) =>
      paymentApplicationAPI.updateRemarks(Number(id), remarks),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment', id] });
      toast.success('Remarks updated');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update remarks');
    }
  });

  // Add UTR number
  const addUTRNumber = useMutation({
    mutationFn: async ({ utr, amount, narration, voucher_date }: { utr: string; amount: number; narration?: string; voucher_date?: string }) => {
      const result = await paymentApplicationAPI.addUTR(parseInt(id!), utr, { amount, narration, voucher_date });
      return result;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['payment-application', id] });
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

  const addLedgerRow = () => setLedgerEntries(prev => [...prev, { date: '', debit: '', credit: '', narration: '', isNew: true }]);
  const removeLedgerRow = (i: number) => setLedgerEntries(prev => prev.filter((_, idx) => idx !== i));
  const updateLedgerRow = (i: number, field: string, value: string) => {
    setLedgerSaved(false);
    setLedgerEntries(prev => prev.map((row, idx) => idx === i ? { ...row, [field]: value } : row));
  };

  const deleteVoucher = useMutation({
    mutationFn: async (voucherId: number) => {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/payments/vouchers/${voucherId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete voucher');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment', id] });
      toast.success('Voucher deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete voucher');
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

  const handleUTRSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!utrNumber.trim()) {
      toast.error('Please enter UTR number');
      return;
    }
    const amt = releaseAmount ? parseFloat(releaseAmount) : remainingAppBalance;
    if (isNaN(amt) || amt < 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    addUTRNumber.mutate({
      utr: utrNumber.trim(),
      amount: amt,
      narration: releaseNarration.trim(),
      voucher_date: paymentDate
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
    rightAlign(`${ledgerCreditTotalSum.toLocaleString('en-IN')}`, summaryX, y);

    y += 7;
    doc.text('Total Debit Amount:', margin, y);
    rightAlign(`${ledgerDebitTotalSum.toLocaleString('en-IN')}`, summaryX, y);

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

  const totalDisb = Number(payment.disbursement_amount) || 1;
  const oldRel = Number(payment.old_release_amount || payment.total_release_amount) || 0;
  const releasePct = (oldRel / totalDisb) * 100;
  
  const currentStatus = (payment.status === 'completed' && releasePct < 99) ? 'payment_released' : payment.status;
  const statusConfig = PAYMENT_STATUSES.find(s => s.value === currentStatus);

  const totalReleased = (payment.vouchers || []).reduce((sum, v) => sum + (Number(v.amount) || 0), 0);
  const targetAmount = Number(payment.today_release_amount || 0);
  const remainingAppBalance = Math.max(0, targetAmount - totalReleased);
  const totalLoanDisbursement = Number(payment.disbursement_amount || 0);
  // Derived ledger totals — use merged all-loan ledger for display/PDF
  const displayLedger = (allLoanLedgerEntries || []).length > 0 ? allLoanLedgerEntries : ledgerEntries;
  const ledgerDebitTotalSum = displayLedger.reduce((sum, r) => sum + safeParseNumber(r.debit), 0);
  const ledgerCreditTotalSum = displayLedger.reduce((sum, r) => sum + safeParseNumber(r.credit), 0);
  
  const ledgerDebitTotal = ledgerDebitTotalSum;
  const remainingLoanBalance = ledgerCreditTotalSum - ledgerDebitTotalSum;

  const canApprove = ['rbm', 'admin', 'super_admin'].includes(user?.role || '') && payment.status === 'submitted';
  const canAddUTR = (['accountant', 'admin', 'super_admin'].includes(user?.role || '')) &&
    (payment.status === 'manager_approved' ||
     payment.status === 'voucher_created' || 
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
                    <Field label="RBM Approval Status" value={payment.status === 'manager_rejected' ? 'REJECTED' : ['manager_approved', 'voucher_created', 'payment_released', 'completed'].includes(payment.status) ? 'APPROVED' : 'PENDING'} />
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
                      <DocumentPreviewCard
                        doc={{
                          url: payment.payment_proof_path.startsWith('http')
                            ? payment.payment_proof_path
                            : `${(import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api$/, '')}${payment.payment_proof_path}`,
                          name: payment.payment_proof_path.split('/').pop() || 'Payment Proof',
                          type: 'Payment Release Proof'
                        }}
                        isAdmin={['admin', 'super_admin', 'manager'].includes(user?.role || '')}
                      />
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

              {/* Financial & Payout Summary - NEW LAYOUT */}
              <div className="lg:col-span-2">
                <Section title="Financial & Payout Summary" icon={<IndianRupee size={20} />}>
                  <div className="p-5 rounded-2xl bg-[#f8fcfc] dark:bg-slate-900/50 border border-[#e0f2f2] dark:border-slate-800 shadow-sm">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
                      <Field label="1. Purposed Amount" value={formatCurrency(Number(payment.purpose_loan_amount || payment.loan_amount || 0))} />
                      <Field label="2. Total Amount (EMI)" value={formatCurrency(Number(payment.sanction_amount || payment.loan_amount || 0))} className="text-emerald-500 font-black" />
                      <Field label="3. Actual Amount (Payout)" value={formatCurrency(Number(payment.loan_amount || 0))} />
                      <Field label="4. Received (Bank)" value={formatCurrency(Number(payment.received_amount || payment.net_seed_amount || 0))} />
                      <Field label="5. Mehar PF (₹)" value={formatCurrency(Number(payment.mehar_deduction || 0))} />
                      <Field label="6. Net Amount (After PF)" value={formatCurrency(Number(payment.disbursement_amount || 0))} className="text-emerald-500 font-black" />
                    </div>
                  </div>
                  
                  {/* Supplementary Details */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-6 px-2">
                    <Field label="Financier" value={payment.financier_name || '—'} />
                    <Field label="Disbursement Date" value={formatDisplayDate(payment.disbursement_date)} />
                    <Field label="Tenure" value={`${payment.tenure_months || 0} Months`} />
                    <Field label="EMI Amount" value={formatCurrency(Number(payment.emi_amount || 0))} />
                    <Field label="IRR (%)" value={`${payment.irr_percentage || 0}%`} />
                    <Field label="EMI Mode" value={payment.emi_mode || '—'} />
                    <Field label="Loan Type" value={payment.loan_type} />
                    <Field label="File Booked Code" value={payment.file_booked_code || '—'} />
                    <div className="md:col-span-2">
                      <Field label="Purpose/Description" value={payment.payment_purpose || payment.description} />
                    </div>
                  </div>
                </Section>
              </div>

              {/* Payment Release Breakdown */}
              <Section title="Payment Release Breakdown" icon={<CreditCard size={20} />}>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Foreclosure Amount" value={formatCurrency(Number(payment.foreclosure_amount || 0))} />
                  <Field label="Foreclosure Name" value={payment.foreclosure_name} />
                  <Field label="Old Release Amount" value={formatCurrency(Number(payment.old_release_amount || 0))} />
                  <Field label="Today Release Amount" value={formatCurrency(Number(payment.today_release_amount || 0))} />
                  <Field label="Total Release Amount" value={formatCurrency(Number(payment.total_release_amount || 0))} />
                  <Field label="Total Release (%)" value={`${payment.total_release_percentage || 0}%`} />
                   <Field label="Hold Amount" value={formatCurrency(Number(payment.hold_amount || 0))} />
                   <Field label="Hold Percentage" value={`${payment.hold_percentage || 0}%`} />
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {bankingDocuments.map((doc, idx) => (
                      <DocumentPreviewCard
                        key={idx}
                        doc={doc}
                        isAdmin={['admin', 'super_admin', 'manager'].includes(user?.role || '')}
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
                        isAdmin={['admin', 'super_admin', 'manager'].includes(user?.role || '')}
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
                    isAdmin={['admin', 'super_admin', 'manager'].includes(user?.role || '')}
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

            {/* All Loan Payment Operations — only when UTR-confirmed entries exist */}
            {(payment.payment_history && payment.payment_history.length > 0) && (
              <Section title="Payment Release History (UTR Confirmed)" icon={<FileText size={20} className="text-blue-500" />}>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-left">
                        <th className="py-2 text-muted-foreground font-semibold">ID / Date</th>
                        <th className="py-2 text-muted-foreground font-semibold">Status</th>
                        <th className="py-2 text-muted-foreground font-semibold">Voucher / UTR</th>
                        <th className="py-2 text-right text-muted-foreground font-semibold">Amount (₹)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payment.payment_history.map((ph, idx) => (
                        <tr key={idx} className={`border-b border-border/50 text-left ${ph.id === Number(id) ? 'bg-blue-50/50 dark:bg-blue-900/10 font-bold' : ''}`}>
                          <td className="py-2">
                            <span className="font-mono text-xs">#PAY-{ph.id}</span>
                            <p className="text-[10px] text-muted-foreground">{formatDisplayDate(ph.released_at || ph.created_at)}</p>
                          </td>
                          <td className="py-2">
                            <span className="inline-block px-2 py-0.5 text-[10px] font-bold uppercase rounded-full bg-green-100 text-green-800">
                              Released
                            </span>
                          </td>
                          <td className="py-2">
                            {ph.utr_number ? (
                              <div className="text-xs">
                                <span className="font-mono font-semibold text-green-700 dark:text-green-400">{ph.utr_number}</span>
                                {ph.voucher_number && <p className="text-[10px] text-muted-foreground">Voucher: {ph.voucher_number}</p>}
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground italic">—</span>
                            )}
                          </td>
                          <td className="py-2 text-right font-mono font-bold text-blue-600 dark:text-blue-400">₹{Number(ph.voucher_amount || ph.payment_amount).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
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
                            <div className="flex justify-between items-start gap-2">
                              <div>
                                <span className="font-mono font-bold text-accent">{v.reference_number}</span>
                                <p className="text-[10px] text-muted-foreground">{v.description}</p>
                              </div>
                              {canEditLedger && (
                                <button 
                                  onClick={() => { if(confirm('Delete this UTR/Voucher?')) deleteVoucher.mutate(v.id); }}
                                  className="text-muted-foreground hover:text-red-500 transition-colors p-1"
                                  title="Delete Voucher"
                                >
                                  <XCircle size={14} />
                                </button>
                              )}
                            </div>
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
              {(canEditLedger || (displayLedger.length > 0)) && (
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


                        {/* Display merged all-loan ledger entries (read-only for old entries) */}
                        {displayLedger.map((row, i) => {
                          const isFromCurrentApp = !row.application_id || row.application_id === Number(id);
                          const ledgerIdx = displayLedger
                            .slice(0, i + 1)
                            .filter(entry => !entry.application_id || entry.application_id === Number(id))
                            .length - 1;
                          
                          return (
                            <tr key={i} className="border-b border-border/50">
                              <td className="py-1 pr-2">
                                {isFromCurrentApp && canEditLedger
                                  ? <input type="date" value={row.date} onChange={e => updateLedgerRow(ledgerIdx, 'date', e.target.value)}
                                    className="w-full px-1 py-0.5 border border-border rounded bg-background text-xs focus:outline-none focus:ring-1 focus:ring-accent" />
                                  : <span className="text-xs">{row.date}</span>}
                              </td>
                              <td className="py-1 pr-2">
                                {isFromCurrentApp && canEditLedger && !row.narration?.includes('Initial Sanction') && !row.narration?.includes('Mehar PF')
                                  ? <input type="number" value={row.credit} onChange={e => updateLedgerRow(ledgerIdx, 'credit', e.target.value)}
                                    className="w-full px-1 py-0.5 border border-border rounded bg-background text-xs focus:outline-none focus:ring-1 focus:ring-accent" placeholder="0" />
                                  : <span className="font-mono text-xs">{Number(row.credit || 0).toLocaleString()}</span>}
                              </td>
                              <td className="py-1 pr-2">
                                {isFromCurrentApp && canEditLedger && !row.narration?.includes('Initial Sanction') && !row.narration?.includes('Mehar PF')
                                  ? <input type="number" value={row.debit} onChange={e => updateLedgerRow(ledgerIdx, 'debit', e.target.value)}
                                    className="w-full px-1 py-0.5 border border-border rounded bg-background text-xs focus:outline-none focus:ring-1 focus:ring-accent" placeholder="0" />
                                  : <span className="font-mono text-xs">{Number(row.debit || 0).toLocaleString()}</span>}
                              </td>
                              <td className="py-1">
                                {isFromCurrentApp && canEditLedger && !row.narration?.includes('Initial Sanction') && !row.narration?.includes('Mehar PF')
                                  ? <input type="text" value={row.narration} onChange={e => updateLedgerRow(ledgerIdx, 'narration', e.target.value)}
                                    className="w-full px-1 py-0.5 border border-border rounded bg-background text-xs focus:outline-none focus:ring-1 focus:ring-accent" placeholder="Narration" />
                                  : <span className="text-xs">{row.narration}</span>}
                              </td>
                              {canEditLedger && (
                                <td className="py-1 pl-1">
                                  {isFromCurrentApp && !row.narration?.includes('Initial Sanction') && !row.narration?.includes('Mehar PF') && (
                                    <button type="button" onClick={() => removeLedgerRow(ledgerIdx)} className="text-red-400 hover:text-red-600" title="Remove row">
                                      <XCircle size={14} />
                                    </button>
                                  )}
                                </td>
                              )}
                            </tr>
                          );
                        })}
                        {displayLedger.length > 0 && (
                          <>
                            <tr className="font-bold border-t border-border">
                              <td className="pt-2 text-muted-foreground">Ledger Sum</td>
                              <td className="pt-2 font-mono text-green-600">₹{displayLedger.reduce((s, r) => s + safeParseNumber(r.credit), 0).toLocaleString()}</td>
                              <td className="pt-2 font-mono text-red-600">₹{displayLedger.reduce((s, r) => s + safeParseNumber(r.debit), 0).toLocaleString()}</td>
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
                    <DollarSign size={16} className="text-green-600" /> Release Payment
                  </p>
                  {payment.status === 'manager_approved' && (
                    <div className="mb-3 rounded-lg border border-blue-200 bg-blue-50 p-3 text-xs text-blue-800 dark:border-blue-900/40 dark:bg-blue-900/10 dark:text-blue-200">
                      Enter the UTR here. The voucher will be created automatically for this file.
                    </div>
                  )}
                  <form onSubmit={handleUTRSubmit} className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
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
                        <label className="text-[10px] font-bold text-muted-foreground uppercase mb-1 block">Payment Date</label>
                        <input
                          type="date"
                          value={paymentDate}
                          onChange={(e) => setPaymentDate(e.target.value)}
                          required
                          className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-muted-foreground uppercase mb-1 block">Release Amount (₹) (Optional)</label>
                      <input
                        type="number"
                        value={releaseAmount}
                        onChange={(e) => setReleaseAmount(e.target.value)}
                        placeholder={`Default: ${remainingAppBalance.toLocaleString()}`}
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
                      disabled={addUTRNumber.isPending || !utrNumber.trim()}
                      className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-semibold disabled:opacity-50"
                    >
                      {addUTRNumber.isPending ? 'Releasing...' : 'Create Voucher & Release'}
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
                <div className="bg-card border border-border rounded-lg p-4 space-y-3">
                  <p className="text-sm font-semibold text-foreground mb-1">Manager Actions</p>
                  
                  <div>
                    <label className="text-[10px] font-bold text-muted-foreground uppercase mb-1 block">Manager Remarks / Notes</label>
                    <textarea
                      value={pendingRemark}
                      onChange={(e) => setPendingRemark(e.target.value)}
                      placeholder="Add internal notes or reasons for approval/rejection..."
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm min-h-[80px] focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                    <button 
                      onClick={() => updateRemarksMutation.mutate(pendingRemark)} 
                      disabled={updateRemarksMutation.isPending || pendingRemark === (payment.remarks || '')}
                      className="mt-2 w-full px-3 py-1.5 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 text-xs font-semibold disabled:opacity-50 transition-colors"
                    >
                      {updateRemarksMutation.isPending ? 'Saving...' : 'Save Note Only'}
                    </button>
                  </div>

                  <div className="pt-2 flex flex-col gap-2">
                    <button onClick={() => managerAction.mutate({ action: 'approve', remarks: pendingRemark })} disabled={managerAction.isPending}
                      className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-semibold disabled:opacity-50 transition-colors">
                      Approve with Remark
                    </button>
                    <div className="grid grid-cols-2 gap-2">
                      <button onClick={() => { if (!pendingRemark.trim()) return toast.error('Please add a reason in remarks'); managerAction.mutate({ action: 'reject', remarks: pendingRemark }); }} disabled={managerAction.isPending}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-semibold disabled:opacity-50 transition-colors">
                        Reject
                      </button>
                      <button onClick={() => { if (!pendingRemark.trim()) return toast.error('Please add a reason in remarks'); managerAction.mutate({ action: 'send_back', remarks: pendingRemark }); }} disabled={managerAction.isPending}
                        className="px-4 py-2 border border-orange-500 text-orange-600 rounded-lg hover:bg-orange-50 text-sm font-semibold disabled:opacity-50 transition-colors">
                        Send Back
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {((user?.role === 'employee' || user?.role === 'manager' || user?.role === 'super_admin') && 
                (payment.status === 'draft' || payment.status === 'sent_back') || user?.role === 'super_admin') && (
                <div className="bg-card border border-amber-200 dark:border-amber-900 rounded-lg p-4 space-y-2">
                  <p className="text-sm font-semibold text-foreground mb-1">Application Actions</p>
                  <button onClick={() => navigate(`/payments/edit/${id}`)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 text-sm font-semibold transition-colors">
                    <Edit size={16} /> Edit & Submit
                  </button>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>


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
