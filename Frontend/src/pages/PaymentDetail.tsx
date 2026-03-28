import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';
import { ArrowLeft, FileText, CreditCard, Building2, User, Calendar, CheckCircle, XCircle, Eye, Edit, DollarSign } from 'lucide-react';

type PaymentStatus = 'pending' | 'manager_approved' | 'accounts_processing' | 'paid' | 'rejected';

const PAYMENT_STATUSES = [
  { value: 'pending', label: 'Pending Review', color: 'bg-yellow-100 text-yellow-800', icon: Calendar },
  { value: 'manager_approved', label: 'Manager Approved', color: 'bg-blue-100 text-blue-800', icon: CheckCircle },
  { value: 'accounts_processing', label: 'Accounts Processing', color: 'bg-purple-100 text-purple-800', icon: CreditCard },
  { value: 'paid', label: 'Paid', color: 'bg-green-100 text-green-800', icon: DollarSign },
  { value: 'rejected', label: 'Rejected', color: 'bg-red-100 text-red-800', icon: XCircle }
];

export default function PaymentDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [showUTRModal, setShowUTRModal] = useState(false);
  const [utrNumber, setUtrNumber] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [previewDoc, setPreviewDoc] = useState<{ url: string; name: string } | null>(null);

  // Fetch payment details
  const { data: payment, isLoading } = useQuery({
    queryKey: ['payment', id],
    queryFn: async () => {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/payments/${id}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
      });
      if (!response.ok) throw new Error('Failed to fetch payment');
      const data = await response.json();
      return data.data || data;
    },
    enabled: !!id,
  });

  // Fetch supporting documents
  const { data: documents = [] } = useQuery({
    queryKey: ['payment-documents', id],
    queryFn: async () => {
      if (!payment?.supporting_documents?.length) return [];
      
      const docPromises = payment.supporting_documents.map(async (docId: string) => {
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/documents/${docId}`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
        });
        if (response.ok) {
          return response.json();
        }
        return null;
      });
      
      const results = await Promise.all(docPromises);
      return results.filter(doc => doc !== null);
    },
    enabled: !!payment?.supporting_documents?.length,
  });

  // Update payment status
  const updateStatus = useMutation({
    mutationFn: async ({ status, remarks }: { status: PaymentStatus; remarks?: string }) => {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/payments/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({ status, remarks, updated_by: user?.id })
      });
      if (!response.ok) throw new Error('Failed to update status');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment', id] });
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      toast.success('Payment status updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update status');
    }
  });

  // Add UTR number and mark as paid
  const addUTRNumber = useMutation({
    mutationFn: async ({ utr, date }: { utr: string; date: string }) => {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/payments/${id}/utr`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({ 
          utr_number: utr, 
          payment_date: date,
          status: 'paid',
          updated_by: user?.id 
        })
      });
      if (!response.ok) throw new Error('Failed to add UTR number');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment', id] });
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      setShowUTRModal(false);
      setUtrNumber('');
      toast.success('UTR number added and payment marked as paid');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to add UTR number');
    }
  });

  const previewDocument = async (doc: any) => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const baseUrl = apiUrl.replace(/\/api$/, '');
      const normalizedPath = doc.file_url.startsWith('/uploads') ? `/api${doc.file_url}` : doc.file_url;
      const fileUrl = doc.file_url.startsWith('http') ? doc.file_url : `${baseUrl}${normalizedPath}`;
      
      setPreviewDoc({ url: fileUrl, name: doc.document_name || doc.file_name });
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
    addUTRNumber.mutate({ utr: utrNumber.trim(), date: paymentDate });
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

  const statusConfig = PAYMENT_STATUSES.find(s => s.value === payment.status);
  const canApprove = ['manager', 'admin', 'super_admin'].includes(user?.role || '') && payment.status === 'pending';
  const canProcess = user?.role === 'accountant' && payment.status === 'manager_approved';
  const canAddUTR = user?.role === 'accountant' && payment.status === 'accounts_processing';

  const Section = ({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) => (
    <div className="bg-card rounded-lg border border-border p-6">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-accent">{icon}</span>
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      </div>
      {children}
    </div>
  );

  const Field = ({ label, value }: { label: string; value: string }) => (
    <div>
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className="text-sm font-medium text-foreground">{value || '—'}</p>
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
                  onClick={() => updateStatus.mutate({ status: 'manager_approved' })}
                  className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm font-medium"
                >
                  <CheckCircle size={16} />
                  Approve
                </button>
                <button
                  onClick={() => updateStatus.mutate({ status: 'rejected' })}
                  className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm font-medium"
                >
                  <XCircle size={16} />
                  Reject
                </button>
              </>
            )}
            
            {canProcess && (
              <button
                onClick={() => navigate(`/payments/${id}/voucher`)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
              >
                <FileText size={16} />
                Create Voucher
              </button>
            )}
            
            {canAddUTR && (
              <button
                onClick={() => setShowUTRModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-accent text-accent-foreground rounded-lg hover:opacity-90 transition-opacity text-sm font-medium"
              >
                <DollarSign size={16} />
                Add UTR & Mark Paid
              </button>
            )}
          </div>
        </div>

        {/* Payment Details Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Payment Information */}
          <Section title="Payment Information" icon={<CreditCard size={20} />}>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Payment Type" value={payment.payment_type?.replace(/_/g, ' ').toUpperCase()} />
              <Field label="Amount" value={formatCurrency(Number(payment.amount))} />
              <div className="col-span-2">
                <Field label="Purpose/Description" value={payment.description} />
              </div>
              <Field label="Created Date" value={new Date(payment.created_at).toLocaleDateString()} />
              <Field label="Created By" value={payment.created_by_name || 'System'} />
              {payment.utr_number && (
                <>
                  <Field label="UTR Number" value={payment.utr_number} />
                  <Field label="Payment Date" value={payment.payment_date ? new Date(payment.payment_date).toLocaleDateString() : '—'} />
                </>
              )}
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
              <Field label="Tenure (Months)" value={String(payment.tenure_months || 0)} />
              <Field label="EMI Amount" value={formatCurrency(Number(payment.emi_amount || 0))} />
              <Field label="IRR (%)" value={`${payment.irr_percentage || 0}%`} />
              <Field label="Loan Type" value={payment.loan_type} />
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
              <Field label="Hold Amount" value={formatCurrency(Number(payment.hold_amount || 0))} />
              <Field label="Hold Percentage (%)" value={`${payment.hold_percentage || 0}%`} />
              <Field label="Challan Amount" value={formatCurrency(Number(payment.challan_amount || 0))} />
              <Field label="Payment In Favour" value={payment.payment_in_favour_name} />
            </div>
          </Section>

          {/* Verification & Status Details */}
          <Section title="Verification & Office Details" icon={<CheckCircle size={20} />}>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Our Branch" value={payment.branch_name} />
              <Field label="Disbursement Branch" value={payment.disbursement_branch} />
              <Field label="Branch Manager" value={payment.branch_manager_name} />
              <Field label="NOC Checked By" value={payment.noc_checked_by} />
              <Field label="Insurance Available" value={payment.insurance_available ? 'YES' : 'NO'} />
              <Field label="3rd Party Stamp" value={payment.third_party_stamp ? 'YES' : 'NO'} />
              <Field label="NOC Stamp" value={payment.noc_stamp ? 'YES' : 'NO'} />
              <Field label="Is Third Party" value={payment.is_third_party ? 'YES' : 'NO'} />
              <Field label="DM Approval" value={payment.dm_approval ? 'APPROVED' : 'PENDING'} />
            </div>
          </Section>

          {/* Voucher Information */}
          {payment.voucher_number && (
            <Section title="Voucher Information" icon={<FileText size={20} />}>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Voucher Number" value={payment.voucher_number} />
                <Field label="Voucher Date" value={payment.voucher_date ? new Date(payment.voucher_date).toLocaleDateString() : '—'} />
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

        {/* Supporting Documents */}
        {documents.length > 0 && (
          <Section title="Supporting Documents" icon={<FileText size={20} />}>
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
                  <button
                    onClick={() => previewDocument(doc)}
                    className="flex items-center gap-1 px-2 py-1 text-xs bg-accent/10 text-accent rounded hover:bg-accent/20 transition-colors"
                  >
                    <Eye size={12} />
                    Preview
                  </button>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Remarks */}
        {payment.remarks && (
          <Section title="Remarks" icon={<FileText size={20} />}>
            <p className="text-sm text-foreground whitespace-pre-wrap">{payment.remarks}</p>
          </Section>
        )}
      </div>

      {/* UTR Number Modal */}
      {showUTRModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Add UTR Number</h3>
            <form onSubmit={handleUTRSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">UTR Number *</label>
                <input
                  type="text"
                  value={utrNumber}
                  onChange={(e) => setUtrNumber(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20"
                  placeholder="Enter UTR number"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Payment Date *</label>
                <input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20"
                  required
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowUTRModal(false)}
                  className="flex-1 px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addUTRNumber.isPending}
                  className="flex-1 px-4 py-2 bg-accent text-accent-foreground rounded-lg hover:opacity-90 transition-opacity disabled:opacity-60"
                >
                  {addUTRNumber.isPending ? 'Adding...' : 'Add UTR & Mark Paid'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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