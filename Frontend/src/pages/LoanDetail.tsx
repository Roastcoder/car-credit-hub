import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { loansAPI, externalAPI } from '@/lib/api';
import { LOAN_STATUSES, WORKFLOW_STEPS } from '@/lib/constants';
import { formatCurrency, cn } from '@/lib/utils';
import { WorkflowService } from '@/lib/workflow';
import { getRolePermissions } from '@/lib/permissions';
import { RemarksModal } from '@/components/RemarksModal';
import { WorkflowActions } from '@/components/WorkflowActions';
import WorkflowStatus from '@/components/WorkflowStatus';
import RoleInfo, { WorkflowStepsInfo } from '@/components/RoleInfo';
import LoanStatusBadge from '@/components/LoanStatusBadge';
import PDDStatusBadge from '@/components/PDDStatusBadge';
import { CreditScoreGauge } from '@/components/CreditScoreGauge';
import { getFileUrl } from '@/lib/utils';
import { ArrowLeft, ArrowRight, ChevronLeft, ChevronRight, User, Car, IndianRupee, Building2, FileText, Eye, X, Printer, MessageCircle, Mail, Download, ExternalLink, MessageSquare, MapPin, Clock, CreditCard, Trash2, Camera, Upload, CheckCircle2, ShieldCheck, Edit2 } from 'lucide-react';
import { exportLoanPDF, shareLoanPDF, downloadLoanPDF } from '@/lib/pdf-export';
import { toast } from 'sonner';
import { calculateCommission } from '@/lib/schemes';
import DocumentPreviewCard from '@/components/DocumentPreviewCard';
import PDDForm from '@/components/PDDForm';
import {
  ClipboardCheck,
  CheckCircle,
  XSquare,
  MessageCircleOff
} from 'lucide-react';




const DOC_TYPES = [
  { value: 'dm', label: 'DM' },
  { value: 'rc_copy', label: 'RC Copy' },
  { value: 'insurance', label: 'Insurance' },
  { value: 'income_proof', label: 'Income Proof' },
  { value: 'bank_statement', label: 'Bank Statement' },
  { value: 'nach', label: 'NACH' },
  { value: 'other', label: 'Other' },
];

export default function LoanDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const permissions = getRolePermissions(user?.role || 'employee');

  const [remarksModal, setRemarksModal] = useState<{ open: boolean; currentRemarks: string }>({ open: false, currentRemarks: '' });


  const { data: loans = [] } = useQuery({
    queryKey: ['loans', user?.id, user?.role],
    queryFn: async () => {
      const response = await loansAPI.getAll();
      return Array.isArray(response.data) ? response.data : [];
    },
    enabled: !!user,
  });

  const { data: banks = [] } = useQuery({
    queryKey: ['banks-list'],
    queryFn: async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/banks`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
        });
        if (!response.ok) return [];
        const data = await response.json();
        return Array.isArray(data) ? data : (data.data || []);
      } catch {
        return [];
      }
    },
  });

  const { data: loan, isLoading } = useQuery({
    queryKey: ['loan', id],
    queryFn: async () => {
      const response = await loansAPI.getById(id as any); // Don't convert to Number, keep as string
      const loanData = response.data || response;
      return loanData;
    },
    enabled: !!id,
  });

  const { data: documents = [], refetch: refetchDocs } = useQuery({
    queryKey: ['loan-documents', id],
    queryFn: async () => {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/loans/${id}/documents`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` },
      });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!id,
  });

  const { data: commissionRecord } = useQuery({
    queryKey: ['loan-commission', loan?.id],
    queryFn: async () => {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/commissions`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` },
      });
      if (!res.ok) return null;
      const data = await res.json();
      const commissionsObj = Array.isArray(data) ? data : (data.data || []);
      const match = commissionsObj.find((c: any) => String(c.loan_id) === String(loan.id));
      return match || null;
    },
    enabled: !!loan?.id,
  });

  const { data: auditLogs = [] } = useQuery({
    queryKey: ['loan-audit-logs', id],
    queryFn: async () => {
      const response = await loansAPI.getAuditLogs(id!);
      return response.data || [];
    },
    enabled: !!id,
  });

  const { data: vehicleCache } = useQuery({
    queryKey: ['vehicle-cache', loan?.vehicle_number],
    queryFn: async () => {
      if (!loan?.vehicle_number) return null;
      const res = await externalAPI.getVehicleCache(loan.vehicle_number);
      return res.data || res;
    },
    enabled: !!loan?.vehicle_number,
  });

  const { data: creditReports = [] } = useQuery({
    queryKey: ['loan-credit-reports', id],
    queryFn: async () => {
      // Use the specific endpoint /api/credit-reports/loan/:loanId
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/credit-reports/loan/${id}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` },
      });
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data) ? data : (data.data || []);
    },
    enabled: !!id && user?.role === 'super_admin',
  });

  const { refetch: refetchCredit } = useQuery({
    queryKey: ['loan-credit-reports', id],
    enabled: false // just to get handle to refetch
  });

  const computedCommission = useMemo(() => {
    if (!loan || !banks.length) return { rate: 0, amount: 0 };
    const financierName = (banks as any[]).find((b: any) => String(b.id) === String(loan.assigned_bank_id))?.name || '';
    const verticalToUse = loan.financier_team_vertical || loan.vertical;
    return calculateCommission(financierName, verticalToUse, Number(loan.loan_amount) || 0, Number(loan.tenure) || 0);
  }, [loan, banks]);

  const updateStatus = useMutation({
    mutationFn: async (newStatus: string) => {
      // Use the same approach as Loans page - via loansAPI.update
      await loansAPI.update(id as any, { status: newStatus });
      return { message: 'Status updated successfully' };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loan', id] });
      queryClient.invalidateQueries({ queryKey: ['loans'] });
      queryClient.invalidateQueries({ queryKey: ['loans-dashboard'] });
      toast.success('Status updated');
      // Navigate back after a short delay
      setTimeout(() => navigate('/loans'), 500);
    },
    onError: () => toast.error('Failed to update status'),
  });

  const deleteLoan = useMutation({
    mutationFn: async () => {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/loans/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` },
      });
      if (!res.ok) throw new Error('Failed to delete loan');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loans'] });
      queryClient.invalidateQueries({ queryKey: ['loans-dashboard'] });
      toast.success('Loan application deleted');
      navigate('/loans');
    },
    onError: () => toast.error('Failed to delete loan'),
  });

  const deleteDocument = useMutation({
    mutationFn: async (docId: string) => {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/loans/${id}/documents/${docId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` },
      });
      if (!res.ok) throw new Error('Failed to delete document');
      return res.json();
    },
    onSuccess: () => {
      refetchDocs();
      toast.success('Document deleted successfully');
    },
    onError: () => toast.error('Failed to delete document'),
  });

  const uploadDocument = useMutation({
    mutationFn: async ({ file, documentType }: { file: File, documentType: string }) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('document_type', documentType);

      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/loans/${id}/documents`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` },
        body: formData,
      });
      if (!res.ok) throw new Error('Failed to upload document');
      return res.json();
    },
    onSuccess: () => {
      refetchDocs();
      toast.success('Document uploaded successfully');
    },
    onError: () => toast.error('Failed to upload document'),
  });


  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDeleteDocModal, setShowDeleteDocModal] = useState(false);
  const [isEditingPDD, setIsEditingPDD] = useState(false);
  const [docToDelete, setDocToDelete] = useState<any>(null);
  const [uploadingDocId, setUploadingDocId] = useState<string | null>(null);
  const [pddReason, setPddReason] = useState('');

  const isPddManager = user?.role === 'pdd_manager';
  const canEditPDD = ['employee', 'manager', 'pdd_manager', 'admin', 'super_admin'].includes(user?.role || '');

  const handleDelete = () => {
    deleteLoan.mutate();
    setShowDeleteModal(false);
  };

  const handleDeleteDoc = (doc: any) => {
    setDocToDelete(doc);
    setShowDeleteDocModal(true);
  };

  const confirmDeleteDoc = () => {
    if (docToDelete) {
      deleteDocument.mutate(docToDelete.id);
    }
    setShowDeleteDocModal(false);
    setDocToDelete(null);
  };

  const handleReuploadDoc = async (e: React.ChangeEvent<HTMLInputElement>, docId: string, docType: string) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];

    // Set loading
    setUploadingDocId(docId);

    try {
      // 1. First delete the existing document
      await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/loans/${id}/documents/${docId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` },
      });

      // 2. Upload the new document
      await uploadDocument.mutateAsync({ file, documentType: docType });
    } catch (error) {
      toast.error('Failed to re-upload document');
    } finally {
      setUploadingDocId(null);
      // Reset input value
      e.target.value = '';
    }
  };



  if (isLoading) return <div className="py-20 text-center text-muted-foreground">Loading…</div>;

  if (!loan) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Loan not found</p>
        <button onClick={() => navigate('/loans')} className="mt-4 text-accent hover:underline text-sm">← Back to loans</button>
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

  const hasFinalLoanNumber = Boolean(
    (loan as any).loan_number &&
    (loan.status === 'approved' || loan.status === 'disbursed') &&
    !(loan as any).loan_number.startsWith('APP-') &&
    !(loan as any).loan_number.startsWith('TEMP-')
  );
  const getScoreColor = (score: string | number) => {
    const s = Number(score);
    if (!s) return 'bg-slate-100 text-slate-600';
    if (s >= 750) return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    if (s >= 700) return 'bg-blue-100 text-blue-700 border-blue-200';
    if (s >= 600) return 'bg-amber-100 text-amber-700 border-amber-200';
    return 'bg-rose-100 text-rose-700 border-rose-200';
  };

  const latestReport = (creditReports as any[]).length > 0 ? (creditReports as any[])[0] : null;

  const applicationIdentifier = (
    typeof (loan as any).application_id === 'string' && (loan as any).application_id
  ) ? (loan as any).application_id : (
    typeof (loan as any).loan_number === 'string' &&
    (
      (loan as any).loan_number.startsWith('APP-') ||
      (loan as any).loan_number.startsWith('TEMP-')
    )
  ) ? (loan as any).loan_number : String(loan.id);

  const Section = ({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) => (
    <div className="stat-card">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-accent">{icon}</span>
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      </div>
      {children}
    </div>
  );

  const Field = ({ label, value, className }: { label: string; value: string; className?: string }) => (
    <div>
      <p className="text-[11px] text-muted-foreground mb-0.5">{label}</p>
      <p className={cn("text-sm font-medium text-foreground", className)}>{value || '—'}</p>
    </div>
  );

  const VerifiedDataBadge = ({ isCached }: { isCached?: boolean }) => (
    <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wider ${isCached
      ? 'bg-blue-500/10 text-blue-600 border-blue-500/20'
      : 'bg-green-500/10 text-green-600 border-green-500/20'
      }`}>
      <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${isCached ? 'bg-blue-500' : 'bg-green-500'}`} />
      {isCached ? 'from db' : 'Live API Response'}
    </div>
  );

  const currentIdx = LOAN_STATUSES.findIndex(s => s.value === loan.status);

  return (
    <>
      <div className="max-w-full mx-auto px-4 pb-20 lg:pb-4">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => navigate('/loans')} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft size={16} /> Back to Applications
          </button>

          {/* Navigation buttons for next/previous loans */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const prevId = WorkflowService.getPreviousLoanId(id!, loans, user?.role || 'employee');
                if (prevId) navigate(`/loans/${prevId}`);
                else toast.info('No previous application found');
              }}
              disabled={!WorkflowService.getPreviousLoanId(id!, loans, user?.role || 'employee')}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border bg-card text-xs font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-30"
            >
              ← Previous
            </button>
            <button
              onClick={() => {
                const nextId = WorkflowService.getNextLoanId(id!, loans, user?.role || 'employee');
                if (nextId) navigate(`/loans/${nextId}`);
                else toast.info('No more applications found');
              }}
              disabled={!WorkflowService.getNextLoanId(id!, loans, user?.role || 'employee')}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border bg-card text-xs font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-30"
            >
              Next →
            </button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex flex-col">
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-black text-foreground tracking-tight">
                    {hasFinalLoanNumber ? (loan as any).loan_number : `Application ID: ${applicationIdentifier}`}
                  </h1>
                  {latestReport && (
                    <div className={cn("px-2.5 py-1 rounded-full text-[10px] font-black border flex items-center gap-1.5 shadow-sm", getScoreColor(latestReport.score))}>
                      <ShieldCheck size={12} className="text-current" />
                      {latestReport.score}
                    </div>
                  )}
                </div>
                {hasFinalLoanNumber && (
                  <p className="text-xs text-green-600 font-medium mt-1">✓ Loan Number Assigned</p>
                )}
              </div>
              <LoanStatusBadge status={loan.status as any} />
              <PDDStatusBadge status={(loan as any).pdd_status} />
            </div>
            <p className="text-sm text-muted-foreground mt-2">{loan.applicant_name} • {(loan as any).maker_name || loan.car_make} {(loan as any).model_variant_name || loan.car_model}</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {canEditPDD && (
              <button
                onClick={() => setIsEditingPDD(!isEditingPDD)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-all shadow-sm font-bold text-xs",
                  isEditingPDD
                    ? "bg-red-500 border-red-600 text-white hover:bg-red-600"
                    : "bg-blue-600 border-blue-700 text-white hover:bg-blue-700"
                )}
              >
                {isEditingPDD ? <X size={14} /> : <Edit2 size={14} />}
                {isEditingPDD ? 'Close PDD' : 'Update PDD'}
              </button>
            )}
            {!isEditingPDD && !isPddManager && (
              <>
                <button
                  onClick={() => exportLoanPDF(loan)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card text-xs font-medium text-foreground hover:bg-accent/10 hover:border-accent transition-colors"
                >
                  <Printer size={14} className="text-accent" />
                  Export
                </button>
                <button
                  onClick={() => downloadLoanPDF(loan)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card text-xs font-medium text-foreground hover:bg-accent/10 hover:border-accent transition-colors"
                >
                  <Download size={14} className="text-accent" />
                  Download
                </button>
                <button
                  onClick={() => shareLoanPDF(loan)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card text-xs font-medium text-foreground hover:bg-green-500/10 hover:border-green-500 transition-colors"
                >
                  <MessageCircle size={14} className="text-green-500" />
                  WhatsApp
                </button>
              </>
            )}

            {permissions.canAddRemarks && !isPddManager && (
              <button
                onClick={() => setRemarksModal({ open: true, currentRemarks: loan.remark || '' })}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card text-xs font-medium text-foreground hover:bg-blue-500/10 hover:border-blue-500 transition-colors"
              >
                <MessageSquare size={14} className="text-blue-500" />
                Remarks
              </button>
            )}

            {/* Workflow Actions */}
            {!isPddManager && (
              <WorkflowActions
                loanId={id!}
                currentStatus={loan.status}
                onSuccess={() => {
                  queryClient.invalidateQueries({ queryKey: ['loan', id] });
                  queryClient.invalidateQueries({ queryKey: ['loans'] });
                  queryClient.invalidateQueries({ queryKey: ['loan-audit-logs', id] });
                  // Return to loans list after a successful workflow move
                  setTimeout(() => navigate('/loans'), 500);
                }}
              />
            )}
            {/* PDD Manager Inline Actions will be rendered in the Audit Section below */}
          </div>
        </div>

        {/* PDD Form Mode */}
        {isEditingPDD ? (
          <div className="max-w-7xl mx-auto py-4">
            <PDDForm
              loan={loan}
              onCancel={() => setIsEditingPDD(false)}
              onSuccess={() => {
                setIsEditingPDD(false);
                queryClient.invalidateQueries({ queryKey: ['loan', id] });
              }}
            />
          </div>
        ) : (
          <>
            {/* Mask Workflow Status for PDD Manager */}
            {!isPddManager && (
              <div className="mb-5">
                {/* Desktop: Horizontal trail */}
                <div className="hidden lg:block">
                  <WorkflowStatus
                    currentStatus={loan.status}
                    pddStatus={(loan as any).pdd_status}
                    createdBy={(loan as any).created_by}
                    submittedBy={(loan as any).pdd_submitted_by}
                    approvedBy={(loan as any).pdd_approved_by}
                    variant="horizontal"
                  />
                </div>

                {/* Mobile: Single line */}
                <div className="lg:hidden">
                  <WorkflowStatus
                    currentStatus={loan.status}
                    pddStatus={(loan as any).pdd_status}
                    createdBy={(loan as any).created_by}
                    submittedBy={(loan as any).pdd_submitted_by}
                    approvedBy={(loan as any).pdd_approved_by}
                    variant="single-line"
                  />
                </div>
              </div>
            )}

            <div className="flex flex-col lg:flex-row gap-6 mb-6">
              <div className="flex-1 min-w-0 space-y-6">
                {/* PDD Section - Inline for PDD workflow roles */}
                {(isPddManager || user?.role === 'employee' || user?.role === 'admin') &&
                  (loan.status === 'approved' || loan.status === 'disbursed') && (
                    <div className="space-y-6">
                      <div className="bg-card border border-border/60 rounded-[1.5rem] p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                          <div className="flex items-center gap-2.5">
                            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
                              <ClipboardCheck size={20} />
                            </div>
                            <div>
                              <h2 className="text-lg font-black tracking-tight text-foreground uppercase">PDD Verification</h2>
                              <p className="text-[10px] font-bold text-muted-foreground uppercase opacity-70 tracking-widest">Post Disbursement Document & RTO Details</p>
                            </div>
                          </div>
                          <PDDStatusBadge status={(loan as any).pdd_status} />
                        </div>

                        <PDDForm
                          loan={loan}
                          onCancel={() => isPddManager ? null : navigate('/loans')}
                          onSuccess={() => {
                            queryClient.invalidateQueries({ queryKey: ['loan', id] });
                            toast.success('PDD updated');
                          }}
                        />

                        {/* Audit Panel for PDD Manager */}
                        {isPddManager && (loan as any).pdd_status === 'pending_approval' && (
                          <div className="mt-8 pt-8 border-t border-border/80">
                            <h3 className="text-sm font-black text-foreground mb-4 uppercase tracking-tighter">Manager Review Audit</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
                              <div className="md:col-span-2">
                                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5 block">Rejection Remarks / Approval Notes</label>
                                <textarea
                                  value={pddReason}
                                  onChange={(e) => setPddReason(e.target.value)}
                                  placeholder="Provide feedback for the employee here..."
                                  className="w-full h-32 p-4 rounded-2xl bg-muted/30 border border-border/50 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 transition-all resize-none shadow-inner"
                                />
                              </div>
                              <div className="flex flex-col gap-3 h-full justify-end pb-1">
                                <button
                                  onClick={async () => {
                                    try {
                                      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/loans/${id}/pdd/approve`, {
                                        method: 'POST',
                                        headers: {
                                          'Content-Type': 'application/json',
                                          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
                                        },
                                        body: JSON.stringify({ reason: pddReason })
                                      });
                                      if (res.ok) {
                                        toast.success('PDD Approved');
                                        queryClient.invalidateQueries({ queryKey: ['loan', id] });
                                        setPddReason('');
                                        setTimeout(() => navigate('/pdd-tracking'), 500);
                                      } else {
                                        const err = await res.json();
                                        toast.error(err.error || 'Failed to approve');
                                      }
                                    } catch (error) { toast.error('Error occurred'); }
                                  }}
                                  disabled={updateStatus.isPending}
                                  className="w-full py-4 rounded-2xl bg-emerald-600 text-white font-black text-xs uppercase tracking-widest shadow-xl shadow-emerald-600/20 hover:bg-emerald-700 transition-all active:scale-95 flex items-center justify-center gap-2"
                                >
                                  <CheckCircle size={18} /> Approve
                                </button>
                                <button
                                  onClick={async () => {
                                    if (!pddReason.trim()) return toast.error('Remarks required for rejection');
                                    try {
                                      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/loans/${id}/pdd/reject`, {
                                        method: 'POST',
                                        headers: {
                                          'Content-Type': 'application/json',
                                          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
                                        },
                                        body: JSON.stringify({ reason: pddReason })
                                      });
                                      if (res.ok) {
                                        toast.success('PDD Rejected');
                                        queryClient.invalidateQueries({ queryKey: ['loan', id] });
                                        setPddReason('');
                                        setTimeout(() => navigate('/pdd-tracking'), 500);
                                      } else {
                                        const err = await res.json();
                                        toast.error(err.error || 'Failed to reject');
                                      }
                                    } catch (error) { toast.error('Error occurred'); }
                                  }}
                                  disabled={updateStatus.isPending}
                                  className="w-full py-4 rounded-2xl bg-rose-600 text-white font-black text-xs uppercase tracking-widest shadow-xl shadow-rose-600/20 hover:bg-rose-700 transition-all active:scale-95 flex items-center justify-center gap-2"
                                >
                                  <XSquare size={18} /> Reject
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                {/* General Loan Details Grid - Masked for PDD Manager */}
                {!isPddManager && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Applicant Information */}
                    <Section title="Applicant Information" icon={<User size={16} />}>
                      <div className="grid grid-cols-2 gap-4">
                        <Field label="Applicant Name" value={loan.applicant_name || (loan as any).customer_name} />
                        <Field label="Mobile Number" value={loan.mobile || (loan as any).customer_phone} />
                        {user?.role !== 'broker' && (
                          <>
                            <Field label="PAN Number" value={(loan as any).pan_number || '—'} />
                            <Field label="Aadhaar Number" value={(loan as any).aadhar_number || '—'} />
                          </>
                        )}
                        <Field label="Customer ID" value={(loan as any).customer_id || '—'} />
                        {user?.role !== 'broker' && <Field label="Branch Manager" value={(loan as any).branch_manager_name || (loan as any).manager_name || '—'} />}
                        {user?.role !== 'broker' && <Field label="Sourcing Person" value={(loan as any).sourcing_person_name || '—'} />}
                        <Field label="Our Branch" value={(loan as any).our_branch || '—'} />
                        <div className="col-span-2">
                          <Field
                            label="Current Address"
                            value={user?.role === 'broker'
                              ? (loan as any).current_district || '—'
                              : [
                                (loan as any).current_address,
                                (loan as any).current_village,
                                (loan as any).current_tehsil,
                                (loan as any).current_district,
                                (loan as any).current_state,
                                (loan as any).current_pincode
                              ].filter(Boolean).join(', ') || '—'}
                          />
                        </div>
                        {user?.role !== 'broker' && (
                          <div className="col-span-2">
                            <Field
                              label="Permanent Address"
                              value={[
                                (loan as any).permanent_address,
                                (loan as any).permanent_village,
                                (loan as any).permanent_tehsil,
                                (loan as any).permanent_district,
                                (loan as any).permanent_state,
                                (loan as any).permanent_pincode
                              ].filter(Boolean).join(', ') || '—'}
                            />
                          </div>
                        )}
                      </div>
                    </Section>

                    {/* Co-Applicant & Guarantor Details */}
                    {user?.role !== 'broker' && ((loan as any).co_applicant_name || (loan as any).guarantor_name) && (
                      <Section title="Co-Applicant & Guarantor" icon={<User size={16} />}>
                        <div className="grid grid-cols-2 gap-4">
                          <Field label="Co-Applicant Name" value={(loan as any).co_applicant_name || '—'} />
                          <Field label="Co-Applicant Mobile" value={(loan as any).co_applicant_mobile || '—'} />
                          <Field label="Guarantor Name" value={(loan as any).guarantor_name || '—'} />
                          <Field label="Guarantor Mobile" value={(loan as any).guarantor_mobile || '—'} />
                        </div>
                      </Section>
                    )}

                    {/* Vehicle Information */}
                    <Section title="Vehicle Information" icon={<Car size={16} />}>
                      <div className="grid grid-cols-2 gap-4">
                        <Field label="Vehicle Registration No" value={(loan as any).vehicle_number || '—'} />
                        <Field label="Maker's Name" value={(loan as any).maker_name || loan.car_make || (loan as any).vehicle_model} />
                        <Field label="Model / Variant" value={(loan as any).model_variant_name || loan.car_model} />
                        <Field label="Mfg Year" value={(loan as any).mfg_year || '—'} />
                        <Field label="Vertical" value={(loan as any).vertical || '—'} />
                        <Field label="Scheme" value={(loan as any).scheme || '—'} />
                        <Field label="Vehicle Type" value={(loan as any).loan_type_vehicle || loan.car_variant || '—'} />
                        <Field label="On-Road Price" value={formatCurrency(Number((loan as any).vehicle_price || loan.on_road_price || 0))} />
                        {user?.role !== 'broker' && (
                          <>
                            <Field label="LTV (%)" value={String((loan as any).ltv || '—')} />
                            <Field label="Chassis Number" value={(loan as any).chassis_number || '—'} />
                            <Field label="Engine Number" value={(loan as any).engine_number || '—'} />
                            <Field label="M-Parivahan" value={(loan as any).financier_m_parivahan || '—'} />
                          </>
                        )}
                      </div>
                    </Section>

                    {/* Loan Information */}
                    <Section title="Loan Information" icon={<IndianRupee size={16} />}>
                      <div className="grid grid-cols-2 gap-4">
                        <Field label="Loan Number" value={hasFinalLoanNumber ? (loan as any).loan_number : 'Not assigned yet'} />
                        <Field label="Application ID" value={applicationIdentifier} />
                        <Field label="Created By" value={(loan as any).creator_name || (loan as any).user_name || '—'} />
                        <Field label="Booking Mode" value={((loan as any).booking_mode || 'self').toString().replace(/\b\w/g, (c: string) => c.toUpperCase())} />
                        <Field label="Loan Amount" value={formatCurrency(Number(loan.loan_amount))} />
                        {user?.role !== 'broker' && (
                          <>
                            <Field label="Total Released" value={formatCurrency(Number((loan as any).total_released_amount || 0))} />
                            <Field
                              label="Remaining Balance"
                              value={formatCurrency(Number((loan as any).remaining_balance || 0))}
                              className={(loan as any).remaining_balance > 0 ? "text-blue-600 font-bold" : ""}
                            />
                          </>
                        )}
                        {user?.role !== 'broker' ? (
                          <>
                            <Field label="IRR (%)" value={String((loan as any).irr || (loan as any).interest_rate || '—')} />
                            <Field label="Tenure (Months)" value={String((loan as any).tenure || (loan as any).tenure_months || '—')} />
                            <Field label="EMI Amount" value={formatCurrency(Number((loan as any).emi_amount || loan.emi || 0))} />
                            <Field label="EMI Start Date" value={formatDisplayDate((loan as any).emi_start_date)} />
                            <Field label="EMI End Date" value={formatDisplayDate((loan as any).emi_end_date)} />
                            <Field label="EMI Mode" value={(loan as any).emi_mode || '—'} />
                            <Field label="Purpose" value={(loan as any).purpose_loan_amount || '—'} />
                            <Field label="Processing Fee" value={formatCurrency(Number((loan as any).processing_fee || 0))} />
                            <Field label="Total Interest" value={formatCurrency(Number((loan as any).total_interest || 0))} />
                            <Field label="Commitment Date" value={formatDisplayDate((loan as any).commitment_date)} />
                            <Field label="Delay Days" value={String((loan as any).delay_days || 0)} />
                            <Field label="Balance Status" value={(loan as any).balance_payment_status || '—'} />
                            <Field label="FC Amount (Foreclosure)" value={formatCurrency(Number((loan as any).fc_amount || 0))} />
                            <Field label="FC Date (Foreclosure)" value={formatDisplayDate((loan as any).fc_date)} />
                          </>
                        ) : (
                          <>
                            <Field label="Tenure (Months)" value={String((loan as any).tenure || (loan as any).tenure_months || '—')} />
                            <Field label="Booking Month" value={(loan as any).booking_month || '—'} />
                          </>
                        )}
                      </div>
                    </Section>

                    {/* Bank Information */}
                    <Section title="Bank Information" icon={<Building2 size={16} />}>
                      <div className="grid grid-cols-2 gap-4">
                        <Field label="Assigned Bank" value={(loan as any).assigned_bank_name || loan.assignedBank || '—'} />
                        {user?.role !== 'broker' && <Field label="Broker" value={(loan as any).booking_mode === 'broker' ? ((loan as any).assigned_broker_name || loan.assignedBroker || '—') : '—'} />}
                        {user?.role !== 'broker' && (
                          <>
                            <Field label="Sanction Amount" value={formatCurrency(Number((loan as any).sanction_amount || 0))} />
                            <Field label="Sanction Date" value={formatDisplayDate((loan as any).sanction_date)} />
                          </>
                        )}
                        <Field label="Disbursement Date" value={formatDisplayDate((loan as any).disbursement_date)} />
                        {user?.role !== 'broker' && (
                          <>
                            <Field label="Financier Executive" value={(loan as any).financier_executive_name || '—'} />
                            <Field label="Financier Team" value={(loan as any).financier_team_vertical || '—'} />
                            <Field label="Disburse Branch" value={(loan as any).disburse_branch_name || '—'} />
                          </>
                        )}
                      </div>
                    </Section>

                    {/* Insurance Information */}
                    <Section title="Insurance Details" icon={<FileText size={16} />}>
                      <div className="grid grid-cols-2 gap-4">
                        {user?.role !== 'broker' && (
                          <>
                            <Field label="Company Name" value={(loan as any).insurance_company_name || '—'} />
                            <Field label="Policy Number" value={(loan as any).insurance_policy_number || '—'} />
                            <Field label="Premium Amount" value={formatCurrency(Number((loan as any).premium_amount || 0))} />
                            <Field label="Policy Start Date" value={formatDisplayDate((loan as any).insurance_start_date)} />
                            <Field label="Policy End Date" value={formatDisplayDate((loan as any).insurance_date)} />
                            <Field label="Made By" value={(loan as any).insurance_made_by || '—'} />
                          </>
                        )}
                        <Field label="Insurance Status" value={(loan as any).insurance_status || 'Pending'} />
                        <Field label="Reminder" value={(loan as any).insurance_reminder_enabled ? 'Enabled' : 'Disabled'} />
                        {user?.role !== 'broker' && (
                          <Field label="Endorsement" value={(loan as any).insurance_endorsement || '—'} />
                        )}
                      </div>
                    </Section>

                    {/* RTO details */}
                    {user?.role !== 'broker' && (
                      <Section title="RTO Details" icon={<MapPin size={16} />}>
                        <div className="grid grid-cols-2 gap-4">
                          <Field label="RC Owner Name" value={(loan as any).rc_owner_name || '—'} />
                          <Field label="RTO Agent Name" value={(loan as any).rto_agent_name || '—'} />
                          <Field label="Agent Mobile" value={(loan as any).agent_mobile_no || '—'} />
                          <Field label="Login Date" value={formatDisplayDate((loan as any).login_date)} />
                          <Field label="Docs Location" value={(loan as any).rto_docs_location || '—'} />
                          <Field label="Agent Mobile (RTO)" value={(loan as any).rto_agent_mobile || '—'} />
                          <Field label="Agent Email (RTO)" value={(loan as any).rto_mail || '—'} />
                          <Field label="DTO Location" value={(loan as any).dto_location || '—'} />
                          <Field label="Work Status" value={(loan as any).rto_work_status || '—'} />
                          <div className="col-span-2">
                            <Field label="Work Description" value={(loan as any).rto_work_description || '—'} />
                          </div>
                          <Field label="Police Case" value={(loan as any).police_case_status || 'No'} />
                          <Field label="Challans" value={(loan as any).challan_status || 'No'} />
                          <Field label="DM Status" value={(loan as any).rto_dm ? 'Received' : 'Pending'} />
                          <Field label="RC Status" value={(loan as any).rto_rc ? 'Received' : 'Pending'} />
                          <Field label="NOC Status" value={(loan as any).rto_noc ? 'Received' : 'Pending'} />
                          <Field label="Tax Receipt" value={(loan as any).rto_tax_receipt ? 'Received' : 'Pending'} />
                          <Field label="FC Status" value={(loan as any).rto_fitness_document ? 'Received' : 'Pending'} />
                          <Field label="Stamp Status" value={(loan as any).rto_stamp_papers ? 'Received' : 'Pending'} />

                        </div>
                      </Section>
                    )}

                    {/* Disbursement details */}
                    {user?.role !== 'broker' && (
                      <Section title="Disbursement & Payouts" icon={<IndianRupee size={16} />}>
                        <div className="grid grid-cols-2 gap-4">
                          <Field label="Net Disbursement" value={formatCurrency(Number((loan as any).net_disbursement_amount || 0))} />
                          <Field label="Hold Amount" value={formatCurrency(Number((loan as any).hold_amount || 0))} />
                          <Field label="Received Amount" value={formatCurrency(Number((loan as any).net_seed_amount || 0))} />
                          <Field label="Payment In Favour" value={(loan as any).payment_in_favour || '—'} />
                          <Field label="Payment Date" value={formatDisplayDate((loan as any).payment_received_date)} />
                          <Field label="Mehar Deduction" value={formatCurrency(Number((loan as any).mehar_deduction || 0))} />
                          <Field label="HPN at Login" value={(loan as any).hpn_at_login ? 'Yes' : 'No'} />
                        </div>
                      </Section>
                    )}

                    {/* Credit Reports Section (Superadmin Only) */}
                    {user?.role === 'super_admin' && (
                      <Section title="Credit Reports" icon={<ShieldCheck size={16} />}>
                        <div className="space-y-4">
                          <div className="flex justify-between items-center mb-4 pb-2 border-b border-border/30">
                            <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Historical Reports</p>
                          </div>

                          {(creditReports as any[]).length === 0 ? (
                            <div className="py-6 text-center border-2 border-dashed border-border rounded-xl">
                              <p className="text-sm text-muted-foreground italic">No credit reports found for this application</p>
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              {(creditReports as any[]).map((report: any) => (
                                <div key={report.id} className="flex flex-col p-4 rounded-2xl border border-border bg-card/50 hover:bg-muted/30 transition-all group relative overflow-hidden">
                                  <div className="absolute top-0 right-0 p-2">
                                    {report.report_link && (
                                      <a
                                        href={getFileUrl(report.report_link)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-2 rounded-lg hover:bg-blue-600/10 text-blue-600 transition-colors"
                                        title="View Report"
                                      >
                                        <ExternalLink size={16} />
                                      </a>
                                    )}
                                  </div>

                                  <div className="flex flex-col items-center text-center gap-4">
                                    <CreditScoreGauge
                                      score={report.score}
                                      size="sm"
                                    />

                                    <div className="space-y-1">
                                      <p className="text-sm font-black text-foreground uppercase tracking-tight">{report.provider}</p>
                                      <p className="text-[10px] text-muted-foreground font-medium">
                                        Fetched on {new Date(report.created_at).toLocaleDateString('en-IN', {
                                          day: '2-digit',
                                          month: 'short',
                                          year: 'numeric'
                                        })}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </Section>
                    )}

                    {/* Broker Commission */}
                    {user?.role !== 'broker' && (commissionRecord || (computedCommission.amount > 0 && loan?.assigned_broker_id)) && (
                      <Section title="Broker Commission" icon={<IndianRupee size={16} />}>
                        <div className="grid grid-cols-2 gap-4">
                          <Field
                            label="Broker Name"
                            value={commissionRecord?.broker_name || (loan as any).assigned_broker_name || '—'}
                          />
                          <Field
                            label="Commission Amount"
                            value={formatCurrency(Number(commissionRecord?.commission_amount || commissionRecord?.amount || computedCommission.amount || 0))}
                          />
                          <Field
                            label="Commission Rate"
                            value={commissionRecord?.commission_rate ? `${commissionRecord.commission_rate}%` : (computedCommission.rate ? `${computedCommission.rate}%` : '—')}
                          />
                          <Field
                            label="Status"
                            value={commissionRecord?.status
                              ? commissionRecord.status.charAt(0).toUpperCase() + commissionRecord.status.slice(1)
                              : (computedCommission.amount > 0 ? 'Calculated (Pending)' : '—')
                            }
                          />
                        </div>
                      </Section>
                    )}

                    {/* FC & NOC Details */}
                    {user?.role !== 'broker' && (
                      <Section title="FC & NOC Details" icon={<FileText size={16} />}>
                        <div className="grid grid-cols-2 gap-4">
                          <Field label="FC Deposited By" value={(loan as any).fc_deposited_by || '—'} />
                          <Field label="FC Date" value={formatDisplayDate((loan as any).fc_deposit_date)} />
                          <Field label="FC Receipt" value={(loan as any).fc_receipt || '—'} />
                          <Field label="Zero Statement" value={(loan as any).zero_statement || '—'} />
                          <Field label="FC Status" value={(loan as any).current_fc_status || '—'} />
                          <Field label="Prev Financier Status" value={(loan as any).prev_financier_account_status || '—'} />
                          <Field label="NOC Status" value={(loan as any).noc_status || '—'} />
                          <Field label="NOC Checked By" value={(loan as any).noc_checked_by || '—'} />
                          <Field label="DTO NOC" value={(loan as any).previous_dto_noc || '—'} />
                        </div>
                      </Section>
                    )}

                    {/* PDD Tracking Detail */}
                    <Section title="PDD Tracking" icon={<FileText size={16} />}>
                      <div className="grid grid-cols-2 gap-4">
                        <Field label="PDD Status" value={(loan as any).pdd_status || 'pending'} />
                        {user?.role !== 'broker' && (
                          <>
                            <Field label="Submitted By" value={(loan as any).pdd_submitted_by_name || '—'} />
                            <Field label="Submitted At" value={(loan as any).pdd_submitted_at ? new Date((loan as any).pdd_submitted_at).toLocaleString() : '—'} />
                            <Field label="PDD Manager" value={(loan as any).pdd_approved_by_name || '—'} />
                            <Field label="Approved At" value={(loan as any).pdd_approved_at ? new Date((loan as any).pdd_approved_at).toLocaleString() : '—'} />
                            <Field label="Finance Co. Update" value={(loan as any).pdd_update_finance_company || '—'} />
                            <div className="col-span-2">
                              <Field label="Rejection Reason" value={(loan as any).pdd_rejection_reason || '—'} />
                            </div>
                          </>
                        )}
                      </div>
                    </Section>
                  </div>
                )}

                {/* Verified External API Data Section - Masked for PDD Manager */}
                {!isPddManager && vehicleCache && (Object.keys(vehicleCache).length > 0) && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between px-1">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 size={18} className="text-green-500" />
                        <h2 className="text-lg font-bold text-foreground">Verified API Data</h2>
                      </div>
                      <VerifiedDataBadge isCached={true} />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {(vehicleCache.rc_full?.data || vehicleCache.rc_lite?.data) && (
                        <div className="stat-card border-green-500/20 bg-green-500/5">
                          <h3 className="text-xs font-bold text-green-700 uppercase mb-3 flex items-center gap-2">
                            <Car size={14} /> RC Verification Response
                          </h3>
                          <div className="grid grid-cols-2 gap-y-3 gap-x-4">
                            <Field label="Owner Name" value={vehicleCache.rc_full?.data?.owner_name || vehicleCache.rc_lite?.data?.owner_name} />
                            <Field label="Father Name" value={vehicleCache.rc_full?.data?.father_name} />
                            <Field label="Reg. Date" value={vehicleCache.rc_full?.data?.registration_date} />
                            <Field label="Fuel Type" value={vehicleCache.rc_full?.data?.fuel_type} />
                            <Field label="Financier" value={vehicleCache.rc_full?.data?.financier || vehicleCache.rc_lite?.data?.financier} />
                            <Field label="Insurance Co." value={vehicleCache.rc_full?.data?.insurance_company} />
                            <Field label="Insurance Expiry" value={vehicleCache.rc_full?.data?.insurance_upto} />
                            <Field label="Fitness Upto" value={vehicleCache.rc_full?.data?.fitness_upto} />
                          </div>
                        </div>
                      )}

                      {((loan as any).total_challans !== undefined || vehicleCache.challan?.data) && (
                        <div className="stat-card border-orange-500/20 bg-orange-500/5">
                          <h3 className="text-xs font-bold text-orange-700 uppercase mb-3 flex items-center gap-2">
                            <FileText size={14} /> Challan Summary
                            {((loan as any).total_challans !== undefined && (loan as any).total_challans !== null) && (
                              <div className="ml-auto flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-600 border border-orange-500/20 text-[8px] font-bold uppercase tracking-wider">
                                Saved with Application
                              </div>
                            )}
                          </h3>
                          <div className="grid grid-cols-2 gap-y-3 gap-x-4">
                            <Field
                              label="Total Challans"
                              value={((loan as any).total_challans !== undefined && (loan as any).total_challans !== null)
                                ? String((loan as any).total_challans)
                                : String(vehicleCache.challan?.data?.total_challans || '0')}
                            />
                            <Field
                              label="Total Amount"
                              value={((loan as any).challan_amount !== undefined && (loan as any).challan_amount !== null)
                                ? `₹${Number((loan as any).challan_amount).toLocaleString()}`
                                : (vehicleCache.challan?.data?.total_amount ? `₹${Number(vehicleCache.challan.data.total_amount).toLocaleString()}` : '₹0')}
                            />
                            <div className="col-span-2">
                              <p className="text-[10px] text-orange-600/70 italic mt-2">
                                {((loan as any).total_challans !== undefined && (loan as any).total_challans !== null)
                                  ? `* Stored during application process`
                                  : `* Last checked: ${vehicleCache.challan?.updated_at ? new Date(vehicleCache.challan.updated_at).toLocaleString() : 'Never'}`}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Documents Section - Masked for PDD Manager */}
                {!isPddManager && (
                  <Section title="Documents" icon={<FileText size={16} />}>
                    {documents.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {documents.map((doc: any) => (
                          <DocumentPreviewCard
                            key={doc.id}
                            doc={doc}
                            onDelete={handleDeleteDoc}
                            onReupload={handleReuploadDoc}
                            canDelete={permissions.canDelete}
                            isUploading={uploadingDocId === doc.id}
                            isAdmin={['admin', 'super_admin', 'manager'].includes(user?.role || '')}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-10 border border-dashed border-border rounded-xl bg-muted/20">
                        <Camera size={32} className="text-muted-foreground/30 mb-2" />
                        <p className="text-sm text-muted-foreground">No documents uploaded yet.</p>
                      </div>
                    )}
                  </Section>
                )}
              </div>

              {/* Right Sidebar - Masked for PDD Manager */}
              {!isPddManager && (
                <div className="w-full lg:w-96 space-y-6">
                  <div className="lg:sticky lg:top-4 h-fit space-y-6">
                    {/* Remarks Section */}
                    {(loan as any).remark && (
                      <Section title="Admin Remarks" icon={<MessageSquare size={16} />}>
                        <div className="p-4 bg-accent/5 rounded-xl border border-accent/10">
                          <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed italic">"{(loan as any).remark}"</p>
                        </div>
                      </Section>
                    )}

                    {/* Workflow History Section */}
                    {auditLogs.length > 0 && (
                      <Section title="Workflow History" icon={<Clock size={16} />}>
                        <div className="space-y-6 pb-2 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
                          {auditLogs.map((log: any, index: number) => (
                            <div key={log.id} className="relative pl-6">
                              {/* Timeline connector */}
                              {index < auditLogs.length - 1 && (
                                <div className="absolute left-[7px] top-[18px] bottom-[-24px] w-[2px] bg-border" />
                              )}
                              {/* Timeline dot */}
                              <div className="absolute left-0 top-[6px] w-3.5 h-3.5 rounded-full border-2 border-accent bg-background z-10" />

                              <div className="flex flex-col gap-1 mb-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-bold text-foreground">
                                    {LOAN_STATUSES.find(s => s.value === log.to_status)?.label || log.to_status}
                                  </span>
                                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground uppercase font-bold tracking-tighter">
                                    {log.action_type?.replace(/_/g, ' ')}
                                  </span>
                                </div>
                                <span className="text-[10px] text-muted-foreground font-medium">
                                  {new Date(log.performed_at).toLocaleString('en-IN', {
                                    day: '2-digit',
                                    month: 'short',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    hour12: true
                                  })}
                                </span>
                              </div>

                              <div className="flex flex-col gap-1">
                                <p className="text-[11px] text-muted-foreground leading-snug">
                                  By <span className="text-foreground font-semibold">{log.performed_by_name || 'System'}</span>
                                  {log.forwarded_to_role && (
                                    <span> → <span className="text-accent font-semibold capitalize">{log.forwarded_to_role}</span></span>
                                  )}
                                </p>
                                {log.remarks && (
                                  <div className="mt-1.5 p-2 rounded-lg bg-muted/40 border border-border/50">
                                    <p className="text-[11px] text-foreground italic whitespace-pre-wrap">
                                      "{log.remarks}"
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </Section>
                    )}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-card border border-border rounded-xl shadow-2xl max-w-md w-full p-6 animate-in zoom-in-95 duration-200">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center">
                  <X size={24} className="text-red-500" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    Delete Loan Application?
                  </h3>
                  <p className="text-sm text-muted-foreground mb-1">
                    Are you sure you want to delete this loan application?
                  </p>
                  <p className="text-sm font-medium text-red-500">
                    This action cannot be undone.
                  </p>
                  <div className="mt-4 p-3 rounded-lg bg-muted/50 border border-border">
                    <p className="text-xs text-muted-foreground mb-1">Application Details:</p>
                    <p className="text-sm font-medium text-foreground">{hasFinalLoanNumber ? (loan as any).loan_number : applicationIdentifier}</p>
                    <p className="text-xs text-muted-foreground mt-1">{loan.applicant_name} • {formatCurrency(Number(loan.loan_amount))}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 mt-6">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  disabled={deleteLoan.isPending}
                  className="flex-1 px-4 py-2.5 rounded-lg border border-border bg-card text-sm font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleteLoan.isPending}
                  className="flex-1 px-4 py-2.5 rounded-lg bg-red-500 text-sm font-medium text-white hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {deleteLoan.isPending ? 'Deleting...' : 'Delete Application'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Document Confirmation Modal */}
        {showDeleteDocModal && docToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-card border border-border rounded-xl shadow-2xl max-w-md w-full p-6 animate-in zoom-in-95 duration-200">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center">
                  <FileText size={24} className="text-red-500" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    Delete Document?
                  </h3>
                  <p className="text-sm text-muted-foreground mb-1">
                    Are you sure you want to delete this document?
                  </p>
                  <p className="text-sm font-medium text-red-500">
                    This action cannot be undone.
                  </p>
                  <div className="mt-4 p-3 rounded-lg bg-muted/50 border border-border">
                    <p className="text-xs text-muted-foreground mb-1">Document Details:</p>
                    <p className="text-sm font-medium text-foreground">{docToDelete.document_name || docToDelete.file_name}</p>
                    <p className="text-xs text-muted-foreground mt-1">{docToDelete.document_type?.replace(/_/g, ' ').toUpperCase()}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowDeleteDocModal(false);
                    setDocToDelete(null);
                  }}
                  disabled={deleteDocument.isPending}
                  className="flex-1 px-4 py-2.5 rounded-lg border border-border bg-card text-sm font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteDoc}
                  disabled={deleteDocument.isPending}
                  className="flex-1 px-4 py-2.5 rounded-lg bg-red-500 text-sm font-medium text-white hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {deleteDocument.isPending ? 'Deleting...' : 'Delete Document'}
                </button>
              </div>
            </div>
          </div>
        )}

        <RemarksModal
          open={remarksModal.open}
          onClose={() => setRemarksModal({ open: false, currentRemarks: '' })}
          loanId={id!}
          currentRemarks={remarksModal.currentRemarks}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['loan', id] });
            setRemarksModal({ open: false, currentRemarks: '' });
          }}
        />
        {/* PDD Form Modal */}

      </>
      );
}
