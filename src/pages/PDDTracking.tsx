import { CheckCircle2, Clock, AlertTriangle, Edit2, FileText } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { formatCurrency } from '@/lib/mock-data';

const statusIcon = (status: string) => {
  if (status === 'completed') return <CheckCircle2 size={16} className="text-success" />;
  if (status === 'overdue') return <AlertTriangle size={16} className="text-destructive" />;
  return <Clock size={16} className="text-warning" />;
};

export default function PDDTracking() {
  const navigate = useNavigate();
  const { data: loans = [], isLoading } = useQuery({
    queryKey: ['pdd-loans'],
    queryFn: async () => {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/loans?status=disbursed`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
      });
      if (!response.ok) return [];
      return await response.json();
    },
  });

  if (isLoading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground mb-1">PDD Tracking</h1>
      <p className="text-sm text-muted-foreground mb-6">Post Disbursement Documents & RTO Status</p>

      <div className="space-y-4">
        {loans.length === 0 ? (
          <div className="stat-card text-center py-8 text-muted-foreground">
            No disbursed loans found
          </div>
        ) : (
          loans.map((loan: any) => {
            return (
              <div key={loan.id} className="stat-card">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <span className="mono text-xs text-accent font-medium">{loan.loan_number}</span>
                    <p className="font-medium text-foreground">{loan.applicant_name}</p>
                    <p className="text-xs text-muted-foreground">{loan.vehicle_number || '—'} • {loan.maker_name} {loan.model_variant_name}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => navigate(`/loans/${loan.id}`)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card text-xs font-medium text-foreground hover:bg-accent/10 hover:border-accent transition-colors"
                    >
                      <FileText size={14} />
                      View Details
                    </button>
                    <button
                      onClick={() => navigate(`/loans/${loan.id}/edit`)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card text-xs font-medium text-foreground hover:bg-accent/10 hover:border-accent transition-colors"
                    >
                      <Edit2 size={14} />
                      Edit PDD
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Payment & Finance Details */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <div className="w-1 h-4 bg-accent rounded-full" />
                      Payment & Finance Details
                    </h3>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <p className="text-muted-foreground mb-0.5">Payment Received Date</p>
                        <p className="font-medium text-foreground">{loan.payment_received_date ? new Date(loan.payment_received_date).toLocaleDateString('en-IN') : '—'}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground mb-0.5">Financier in M-Parivahan</p>
                        <p className="font-medium text-foreground">{loan.financier_m_parivahan || '—'}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground mb-0.5">Balance Payment Status</p>
                        <p className="font-medium text-foreground">{loan.balance_payment_status || '—'}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground mb-0.5">PDD Update at Finance Co.</p>
                        <p className="font-medium text-foreground">{loan.pdd_update_finance_company || '—'}</p>
                      </div>
                    </div>
                  </div>

                  {/* FC Details */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <div className="w-1 h-4 bg-accent rounded-full" />
                      FC (Form C) Details
                    </h3>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <p className="text-muted-foreground mb-0.5">FC Deposited By</p>
                        <p className="font-medium text-foreground">{loan.fc_deposited_by || '—'}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground mb-0.5">FC Deposit Date</p>
                        <p className="font-medium text-foreground">{loan.fc_deposit_date ? new Date(loan.fc_deposit_date).toLocaleDateString('en-IN') : '—'}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground mb-0.5">FC Receipt</p>
                        <p className="font-medium text-foreground">{loan.fc_receipt || '—'}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground mb-0.5">Zero Statement</p>
                        <p className="font-medium text-foreground">{loan.zero_statement || '—'}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground mb-0.5">Current Status of FC</p>
                        <p className="font-medium text-foreground">{loan.current_fc_status || '—'}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground mb-0.5">Prev. Financier Account Status</p>
                        <p className="font-medium text-foreground">{loan.prev_financier_account_status || '—'}</p>
                      </div>
                    </div>
                  </div>

                  {/* NOC Details */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <div className="w-1 h-4 bg-accent rounded-full" />
                      NOC Details
                    </h3>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <p className="text-muted-foreground mb-0.5">NOC Status</p>
                        <p className="font-medium text-foreground">{loan.noc_status || '—'}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground mb-0.5">Who Checked NOC Status</p>
                        <p className="font-medium text-foreground">{loan.noc_checked_by || '—'}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground mb-0.5">Previous DTO NOC</p>
                        <p className="font-medium text-foreground">{loan.previous_dto_noc || '—'}</p>
                      </div>
                    </div>
                  </div>

                  {/* RTO Details */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <div className="w-1 h-4 bg-accent rounded-full" />
                      RTO Details
                    </h3>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <p className="text-muted-foreground mb-0.5">RTO Paper Details</p>
                        <p className="font-medium text-foreground">{loan.rto_paper_details || '—'}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground mb-0.5">Pending RTO Documents</p>
                        <p className="font-medium text-foreground">{loan.pending_rto_documents || '—'}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground mb-0.5">Where Are RTO Docs</p>
                        <p className="font-medium text-foreground">{loan.rto_docs_location || '—'}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground mb-0.5">RTO Work Description</p>
                        <p className="font-medium text-foreground">{loan.rto_work_description || '—'}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground mb-0.5">RTO Work Status</p>
                        <p className="font-medium text-foreground">{loan.rto_work_status || '—'}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground mb-0.5">DTO Location</p>
                        <p className="font-medium text-foreground">{loan.dto_location || '—'}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground mb-0.5">RTO Agent Name</p>
                        <p className="font-medium text-foreground">{loan.rto_agent_name || '—'}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground mb-0.5">RTO Agent Mobile</p>
                        <p className="font-medium text-foreground">{loan.rto_agent_mobile || '—'}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground mb-0.5">RTO Mail</p>
                        <p className="font-medium text-foreground">{loan.rto_mail || '—'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Vehicle Checks */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <div className="w-1 h-4 bg-accent rounded-full" />
                      Vehicle Checks
                    </h3>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <p className="text-muted-foreground mb-0.5">Pollution</p>
                        <p className="font-medium text-foreground">{loan.pollution_status || '—'}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground mb-0.5">Insurance</p>
                        <p className="font-medium text-foreground">{loan.insurance_status || '—'}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground mb-0.5">Vehicle Check</p>
                        <p className="font-medium text-foreground">{loan.vehicle_check_status || '—'}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground mb-0.5">Insurance Endorsement</p>
                        <p className="font-medium text-foreground">{loan.insurance_endorsement || '—'}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground mb-0.5">Challan</p>
                        <p className="font-medium text-foreground">{loan.challan_status || '—'}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground mb-0.5">Police Case</p>
                        <p className="font-medium text-foreground">{loan.police_case_status || '—'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Timeline */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <div className="w-1 h-4 bg-accent rounded-full" />
                      Timeline
                    </h3>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <p className="text-muted-foreground mb-0.5">Commitment Date</p>
                        <p className="font-medium text-foreground">{loan.commitment_date ? new Date(loan.commitment_date).toLocaleDateString('en-IN') : '—'}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground mb-0.5">Delay Days</p>
                        <p className="font-medium text-foreground">{loan.delay_days || '0'} days</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
