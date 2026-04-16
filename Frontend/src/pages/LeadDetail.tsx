import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/api';
import { ArrowLeft, User, Car, IndianRupee, ArrowRight, FileText, Download, ExternalLink, Upload, RefreshCw, X, ShieldCheck, Calendar, Clock } from 'lucide-react';
import { formatCurrency, getFileUrl } from '@/lib/utils';
import { CreditScoreGauge } from '@/components/CreditScoreGauge';
import { format } from 'date-fns';
import { getRolePermissions } from '@/lib/permissions';
import { toast } from 'sonner';
import { FetchCreditModal } from '@/components/FetchCreditModal';

const DOC_TYPES = [
  { id: 'rc_front', label: 'RC Front' },
  { id: 'rc_back', label: 'RC Back' },
  { id: 'aadhar_front', label: 'Aadhaar Front' },
  { id: 'aadhar_back', label: 'Aadhaar Back' },
  { id: 'pan_card', label: 'PAN Card' }
];

export default function LeadDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const permissions = user?.role ? getRolePermissions(user.role) : null;
  const role = user?.role;
  const normalizedRole = role?.toLowerCase();
  const allowedDocRoles = ['broker', 'manager', 'admin', 'super_admin', 'employee', 'sales', 'rbm', 'pdd_manager'];
  const canViewLeadDocuments = normalizedRole && allowedDocRoles.includes(normalizedRole);
  const canUploadLeadDocuments = role === 'broker';
  const [isReuploading, setIsReuploading] = useState(false);
  const [files, setFiles] = useState<Record<string, File | null>>({});
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isFetchModalOpen, setIsFetchModalOpen] = useState(false);

  const isImage = (url: string) => {
    return /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(url);
  };

  const { data: lead, isLoading } = useQuery({
    queryKey: ['lead', id],
    queryFn: async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/leads/${id}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
          }
        });
        if (!response.ok) throw new Error('Lead not found');
        return await response.json();
      } catch (error) {
        throw error;
      }
    },
    enabled: !!id,
  });

  const { data: documents = [] } = useQuery({
    queryKey: ['lead-documents', id],
    queryFn: async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/leads/${id}/documents`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
          }
        });
        if (!response.ok) return [];
        return await response.json();
      } catch {
        return [];
      }
    },
    enabled: !!id && canViewLeadDocuments,
  });
  
  const { data: creditReports = [], refetch: refetchCredit } = useQuery({
    queryKey: ['lead-credit-reports', id],
    queryFn: async () => {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/credit-reports/lead/${id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data) ? data : (data.data || []);
    },
    enabled: !!id && user?.role === 'super_admin',
  });

  const latestReport = creditReports[0];

  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/leads/${id}/documents/multiple`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: formData
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Upload failed');
      }
      return response.json();
    },
    onSuccess: () => {
      toast.success('Documents uploaded successfully');
      setIsReuploading(false);
      setFiles({});
      queryClient.invalidateQueries({ queryKey: ['lead', id] });
      queryClient.invalidateQueries({ queryKey: ['lead-documents', id] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });

  if (isLoading) return <div className="py-20 text-center text-muted-foreground">Loading…</div>;

  if (!lead) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Lead not found</p>
        <button onClick={() => navigate('/leads-list')} className="mt-4 text-accent hover:underline text-sm">← Back to leads</button>
      </div>
    );
  }

  const handleFileChange = (type: string, file: File | null) => {
    setFiles(prev => ({ ...prev, [type]: file }));
  };

  const handleUpload = () => {
    const formData = new FormData();
    let hasFiles = false;
    Object.entries(files).forEach(([type, file]) => {
      if (file) {
        formData.append(type, file);
        hasFiles = true;
      }
    });

    if (!hasFiles) {
      toast.error('Please select at least one file');
      return;
    }

    uploadMutation.mutate(formData);
  };


  const Field = ({ label, value }: { label: string; value: string }) => (
    <div>
      <p className="text-[11px] text-muted-foreground mb-0.5">{label}</p>
      <p className="text-sm font-medium text-foreground">{value || '—'}</p>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto px-4 pb-24">
      {previewImage && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 animate-in fade-in duration-200"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-5xl max-h-[90vh] overflow-hidden rounded-lg shadow-2xl bg-background flex items-center justify-center p-2" onClick={e => e.stopPropagation()}>
            <img src={previewImage} alt="Preview" className="max-w-full max-h-[85vh] object-contain rounded" />
            <button 
              onClick={() => setPreviewImage(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>
      )}

      <button onClick={() => navigate('/leads-list')} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors">
        <ArrowLeft size={16} /> Back to Leads
      </button>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">{lead.customer_id}</h1>
            {lead.converted_to_loan ? (
              <span className="text-xs px-2 py-1 rounded bg-green-100 text-green-700">Converted</span>
            ) : (
              <span className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-700">Active</span>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-1">{lead.customer_name}</p>
        </div>
        <div className="flex gap-2">
          {canUploadLeadDocuments && lead.reupload_count === 0 && !isReuploading && (
            <button
              onClick={() => setIsReuploading(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-muted text-muted-foreground text-sm font-medium hover:bg-muted/80 transition-colors"
            >
              <RefreshCw size={16} />
              Re-upload Documents
            </button>
          )}
          {!lead.converted_to_loan && permissions?.canCreateLoan && (
            <button
              onClick={() => navigate(`/loans/new?leadId=${lead.id}`)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent text-accent-foreground text-sm font-medium hover:opacity-90 transition-opacity"
            >
              <ArrowRight size={16} />
              Convert to Loan
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Re-upload UI */}
        {canUploadLeadDocuments && isReuploading && (
          <div className="stat-card lg:col-span-2 border-accent/50 bg-accent/5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Upload size={18} className="text-accent" />
                <h3 className="text-sm font-bold text-foreground">Re-upload Documents (One-time only)</h3>
              </div>
              <button 
                onClick={() => setIsReuploading(false)}
                className="p-1 hover:bg-muted rounded-full"
              >
                <X size={18} />
              </button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-6">
              {DOC_TYPES.map((doc) => (
                <div key={doc.id} className="space-y-1.5">
                  <label className="text-[11px] font-medium text-muted-foreground">{doc.label}</label>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => handleFileChange(doc.id, e.target.files?.[0] || null)}
                    className="w-full text-[11px] file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-[11px] file:font-semibold file:bg-accent/10 file:text-accent hover:file:bg-accent/20 cursor-pointer"
                  />
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setIsReuploading(false)}
                className="px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors"
                disabled={uploadMutation.isPending}
              >
                Cancel
              </button>
              <button
                onClick={handleUpload}
                disabled={uploadMutation.isPending}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent text-accent-foreground text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {uploadMutation.isPending ? 'Uploading...' : 'Confirm Re-upload'}
              </button>
            </div>
          </div>
        )}

        <div className="stat-card">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-accent"><User size={18} /></span>
            <h3 className="text-sm font-semibold text-foreground">Customer Details</h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Customer ID" value={lead.customer_id} />
            <Field label="Customer Name" value={lead.customer_name} />
            <Field label="Phone Number" value={lead.phone} />
            <Field label="PAN Number" value={lead.pan_number} />
            <Field label="Aadhaar Number" value={lead.aadhar_number} />
            <Field label="Gender" value={lead.gender || '—'} />
            <Field label="District" value={lead.district} />
            {user?.role !== 'broker' && (
              <>
                <Field label="Tehsil" value={lead.tehsil} />
                <Field label="Pin Code" value={lead.pin_code} />
                <div className="col-span-2"><Field label="Address" value={lead.address} /></div>
              </>
            )}
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-accent"><Car size={18} /></span>
            <h3 className="text-sm font-semibold text-foreground">Vehicle Details</h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Vehicle Number" value={lead.loan_vehicle_number || lead.vehicle_no} />
            {lead.maker_name && <Field label="Maker Name" value={lead.maker_name} />}
            {lead.model_variant_name && <Field label="Model Variant" value={lead.model_variant_name} />}
            {lead.mfg_year && <Field label="Mfg Year" value={lead.mfg_year} />}
            {lead.chassis_number && <Field label="Chassis Number" value={lead.chassis_number} />}
            {lead.engine_number && <Field label="Engine Number" value={lead.engine_number} />}
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-accent"><IndianRupee size={18} /></span>
            <h3 className="text-sm font-semibold text-foreground">Loan Details</h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {lead.converted_loan_number && (
              <div className="col-span-2 mb-1 p-2 rounded bg-accent/10 border border-accent/20">
                <p className="text-[10px] text-accent font-bold uppercase">Linked Loan Application</p>
                <div className="flex items-center justify-between mt-1">
                  <button 
                    onClick={() => navigate(`/loans/${lead.loan_id}`)}
                    className="text-sm font-bold text-foreground hover:text-accent transition-colors flex items-center gap-1"
                  >
                    {lead.converted_loan_number} <ExternalLink size={12} />
                  </button>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-foreground/10 text-foreground uppercase font-bold">
                    {lead.loan_status?.replace(/_/g, ' ')}
                  </span>
                </div>
              </div>
            )}
            <Field label="Loan Amount Required" value={lead.loan_amount_required ? formatCurrency(Number(lead.loan_amount_required)) : '—'} />
            {lead.approved_loan_amount && <Field label="Approved Loan Amount" value={formatCurrency(Number(lead.approved_loan_amount))} />}
            <Field label="Financier Name" value={lead.financier_name} />
            {user?.role !== 'broker' && (
              <>
                <Field label="IRR Requested" value={lead.irr_requested ? `${lead.irr_requested}%` : '—'} />
                {(lead.branch_manager_name || lead.manager_name) && (
                  <Field label="Branch Manager" value={lead.branch_manager_name || lead.manager_name} />
                )}
                {(lead.creator_role === 'broker' || lead.referred_by_name) && (
                  <Field label="Referred By" value={lead.referred_by_name || (lead.creator_role === 'broker' ? lead.sourcing_person_name : '')} />
                )}
              </>
            )}
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-accent"><User size={18} /></span>
            <h3 className="text-sm font-semibold text-foreground">Other Details</h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Our Branch" value={lead.our_branch} />
            {user?.role !== 'broker' && <Field label="Sourcing Person" value={lead.sourcing_person_name} />}
            {user?.role !== 'broker' && <Field label="Lead Creator" value={lead.creator_name} />}
            <Field label="Created" value={new Date(lead.created_at).toLocaleDateString('en-IN')} />
            <Field label="Last Updated" value={new Date(lead.updated_at).toLocaleDateString('en-IN')} />
          </div>
        </div>

        {/* Credit Score Section (Superadmin Only) */}
        {user?.role === 'super_admin' && (
          <div className="stat-card lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <span className="text-accent">
                  <ShieldCheck size={18} />
                </span>
                <h3 className="text-sm font-semibold text-foreground">Credit Report Analysis</h3>
              </div>
              <button
                onClick={() => setIsFetchModalOpen(true)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-accent/10 text-accent text-xs font-bold hover:bg-accent/20 transition-colors"
              >
                <RefreshCw size={14} /> Fetch New Report
              </button>
            </div>

            {latestReport ? (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
                <div className="md:col-span-12">
                   <div className="flex flex-col md:flex-row gap-8 items-center bg-white/50 p-6 rounded-2xl border border-slate-100 shadow-sm">
                      <div className="flex-shrink-0">
                        <CreditScoreGauge 
                          score={latestReport.score} 
                          size="lg" 
                          className="scale-90 md:scale-100"
                        />
                      </div>
                      <div className="flex-1 space-y-4">
                        <div>
                          <h3 className="text-xl font-black text-slate-900 leading-tight">Latest Analysis</h3>
                          <p className="text-slate-500 text-sm font-medium">
                            Last report fetched on {format(new Date(latestReport.created_at), 'dd MMM yyyy')}
                          </p>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Provider</p>
                            <p className="text-sm font-bold text-slate-900">{latestReport.provider}</p>
                          </div>
                          <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status</p>
                            <p className="text-sm font-bold text-green-600">GOOD</p>
                          </div>
                        </div>

                        {latestReport.report_link && (
                          <a 
                            href={getFileUrl(latestReport.report_link)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-2 w-full py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg active:scale-95"
                          >
                            <ExternalLink size={18} /> View Full Report PDF
                          </a>
                        )}
                      </div>
                   </div>
                </div>

                {/* History Table */}
                <div className="md:col-span-12 mt-4">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Credit History</h4>
                  <div className="overflow-hidden rounded-xl border border-slate-100 bg-white/50">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-slate-50/50 border-b border-slate-100">
                          <th className="text-left py-3 px-4 font-bold text-slate-500">Date</th>
                          <th className="text-left py-3 px-4 font-bold text-slate-500">Provider</th>
                          <th className="text-center py-3 px-4 font-bold text-slate-500">Score</th>
                          <th className="text-right py-3 px-4 font-bold text-slate-500">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100/50">
                        {creditReports.map((report: any) => (
                          <tr key={report.id} className="hover:bg-white transition-colors">
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2 text-slate-600">
                                <Calendar size={14} className="text-slate-400" />
                                {format(new Date(report.created_at), 'dd MMM yyyy')}
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <span className="font-bold text-slate-900">{report.provider}</span>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span className="px-2 py-1 rounded bg-slate-900 text-white text-[10px] font-black">
                                {report.score || '—'}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right">
                              {report.report_link && (
                                <a 
                                  href={getFileUrl(report.report_link)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-accent hover:underline font-bold text-xs flex items-center justify-end gap-1"
                                >
                                  View <ExternalLink size={12} />
                                </a>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-12 flex flex-col items-center justify-center bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-200">
                <div className="p-4 rounded-full bg-white shadow-sm mb-4">
                  <ShieldCheck size={32} className="text-slate-300" />
                </div>
                <p className="text-slate-500 font-medium">No credit reports found for this lead</p>
                <p className="text-[10px] text-slate-400 uppercase font-bold mt-1">Initiate a fetch to see analysis</p>
              </div>
            )}
          </div>
        )}

        {/* Documents Section */}
        {canViewLeadDocuments ? (
          <div className="stat-card lg:col-span-2 mt-4">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-accent"><FileText size={18} /></span>
              <h3 className="text-sm font-semibold text-foreground">Uploaded Documents</h3>
            </div>
            
            {documents.length === 0 ? (
              <div className="py-8 text-center border-2 border-dashed border-border rounded-lg">
                <p className="text-sm text-muted-foreground">No documents uploaded for this lead</p>
                {!canUploadLeadDocuments && (
                  <p className="text-xs text-muted-foreground mt-1">Uploads are available to broker users only.</p>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {documents.map((doc: any) => {
                const baseUrl = import.meta.env.VITE_API_URL || (window.location.protocol + '//' + window.location.hostname + ':5000');
                const fileUrl = `${baseUrl}${doc.file_url.startsWith('/') ? '' : '/'}${doc.file_url}`;
                const isImg = isImage(doc.file_url);

                return (
                  <div key={doc.id} className="flex flex-col p-3 rounded-lg border border-border bg-card/50 hover:bg-muted/30 transition-colors group">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <div className="w-8 h-8 rounded bg-accent/10 flex items-center justify-center flex-shrink-0">
                          <FileText size={16} className="text-accent" />
                        </div>
                        <div className="overflow-hidden">
                          <div className="flex items-center gap-2">
                            <p className="text-[11px] font-bold text-foreground truncate uppercase">{doc.document_type.replace(/_/g, ' ')}</p>
                            {doc.is_reuploaded && (
                              <span className="text-[7px] px-1 py-0.5 rounded-full bg-accent/20 text-accent font-bold uppercase tracking-wider">New</span>
                            )}
                          </div>
                          <p className="text-[9px] text-muted-foreground italic truncate">{new Date(doc.created_at).toLocaleString('en-IN')}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <a 
                          href={fileUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="p-1 px-2 rounded hover:bg-accent/10 text-accent text-[10px] font-medium transition-colors border border-accent/20 flex items-center gap-1"
                        >
                          <ExternalLink size={10} /> View
                        </a>
                        <a 
                          href={fileUrl} 
                          download 
                          className="p-1 px-2 rounded bg-accent text-accent-foreground text-[10px] font-medium transition-opacity hover:opacity-90 flex items-center gap-1"
                        >
                          <Download size={10} /> Save
                        </a>
                      </div>
                    </div>
                    
                    {isImg ? (
                      <div 
                        className="relative aspect-video rounded overflow-hidden bg-muted/50 cursor-pointer group/img"
                        onClick={() => setPreviewImage(fileUrl)}
                      >
                        <img 
                          src={fileUrl} 
                          alt={doc.document_type} 
                          className="w-full h-full object-cover transition-transform duration-300 group-hover/img:scale-105"
                        />
                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                          <span className="text-white text-[10px] font-medium bg-black/40 px-2 py-1 rounded">Click to expand</span>
                        </div>
                      </div>
                    ) : (
                      <div className="aspect-video rounded bg-muted/30 flex flex-col items-center justify-center gap-2 border border-dashed border-border">
                        <FileText size={24} className="text-muted-foreground/30" />
                        <p className="text-[10px] text-muted-foreground uppercase font-semibold">{doc.file_name.split('.').pop()} File</p>
                        <p className="text-[9px] text-muted-foreground truncate max-w-[150px]">{doc.file_name}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <div className="stat-card lg:col-span-2 mt-4">
          <div className="py-8 text-center border-2 border-dashed border-border rounded-lg">
            <p className="text-sm text-muted-foreground">You don’t have permission to view lead documents.</p>
          </div>
        </div>
      )}
      </div>
      
      {isFetchModalOpen && (
        <FetchCreditModal
          isOpen={isFetchModalOpen}
          onClose={() => setIsFetchModalOpen(false)}
          onSuccess={() => refetchCredit()}
          initialData={{
            lead_id: lead.id,
            name: lead.customer_name,
            mobile: lead.phone,
            pan: lead.pan_number || '',
            aadhaar: lead.aadhar_number || '',
            gender: lead.gender || 'male'
          }}
        />
      )}
    </div>
  );
}
