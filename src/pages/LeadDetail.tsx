import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/api';
import { ArrowLeft, User, Car, IndianRupee, ArrowRight, FileText, Download, ExternalLink } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { getRolePermissions } from '@/lib/permissions';

export default function LeadDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const permissions = user?.role ? getRolePermissions(user.role) : null;

  const { data: lead, isLoading } = useQuery({
    queryKey: ['lead', id],
    queryFn: async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/leads/${id}`, {
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
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/leads/${id}/documents`, {
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
    enabled: !!id,
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

  const Field = ({ label, value }: { label: string; value: string }) => (
    <div>
      <p className="text-[11px] text-muted-foreground mb-0.5">{label}</p>
      <p className="text-sm font-medium text-foreground">{value || '—'}</p>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto px-4 pb-24">
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-accent"><User size={18} /></span>
            <h3 className="text-sm font-semibold text-foreground">Customer Details</h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Customer ID" value={lead.customer_id} />
            <Field label="Customer Name" value={lead.customer_name} />
            <Field label="Phone Number" value={lead.phone_no} />
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
            <Field label="Vehicle Number" value={lead.vehicle_no} />
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-accent"><IndianRupee size={18} /></span>
            <h3 className="text-sm font-semibold text-foreground">Loan Details</h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Loan Amount Required" value={lead.loan_amount_required ? formatCurrency(Number(lead.loan_amount_required)) : '—'} />
            {user?.role !== 'broker' && <Field label="IRR Requested" value={lead.irr_requested ? `${lead.irr_requested}%` : '—'} />}
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
            <Field label="Created" value={new Date(lead.created_at).toLocaleDateString('en-IN')} />
            <Field label="Last Updated" value={new Date(lead.updated_at).toLocaleDateString('en-IN')} />
          </div>
        </div>

        {/* Documents Section */}
        <div className="stat-card lg:col-span-2 mt-4">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-accent"><FileText size={18} /></span>
            <h3 className="text-sm font-semibold text-foreground">Uploaded Documents</h3>
          </div>
          
          {documents.length === 0 ? (
            <div className="py-8 text-center border-2 border-dashed border-border rounded-lg">
              <p className="text-sm text-muted-foreground">No documents uploaded for this lead</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {documents.map((doc: any) => (
                <div key={doc.id} className="flex items-center justify-between p-3 rounded-lg border border-border bg-card/50 hover:bg-muted/30 transition-colors group">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="w-10 h-10 rounded bg-accent/10 flex items-center justify-center flex-shrink-0">
                      <FileText size={20} className="text-accent" />
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-xs font-semibold text-foreground truncate uppercase">{doc.document_type.replace(/_/g, ' ')}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{doc.document_name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <a 
                      href={`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}${doc.file_url}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="p-1.5 rounded hover:bg-accent/10 text-accent transition-colors"
                      title="View"
                    >
                      <ExternalLink size={14} />
                    </a>
                    <a 
                      href={`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}${doc.file_url}`} 
                      download 
                      className="p-1.5 rounded hover:bg-accent/10 text-accent transition-colors"
                      title="Download"
                    >
                      <Download size={14} />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
