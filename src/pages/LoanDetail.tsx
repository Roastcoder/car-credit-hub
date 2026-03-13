import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { loansAPI } from '@/lib/api';
import { formatCurrency, LOAN_STATUSES, WORKFLOW_STEPS } from '@/lib/mock-data';
import { WorkflowService } from '@/lib/workflow';
import { getRolePermissions } from '@/lib/permissions';
import { RemarksModal } from '@/components/RemarksModal';
import { WorkflowActions } from '@/components/WorkflowActions';
import WorkflowStatus from '@/components/WorkflowStatus';
import RoleInfo, { WorkflowStepsInfo } from '@/components/RoleInfo';
import LoanStatusBadge from '@/components/LoanStatusBadge';
import PDDStatusBadge from '@/components/PDDStatusBadge';
import { ArrowLeft, ArrowRight, ChevronLeft, ChevronRight, User, Car, IndianRupee, Building2, FileText, Eye, X, Printer, MessageCircle, Mail, Download, ExternalLink, MessageSquare, MapPin } from 'lucide-react';
import { exportLoanPDF, shareLoanPDF, downloadLoanPDF } from '@/lib/pdf-export';
import { toast } from 'sonner';

const DOC_TYPES = [
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

  const { data: loan, isLoading } = useQuery({
    queryKey: ['loan', id],
    queryFn: async () => {
      const response = await loansAPI.getById(id as any); // Don't convert to Number, keep as string
      console.log('Loan detail API response:', response);
      const loanData = response.data || response;
      console.log('Processed loan data:', loanData);
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

  const updateStatus = useMutation({
    mutationFn: async (newStatus: string) => {
      console.log('Updating status to:', newStatus, 'for loan ID:', id);
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


  const [previewDoc, setPreviewDoc] = useState<{ url: string; name: string } | null>(null);
  const [loadingPreview, setLoadingPreview] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDeleteDocModal, setShowDeleteDocModal] = useState(false);
  const [docToDelete, setDocToDelete] = useState<any>(null);
  const [uploadingDocId, setUploadingDocId] = useState<string | null>(null);

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

  const previewDocument = async (doc: any) => {
    setLoadingPreview(doc.id);
    try {
      // Use the file_url directly from the document
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      // Remove /api from the end to get base URL
      const baseUrl = apiUrl.replace(/\/api$/, '');

      // Construct full URL
      const normalizedPath = doc.file_url.startsWith('/uploads') ? `/api${doc.file_url}` : doc.file_url;
      const fileUrl = doc.file_url.startsWith('http')
        ? doc.file_url
        : `${baseUrl}${normalizedPath}`;

      console.log('Preview URL:', fileUrl);
      setPreviewDoc({ url: fileUrl, name: doc.document_name || doc.file_name });
    } catch (error) {
      console.error('Preview error:', error);
      toast.error('Failed to load document');
    } finally {
      setLoadingPreview(null);
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

  const Section = ({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) => (
    <div className="stat-card">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-accent">{icon}</span>
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      </div>
      {children}
    </div>
  );

  const Field = ({ label, value }: { label: string; value: string }) => (
    <div>
      <p className="text-[11px] text-muted-foreground mb-0.5">{label}</p>
      <p className="text-sm font-medium text-foreground">{value || '—'}</p>
    </div>
  );

  const currentIdx = LOAN_STATUSES.findIndex(s => s.value === loan.status);

  return (
    <>
      <div className="max-w-6xl mx-auto px-4 pb-20 lg:pb-4">
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
              <h1 className="text-xl sm:text-2xl font-bold text-foreground">{(loan as any).loan_number || loan.id}</h1>
              <LoanStatusBadge status={loan.status as any} />
              <PDDStatusBadge status={(loan as any).pdd_status} />
            </div>
            <p className="text-sm text-muted-foreground mt-1">{loan.applicant_name} • {(loan as any).maker_name || loan.car_make} {(loan as any).model_variant_name || loan.car_model}</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
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
            <button
              onClick={() => {
                const loanId = (loan as any).loan_number || loan.id;
                const subject = `Loan Application - ${loanId} | ${loan.applicant_name}`;
                const body = `Mehar Finance - Loan Application Details\n\nApplication ID: ${loanId}\nApplicant: ${loan.applicant_name}\nMobile: ${loan.mobile}\nVehicle: ${(loan as any).maker_name || loan.car_make || ''} ${(loan as any).model_variant_name || loan.car_model || ''}\nLoan Amount: ${formatCurrency(Number(loan.loan_amount))}\nStatus: ${loan.status}\nEMI: ${formatCurrency(Number((loan as any).emi_amount || loan.emi || 0))}\nTenure: ${loan.tenure} months\n\nGenerated by Mehar Finance`;
                window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, '_self');
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card text-xs font-medium text-foreground hover:bg-blue-500/10 hover:border-blue-500 transition-colors"
            >
              <Mail size={14} className="text-blue-500" />
              Email
            </button>
            
            {permissions.canAddRemarks && (
              <button
                onClick={() => setRemarksModal({ open: true, currentRemarks: loan.remark || '' })}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card text-xs font-medium text-foreground hover:bg-blue-500/10 hover:border-blue-500 transition-colors"
              >
                <MessageSquare size={14} className="text-blue-500" />
                Remarks
              </button>
            )}
            
            {/* Workflow Actions */}
            <WorkflowActions 
              loanId={id!}
              currentStatus={loan.status}
              onSuccess={() => {
                queryClient.invalidateQueries({ queryKey: ['loan', id] });
                queryClient.invalidateQueries({ queryKey: ['loans'] });
                // Return to loans list after a successful workflow move
                setTimeout(() => navigate('/loans'), 500);
              }}
            />
            {(user?.role === 'admin' || user?.role === 'super_admin' || user?.role === 'manager') && (
              <>
                <select
                  value={loan.status}
                  onChange={e => updateStatus.mutate(e.target.value)}
                  disabled={updateStatus.isPending}
                  className="px-3 py-1.5 rounded-lg border border-border bg-card text-xs font-medium text-foreground focus:outline-none focus:border-accent transition-colors"
                >
                  {LOAN_STATUSES.map(s => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
                <button
                  onClick={() => navigate(`/loans/${id}/edit`)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card text-xs font-medium text-foreground hover:bg-accent/10 hover:border-accent transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit
                </button>
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-500/50 bg-red-500/10 text-xs font-medium text-red-500 hover:bg-red-500/20 hover:border-red-500 transition-colors"
                >
                  <X size={14} />
                  Delete
                </button>
              </>
            )}
          </div>
        </div>

        {/* Workflow Status */}
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

        {/* Loan Details Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Applicant Information */}
          <Section title="Applicant Information" icon={<User size={16} />}>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Applicant Name" value={loan.applicant_name || (loan as any).customer_name} />
              <Field label="Mobile Number" value={loan.mobile || (loan as any).customer_phone} />
              <Field label="Email Address" value={(loan as any).customer_email || '—'} />
              <Field label="PAN Number" value={(loan as any).pan || '—'} />
              <Field label="Aadhaar Number" value={(loan as any).aadhaar || '—'} />
              <Field label="Customer ID" value={(loan as any).customer_id || '—'} />
              <Field label="Sourcing Person" value={(loan as any).sourcing_person_name || '—'} />
              <Field label="Our Branch" value={(loan as any).our_branch || '—'} />
              <div className="col-span-2">
                <Field 
                  label="Current Address" 
                  value={[
                    (loan as any).current_address,
                    (loan as any).current_village,
                    (loan as any).current_tehsil,
                    (loan as any).current_district,
                    (loan as any).current_state,
                    (loan as any).current_pincode
                  ].filter(Boolean).join(', ') || '—'} 
                />
              </div>
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
            </div>
          </Section>

          {/* Co-Applicant & Guarantor Details */}
          {( (loan as any).co_applicant_name || (loan as any).guarantor_name ) && (
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
              <Field label="LTV (%)" value={String((loan as any).ltv || '—')} />
              <Field label="Chassis Number" value={(loan as any).chassis_number || '—'} />
              <Field label="Engine Number" value={(loan as any).engine_number || '—'} />
              <Field label="M-Parivahan" value={(loan as any).financier_m_parivahan || '—'} />
            </div>
          </Section>

          {/* Loan Information */}
          <Section title="Loan Information" icon={<IndianRupee size={16} />}>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Loan Amount" value={formatCurrency(Number(loan.loan_amount))} />
              <Field label="IRR (%)" value={String((loan as any).irr || (loan as any).interest_rate || '—')} />
              <Field label="Tenure (Months)" value={String((loan as any).tenure || (loan as any).tenure_months || '—')} />
              <Field label="EMI Amount" value={formatCurrency(Number((loan as any).emi_amount || loan.emi || 0))} />
              <Field label="EMI Start Date" value={(loan as any).emi_start_date || '—'} />
              <Field label="EMI End Date" value={(loan as any).emi_end_date || '—'} />
              <Field label="EMI Mode" value={(loan as any).emi_mode || '—'} />
              <Field label="Purpose" value={(loan as any).purpose_loan_amount || '—'} />
              <Field label="Processing Fee" value={formatCurrency(Number((loan as any).processing_fee || 0))} />
              <Field label="Total Interest" value={formatCurrency(Number((loan as any).total_interest || 0))} />
              <Field label="Commitment Date" value={(loan as any).commitment_date || '—'} />
              <Field label="Delay Days" value={String((loan as any).delay_days || 0)} />
              <Field label="Balance Status" value={(loan as any).balance_payment_status || '—'} />
            </div>
          </Section>

          {/* Bank Information */}
          <Section title="Bank Information" icon={<Building2 size={16} />}>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Assigned Bank" value={(loan as any).assigned_bank_name || loan.assignedBank || '—'} />
              <Field label="Broker" value={(loan as any).assigned_broker_name || loan.assignedBroker || '—'} />
              <Field label="Sanction Amount" value={formatCurrency(Number((loan as any).sanction_amount || 0))} />
              <Field label="Sanction Date" value={(loan as any).sanction_date || '—'} />
              <Field label="Disbursement Date" value={(loan as any).disbursement_date || '—'} />
              <Field label="Financier Executive" value={(loan as any).financier_executive_name || '—'} />
              <Field label="Financier Team" value={(loan as any).financier_team_vertical || '—'} />
              <Field label="Disburse Branch" value={(loan as any).disburse_branch_name || '—'} />
            </div>
          </Section>

          {/* Insurance Information */}
          <Section title="Insurance Details" icon={<FileText size={16} />}>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Company Name" value={(loan as any).insurance_company_name || '—'} />
              <Field label="Policy Number" value={(loan as any).insurance_policy_number || '—'} />
              <Field label="Premium Amount" value={formatCurrency(Number((loan as any).premium_amount || 0))} />
              <Field label="Policy Date" value={(loan as any).insurance_date || '—'} />
              <Field label="Made By" value={(loan as any).insurance_made_by || '—'} />
              <Field label="Insurance Status" value={(loan as any).insurance_status || '—'} />
              <Field label="Reminder" value={(loan as any).insurance_reminder_enabled ? 'Enabled' : 'Disabled'} />
              <Field label="Endorsement" value={(loan as any).insurance_endorsement || '—'} />
            </div>
          </Section>

          {/* RTO details */}
          <Section title="RTO Details" icon={<MapPin size={16} />}>
            <div className="grid grid-cols-2 gap-4">
              <Field label="RC Owner Name" value={(loan as any).rc_owner_name || '—'} />
              <Field label="RTO Agent Name" value={(loan as any).rto_agent_name || '—'} />
              <Field label="Agent Mobile" value={(loan as any).agent_mobile_no || '—'} />
              <Field label="Login Date" value={(loan as any).login_date || '—'} />
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
              <Field label="Pollution" value={(loan as any).pollution_status || '—'} />
              <Field label="Vehicle Check" value={(loan as any).vehicle_check_status || '—'} />
            </div>
          </Section>

          {/* Disbursement details */}
          <Section title="Disbursement & Payouts" icon={<IndianRupee size={16} />}>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Total Deduction" value={formatCurrency(Number((loan as any).total_deduction || 0))} />
              <Field label="Net Disbursement" value={formatCurrency(Number((loan as any).net_disbursement_amount || 0))} />
              <Field label="Hold Amount" value={formatCurrency(Number((loan as any).hold_amount || 0))} />
              <Field label="Net Seed Amount" value={formatCurrency(Number((loan as any).net_seed_amount || 0))} />
              <Field label="Payment In Favour" value={(loan as any).payment_in_favour || '—'} />
              <Field label="Payment Date" value={(loan as any).payment_received_date || '—'} />
              <Field label="Mehar Deduction" value={formatCurrency(Number((loan as any).mehar_deduction || 0))} />
              <Field label="Mehar PF" value={formatCurrency(Number((loan as any).mehar_pf || 0))} />
              <Field label="HPN at Login" value={(loan as any).hpn_at_login ? 'Yes' : 'No'} />
            </div>
          </Section>

          {/* FC & NOC Details */}
          <Section title="FC & NOC Details" icon={<FileText size={16} />}>
            <div className="grid grid-cols-2 gap-4">
              <Field label="FC Deposited By" value={(loan as any).fc_deposited_by || '—'} />
              <Field label="FC Date" value={(loan as any).fc_deposit_date || '—'} />
              <Field label="FC Receipt" value={(loan as any).fc_receipt || '—'} />
              <Field label="Zero Statement" value={(loan as any).zero_statement || '—'} />
              <Field label="FC Status" value={(loan as any).current_fc_status || '—'} />
              <Field label="Prev Financier Status" value={(loan as any).prev_financier_account_status || '—'} />
              <Field label="NOC Status" value={(loan as any).noc_status || '—'} />
              <Field label="NOC Checked By" value={(loan as any).noc_checked_by || '—'} />
              <Field label="DTO NOC" value={(loan as any).previous_dto_noc || '—'} />
            </div>
          </Section>

          {/* PDD Tracking Detail */}
          <Section title="PDD Tracking" icon={<FileText size={16} />}>
            <div className="grid grid-cols-2 gap-4">
              <Field label="PDD Status" value={(loan as any).pdd_status || 'pending'} />
              <Field label="Submitted By" value={(loan as any).pdd_submitted_by_name || '—'} />
              <Field label="Submitted At" value={(loan as any).pdd_submitted_at ? new Date((loan as any).pdd_submitted_at).toLocaleString() : '—'} />
              <Field label="Approved By" value={(loan as any).pdd_approved_by_name || '—'} />
              <Field label="Approved At" value={(loan as any).pdd_approved_at ? new Date((loan as any).pdd_approved_at).toLocaleString() : '—'} />
              <Field label="Finance Co. Update" value={(loan as any).pdd_update_finance_company || '—'} />
              <div className="col-span-2">
                <Field label="Rejection Reason" value={(loan as any).pdd_rejection_reason || '—'} />
              </div>
            </div>
          </Section>
        </div>

        {/* Documents Section */}
        <Section title="Documents" icon={<FileText size={16} />}>
          {documents.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {documents.map((doc: any) => (
                <div key={doc.id} className="border border-border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {doc.document_name || doc.file_name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {doc.document_type?.replace(/_/g, ' ').toUpperCase()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-3">
                    <button
                      onClick={() => previewDocument(doc)}
                      disabled={loadingPreview === doc.id}
                      className="flex items-center gap-1 px-2 py-1 text-xs bg-accent/10 text-accent rounded hover:bg-accent/20 transition-colors disabled:opacity-50"
                    >
                      <Eye size={12} />
                      {loadingPreview === doc.id ? 'Loading...' : 'View'}
                    </button>
                    {permissions.canDelete && (
                      <button
                        onClick={() => handleDeleteDoc(doc)}
                        className="flex items-center gap-1 px-2 py-1 text-xs bg-red-500/10 text-red-500 rounded hover:bg-red-500/20 transition-colors"
                      >
                        <X size={12} />
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No documents uploaded yet.</p>
          )}
        </Section>

        {/* Remarks Section */}
        {(loan as any).remark && (
          <Section title="Remarks" icon={<MessageSquare size={16} />}>
            <p className="text-sm text-foreground whitespace-pre-wrap">{(loan as any).remark}</p>
          </Section>
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
                  <p className="text-sm font-medium text-foreground">{(loan as any).loan_number || loan.id}</p>
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
      
      {/* Remarks Modal */}
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

      {/* Document Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-card border border-border rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="text-lg font-semibold text-foreground truncate">
                {previewDoc.name}
              </h3>
              <button
                onClick={() => setPreviewDoc(null)}
                className="p-2 rounded-lg hover:bg-muted transition-colors"
              >
                <X size={20} className="text-muted-foreground" />
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
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/placeholder-document.png';
                  }}
                />
              )}
            </div>
            <div className="flex items-center justify-end gap-2 p-4 border-t border-border">
              <a
                href={previewDoc.url}
                download={previewDoc.name}
                className="flex items-center gap-2 px-4 py-2 bg-accent text-accent-foreground rounded-lg hover:opacity-90 transition-opacity"
              >
                <Download size={16} />
                Download
              </a>
              <button
                onClick={() => setPreviewDoc(null)}
                className="px-4 py-2 border border-border bg-card text-foreground rounded-lg hover:bg-muted transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
