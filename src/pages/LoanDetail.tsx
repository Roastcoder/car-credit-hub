import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { formatCurrency, LOAN_STATUSES } from '@/lib/mock-data';
import LoanStatusBadge from '@/components/LoanStatusBadge';
import { ArrowLeft, User, Car, IndianRupee, Building2, FileText, Eye, X, Printer, MessageCircle, Mail } from 'lucide-react';
import { exportLoanPDF, shareLoanPDF } from '@/lib/pdf-export';
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
  

  const { data: loan, isLoading } = useQuery({
    queryKey: ['loan', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('loans')
        .select('*, banks(name), brokers(name, commission_rate)')
        .eq('id', id!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: documents = [], refetch: refetchDocs } = useQuery({
    queryKey: ['loan-documents', id],
    queryFn: async () => {
      const { data } = await supabase
        .from('loan_documents')
        .select('*')
        .eq('loan_id', id!)
        .order('created_at', { ascending: false });
      return data ?? [];
    },
    enabled: !!id,
  });

  const updateStatus = useMutation({
    mutationFn: async (newStatus: string) => {
      const { error } = await supabase
        .from('loans')
        .update({ status: newStatus as any })
        .eq('id', id!);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loan', id] });
      queryClient.invalidateQueries({ queryKey: ['loans'] });
      queryClient.invalidateQueries({ queryKey: ['loans-dashboard'] });
      toast.success('Status updated');
    },
    onError: () => toast.error('Failed to update status'),
  });


  const [previewDoc, setPreviewDoc] = useState<{ url: string; name: string } | null>(null);
  const [loadingPreview, setLoadingPreview] = useState<string | null>(null);

  const previewDocument = async (doc: any) => {
    setLoadingPreview(doc.id);
    const { data, error } = await supabase.storage.from('loan-documents').createSignedUrl(doc.storage_path, 300);
    setLoadingPreview(null);
    if (data?.signedUrl) {
      setPreviewDoc({ url: data.signedUrl, name: doc.file_name });
    } else {
      toast.error('Document not found in storage');
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
      <div className="flex items-center gap-2 mb-4">
        <span className="text-accent">{icon}</span>
        <h3 className="font-semibold text-foreground">{title}</h3>
      </div>
      {children}
    </div>
  );

  const Field = ({ label, value }: { label: string; value: string }) => (
    <div>
      <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
      <p className="text-sm font-medium text-foreground">{value || '—'}</p>
    </div>
  );

  const currentIdx = LOAN_STATUSES.findIndex(s => s.value === loan.status);

  return (
    <div className="max-w-4xl mx-auto">
      <button onClick={() => navigate('/loans')} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors">
        <ArrowLeft size={16} /> Back to Applications
      </button>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-foreground">{loan.id}</h1>
            <LoanStatusBadge status={loan.status as any} />
          </div>
          <p className="text-sm text-muted-foreground mt-1">{loan.applicant_name} • {(loan as any).maker_name || loan.car_make} {(loan as any).model_variant_name || loan.car_model}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => exportLoanPDF(loan)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-card text-sm font-medium text-foreground hover:bg-accent/10 hover:border-accent transition-colors"
          >
            <Printer size={16} className="text-accent" />
            Export PDF
          </button>
          <button
            onClick={() => shareLoanPDF(loan)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-card text-sm font-medium text-foreground hover:bg-green-500/10 hover:border-green-500 transition-colors"
          >
            <MessageCircle size={16} className="text-green-500" />
            WhatsApp
          </button>
          <button
            onClick={() => {
              const subject = `Loan Application - ${loan.id} | ${loan.applicant_name}`;
              const body = `Mehar Finance - Loan Application Details\n\nApplication ID: ${loan.id}\nApplicant: ${loan.applicant_name}\nMobile: ${loan.mobile}\nVehicle: ${(loan as any).maker_name || loan.car_make || ''} ${(loan as any).model_variant_name || loan.car_model || ''}\nLoan Amount: ${formatCurrency(Number(loan.loan_amount))}\nStatus: ${loan.status}\nEMI: ${formatCurrency(Number((loan as any).emi_amount || loan.emi || 0))}\nTenure: ${loan.tenure} months\n\nGenerated by Mehar Finance`;
              window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, '_self');
            }}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-card text-sm font-medium text-foreground hover:bg-blue-500/10 hover:border-blue-500 transition-colors"
          >
            <Mail size={16} className="text-blue-500" />
            Email
          </button>
          {(user?.role === 'admin' || user?.role === 'super_admin' || user?.role === 'manager') && (
            <select
              value={loan.status}
              onChange={e => updateStatus.mutate(e.target.value)}
              disabled={updateStatus.isPending}
              className="px-3 py-2 rounded-lg border border-border bg-card text-sm font-medium text-foreground focus:outline-none focus:border-accent"
            >
              {LOAN_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          )}
        </div>
      </div>

      {/* Status Pipeline */}
      <div className="stat-card mb-6 overflow-x-auto">
        <h3 className="font-semibold text-foreground mb-4">Status Pipeline</h3>
        <div className="flex items-center gap-1 min-w-max">
          {LOAN_STATUSES.filter(s => s.value !== 'cancelled').map((s, i) => {
            const isActive = i <= currentIdx && loan.status !== 'rejected' && loan.status !== 'cancelled';
            const isCurrent = s.value === loan.status;
            return (
              <div key={s.value} className="flex items-center gap-1">
                <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${isCurrent ? 'bg-accent text-accent-foreground' : isActive ? 'bg-accent/10 text-accent' : 'bg-muted text-muted-foreground'}`}>
                  <div className={`w-2 h-2 rounded-full ${isCurrent ? 'bg-accent-foreground' : isActive ? 'bg-accent' : 'bg-muted-foreground/40'}`} />
                  {s.label}
                </div>
                {i < LOAN_STATUSES.length - 2 && (
                  <div className={`w-6 h-0.5 ${isActive && i < currentIdx ? 'bg-accent' : 'bg-border'}`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <Section title="Applicant Details" icon={<User size={18} />}>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Customer ID" value={(loan as any).customer_id} />
            <Field label="Loan Number" value={(loan as any).loan_number} />
            <Field label="Full Name" value={loan.applicant_name} />
            <Field label="Mobile" value={loan.mobile} />
            <Field label="Co-Applicant" value={(loan as any).co_applicant_name || '—'} />
            <Field label="Co-Applicant Mobile" value={(loan as any).co_applicant_mobile || '—'} />
            <Field label="Guarantor" value={(loan as any).guarantor_name || '—'} />
            <Field label="Guarantor Mobile" value={(loan as any).guarantor_mobile || '—'} />
            <div className="col-span-2"><Field label="Current Address" value={(loan as any).current_address || loan.address || ''} /></div>
            <Field label="Village" value={(loan as any).current_village || ''} />
            <Field label="District" value={(loan as any).current_district || ''} />
          </div>
        </Section>

        <Section title="Vehicle Details" icon={<Car size={18} />}>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Registration No" value={(loan as any).vehicle_number || ''} />
            <Field label="Maker" value={(loan as any).maker_name || loan.car_make || ''} />
            <Field label="Model/Variant" value={(loan as any).model_variant_name || loan.car_model || ''} />
            <Field label="Mfg Year" value={(loan as any).mfg_year || ''} />
            <Field label="Vertical" value={(loan as any).vertical || ''} />
            <Field label="Scheme" value={(loan as any).scheme || ''} />
          </div>
        </Section>

        <Section title="Loan & EMI Details" icon={<IndianRupee size={18} />}>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Loan Amount" value={formatCurrency(Number(loan.loan_amount))} />
            <Field label="Grid" value={formatCurrency(Number((loan as any).grid || 0))} />
            <Field label="LTV" value={(loan as any).ltv ? `${(loan as any).ltv}%` : '—'} />
            <Field label="IRR" value={(loan as any).irr ? `${(loan as any).irr}%` : `${loan.interest_rate}%`} />
            <Field label="Tenure" value={`${loan.tenure} months`} />
            <Field label="EMI Mode" value={(loan as any).emi_mode || 'Monthly'} />
            <Field label="Monthly EMI" value={formatCurrency(Number((loan as any).emi_amount || loan.emi))} />
            <Field label="Total EMI" value={(loan as any).total_emi || loan.tenure} />
            <Field label="Total Interest" value={formatCurrency(Number((loan as any).total_interest || 0))} />
            <Field label="First EMI Date" value={(loan as any).first_installment_due_date ? new Date((loan as any).first_installment_due_date).toLocaleDateString('en-IN') : '—'} />
          </div>
        </Section>

        <Section title="Financier & Insurance" icon={<Building2 size={18} />}>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Assigned Bank" value={(loan as any).banks?.name || '—'} />
            <Field label="Financier Executive" value={(loan as any).financier_executive_name || '—'} />
            <Field label="Branch" value={(loan as any).disburse_branch_name || '—'} />
            <Field label="Branch Manager" value={(loan as any).branch_manager_name || '—'} />
            <Field label="Assigned Broker" value={(loan as any).brokers?.name || '—'} />
            <Field label="Insurance Company" value={(loan as any).insurance_company_name || '—'} />
            <Field label="IDV" value={(loan as any).idv ? formatCurrency(Number((loan as any).idv)) : '—'} />
            <Field label="Premium" value={(loan as any).premium_amount ? formatCurrency(Number((loan as any).premium_amount)) : '—'} />
          </div>
        </Section>

        <Section title="Income & Agriculture" icon={<IndianRupee size={18} />}>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Income Source" value={(loan as any).income_source || '—'} />
            <Field label="Monthly Income" value={(loan as any).monthly_income ? formatCurrency(Number((loan as any).monthly_income)) : '—'} />
            <Field label="NIP/IP" value={(loan as any).nip_ip || '—'} />
            <Field label="Agriculture" value={(loan as any).agriculture || '—'} />
          </div>
        </Section>

        <Section title="RTO Details" icon={<FileText size={18} />}>
          <div className="grid grid-cols-2 gap-4">
            <Field label="RC Owner" value={(loan as any).rc_owner_name || '—'} />
            <Field label="RC Mfg Date" value={(loan as any).rc_mfg_date || '—'} />
            <Field label="HPN at Login" value={(loan as any).hpn_at_login || '—'} />
            <Field label="New Financier" value={(loan as any).new_financier || '—'} />
            <Field label="RTO Agent" value={(loan as any).rto_agent_name || '—'} />
            <Field label="Agent Mobile" value={(loan as any).agent_mobile_no || '—'} />
            <Field label="DTO Location" value={(loan as any).dto_location || '—'} />
            <Field label="Challan" value={(loan as any).challan || '—'} />
          </div>
        </Section>

        <Section title="Deductions & Disbursement" icon={<IndianRupee size={18} />}>
          <div className="grid grid-cols-2 gap-4">
            <Field label="File Charge" value={(loan as any).file_charge ? formatCurrency(Number((loan as any).file_charge)) : '—'} />
            <Field label="Loan Suraksha" value={(loan as any).loan_suraksha ? formatCurrency(Number((loan as any).loan_suraksha)) : '—'} />
            <Field label="Stamping" value={(loan as any).stamping ? formatCurrency(Number((loan as any).stamping)) : '—'} />
            <Field label="Total Deduction" value={(loan as any).total_deduction ? formatCurrency(Number((loan as any).total_deduction)) : '—'} />
            <Field label="Net Disbursement" value={(loan as any).net_disbursement_amount ? formatCurrency(Number((loan as any).net_disbursement_amount)) : '—'} />
            <Field label="Payment Received" value={(loan as any).payment_received_date ? new Date((loan as any).payment_received_date).toLocaleDateString('en-IN') : '—'} />
          </div>
        </Section>

        <Section title="Important Dates" icon={<Building2 size={18} />}>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Login Date" value={(loan as any).login_date ? new Date((loan as any).login_date).toLocaleDateString('en-IN') : '—'} />
            <Field label="Approval Date" value={(loan as any).approval_date ? new Date((loan as any).approval_date).toLocaleDateString('en-IN') : '—'} />
            <Field label="Disburse Date" value={(loan as any).financier_disburse_date ? new Date((loan as any).financier_disburse_date).toLocaleDateString('en-IN') : '—'} />
            <Field label="TAT" value={(loan as any).tat ? `${(loan as any).tat} days` : '—'} />
            <Field label="Booking Mode" value={(loan as any).booking_mode || '—'} />
            <Field label="File Stage" value={(loan as any).file_stage || '—'} />
            <Field label="Created" value={new Date(loan.created_at).toLocaleDateString('en-IN')} />
            <Field label="Last Updated" value={new Date(loan.updated_at).toLocaleDateString('en-IN')} />
          </div>
        </Section>
      </div>

      {/* Documents Section (Read-only) */}
      <div className="stat-card">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-accent"><FileText size={18} /></span>
          <h3 className="font-semibold text-foreground">Loan Documents</h3>
          <span className="ml-auto text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{(documents as any[]).length} files</span>
        </div>

        {/* Inline Preview */}
        {previewDoc && (
          <div className="mb-4 rounded-xl border border-border overflow-hidden bg-background">
            <div className="flex items-center justify-between px-3 py-2 bg-muted/60 border-b border-border">
              <p className="text-sm font-medium text-foreground truncate">{previewDoc.name}</p>
              <button onClick={() => setPreviewDoc(null)} className="p-1 rounded hover:bg-accent/10 text-muted-foreground hover:text-foreground transition-colors">
                <X size={16} />
              </button>
            </div>
            <iframe
              src={previewDoc.url}
              className="w-full border-0"
              style={{ height: '60vh', minHeight: '300px' }}
              title={previewDoc.name}
            />
          </div>
        )}

        {/* Document list */}
        {(documents as any[]).length > 0 && (
          <div className="grid gap-2">
            {(documents as any[]).map((doc: any) => (
              <div key={doc.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/40">
                <FileText size={16} className="text-accent shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{doc.file_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {DOC_TYPES.find(d => d.value === doc.document_type)?.label} •{' '}
                    {new Date(doc.created_at).toLocaleDateString('en-IN')}
                    {doc.file_size && ` • ${(doc.file_size / 1024).toFixed(0)} KB`}
                  </p>
                </div>
                <button
                  onClick={() => previewDocument(doc)}
                  disabled={loadingPreview === doc.id}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-accent/10 hover:bg-accent/20 text-accent transition-colors text-xs font-medium disabled:opacity-50"
                  title="Preview"
                >
                  <Eye size={14} /> {loadingPreview === doc.id ? 'Loading…' : 'View'}
                </button>
              </div>
            ))}
          </div>
        )}
        {(documents as any[]).length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">No documents available.</p>
        )}
      </div>
    </div>
  );
}
