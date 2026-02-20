import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { formatCurrency, LOAN_STATUSES } from '@/lib/mock-data';
import LoanStatusBadge from '@/components/LoanStatusBadge';
import { ArrowLeft, User, Car, IndianRupee, Building2, Upload, FileText, Trash2, Download } from 'lucide-react';
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
  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);

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

  const handleFileUpload = async (docType: string, file: File) => {
    if (!user || !id) return;
    setUploadingDoc(docType);
    try {
      const ext = file.name.split('.').pop();
      const path = `${user.id}/${id}/${docType}-${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('loan-documents')
        .upload(path, file);
      if (uploadError) throw uploadError;

      const { error: dbError } = await supabase.from('loan_documents').insert([{
        loan_id: id,
        document_type: docType as any,
        file_name: file.name,
        storage_path: path,
        file_size: file.size,
        uploaded_by: user.id,
      }] as any);
      if (dbError) throw dbError;

      refetchDocs();
      toast.success(`${file.name} uploaded successfully`);
    } catch (err: any) {
      toast.error(err.message || 'Upload failed');
    } finally {
      setUploadingDoc(null);
    }
  };

  const deleteDocument = useMutation({
    mutationFn: async (doc: any) => {
      await supabase.storage.from('loan-documents').remove([doc.storage_path]);
      const { error } = await supabase.from('loan_documents').delete().eq('id', doc.id);
      if (error) throw error;
    },
    onSuccess: () => {
      refetchDocs();
      toast.success('Document deleted');
    },
  });

  const downloadDocument = async (doc: any) => {
    const { data } = await supabase.storage.from('loan-documents').createSignedUrl(doc.storage_path, 60);
    if (data?.signedUrl) window.open(data.signedUrl, '_blank');
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
            <LoanStatusBadge status={loan.status} />
          </div>
          <p className="text-sm text-muted-foreground mt-1">{loan.applicant_name} • {loan.car_make} {loan.car_model}</p>
        </div>
        {/* Status update select */}
        <select
          value={loan.status}
          onChange={e => updateStatus.mutate(e.target.value)}
          disabled={updateStatus.isPending}
          className="px-3 py-2 rounded-lg border border-border bg-card text-sm font-medium text-foreground focus:outline-none focus:border-accent"
        >
          {LOAN_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
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
            <Field label="Full Name" value={loan.applicant_name} />
            <Field label="Mobile" value={loan.mobile} />
            <Field label="PAN" value={loan.pan || ''} />
            <Field label="Aadhaar" value={loan.aadhaar || ''} />
            <div className="col-span-2"><Field label="Address" value={loan.address || ''} /></div>
          </div>
        </Section>

        <Section title="Car Details" icon={<Car size={18} />}>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Make" value={loan.car_make || ''} />
            <Field label="Model" value={loan.car_model || ''} />
            <Field label="Variant" value={loan.car_variant || ''} />
            <Field label="On-Road Price" value={formatCurrency(Number(loan.on_road_price))} />
            <Field label="Dealer" value={loan.dealer_name || ''} />
          </div>
        </Section>

        <Section title="Loan Details" icon={<IndianRupee size={18} />}>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Loan Amount" value={formatCurrency(Number(loan.loan_amount))} />
            <Field label="Down Payment" value={formatCurrency(Number(loan.down_payment))} />
            <Field label="Tenure" value={`${loan.tenure} months`} />
            <Field label="Interest Rate" value={`${loan.interest_rate}%`} />
            <Field label="Monthly EMI" value={formatCurrency(Number(loan.emi))} />
          </div>
        </Section>

        <Section title="Assignment & Dates" icon={<Building2 size={18} />}>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Assigned Bank" value={(loan as any).banks?.name || '—'} />
            <Field label="Assigned Broker" value={(loan as any).brokers?.name || '—'} />
            <Field label="Created" value={new Date(loan.created_at).toLocaleDateString('en-IN')} />
            <Field label="Last Updated" value={new Date(loan.updated_at).toLocaleDateString('en-IN')} />
          </div>
        </Section>
      </div>

      {/* Document Upload Section */}
      <div className="stat-card">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-accent"><FileText size={18} /></span>
          <h3 className="font-semibold text-foreground">Loan Documents</h3>
        </div>

        {/* Upload buttons by doc type */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
          {DOC_TYPES.map(dt => {
            const existingDocs = (documents as any[]).filter((d: any) => d.document_type === dt.value);
            return (
              <div key={dt.value} className="relative">
                <label className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 border-dashed cursor-pointer transition-colors ${uploadingDoc === dt.value ? 'border-accent bg-accent/5' : 'border-border hover:border-accent/50 hover:bg-muted/30'}`}>
                  <Upload size={16} className="text-muted-foreground" />
                  <span className="text-xs font-medium text-foreground text-center">{dt.label}</span>
                  {existingDocs.length > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-accent text-accent-foreground text-[10px] font-bold flex items-center justify-center">
                      {existingDocs.length}
                    </span>
                  )}
                  <input
                    type="file"
                    className="hidden"
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                    disabled={!!uploadingDoc}
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(dt.value, file);
                      e.target.value = '';
                    }}
                  />
                </label>
                {uploadingDoc === dt.value && (
                  <div className="absolute inset-0 flex items-center justify-center bg-background/50 rounded-xl">
                    <span className="text-xs text-accent font-medium">Uploading…</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Uploaded documents list */}
        {(documents as any[]).length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground mb-2">Uploaded Documents</p>
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
                <div className="flex items-center gap-1">
                  <button onClick={() => downloadDocument(doc)} className="p-1.5 rounded-md hover:bg-accent/10 text-muted-foreground hover:text-accent transition-colors" title="Download">
                    <Download size={14} />
                  </button>
                  <button onClick={() => deleteDocument.mutate(doc)} className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors" title="Delete">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        {(documents as any[]).length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">No documents uploaded yet. Click above to upload.</p>
        )}
      </div>
    </div>
  );
}
