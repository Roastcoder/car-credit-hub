import { CheckCircle2, AlertTriangle, Edit2, FileText, ChevronDown, ChevronUp, List, Plus, ClipboardCheck, Eye } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import PDDForm from '@/components/PDDForm';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { getRolePermissions } from '@/lib/permissions';
import MobilePageSwitcher from '@/components/MobilePageSwitcher';
import { cn } from '@/lib/utils';

const getPddStatusStyles = (status?: string) => {
  if (status === 'approved') {
    return 'bg-green-500/10 text-green-600';
  }
  if (status === 'rejected') {
    return 'bg-red-500/10 text-red-600';
  }
  if (status === 'pending_approval') {
    return 'bg-amber-500/10 text-amber-600';
  }
  return 'bg-muted text-muted-foreground';
};

export default function PDDTracking() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [expandedLoans, setExpandedLoans] = useState<Set<number>>(new Set());
  const [activeTab, setActiveTab] = useState<'pending' | 'completed'>((searchParams.get('tab') as 'pending' | 'completed') || 'pending');

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'pending' || tab === 'completed') {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const handleTabChange = (tab: 'pending' | 'completed') => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };
  const permissions = getRolePermissions(user?.role || 'employee');

  const loanSwitcherOptions = [
    { label: 'Loans List', path: '/loans', icon: <List size={18} /> },
    { label: 'PDD Tracking', path: '/pdd-tracking', icon: <ClipboardCheck size={18} /> },
    ...(permissions.canCreateLoan ? [{ label: 'New Loan', path: '/loans/new', icon: <Plus size={18} /> }] : []),
  ];

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
  const [editingLoanId, setEditingLoanId] = useState<number | null>(null);
  const { data: loans = [], isLoading, refetch } = useQuery({
    queryKey: ['pdd-loans', user?.id, user?.role, user?.branch_id, (user as any)?.managed_branch_ids, activeTab],
    queryFn: async () => {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/loans?status=approved,disbursed`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
      });
      if (!response.ok) return [];
      const rawData = await response.json();
      const data = Array.isArray(rawData) ? rawData : (rawData.data || []);

      let filteredData = data;
      if (user?.role === 'employee') {
        filteredData = data.filter((loan: any) => Number(loan.created_by) === Number(user.id));
      } else if (user?.role === 'manager') {
        const allowedBranchIds = Array.from(new Set([
          ...(((user as any)?.managed_branch_ids || []) as number[]),
          Number(user.branch_id || 0)
        ].filter((branchId) => Number(branchId) > 0)));
        filteredData = data.filter((loan: any) => allowedBranchIds.includes(Number(loan.branch_id)));
      }

      // Apply PDD status filtering for everyone based on active tab
      if (activeTab === 'pending') {
        return filteredData.filter((loan: any) => loan.pdd_status === 'pending_approval' || !loan.pdd_status || loan.pdd_status === 'pending');
      } else {
        return filteredData.filter((loan: any) => loan.pdd_status === 'approved');
      }
    },
    enabled: !!user,
  });
  const canEditPdd = user?.role === 'employee' || user?.role === 'manager' || user?.role === 'pdd_manager';
  const canApprovePdd = user?.role === 'manager' || user?.role === 'admin' || user?.role === 'super_admin' || user?.role === 'pdd_manager';

  const approvePdd = useMutation({
    mutationFn: async (loanIdOrNumber: string | number) => {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/loans/${loanIdOrNumber}/pdd/approve`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || 'Failed to approve PDD');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pdd-loans'] });
      toast.success('PDD approved');
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const rejectPdd = useMutation({
    mutationFn: async ({ loanIdOrNumber, reason }: { loanIdOrNumber: string | number; reason: string }) => {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/loans/${loanIdOrNumber}/pdd/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({ reason })
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || 'Failed to reject PDD');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pdd-loans'] });
      toast.success('PDD rejected');
    },
    onError: (error: Error) => toast.error(error.message),
  });

  if (isLoading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div className="pb-20 lg:pb-0">
      <MobilePageSwitcher options={loanSwitcherOptions} activeLabel="PDD Tracking" />

      <div className="flex flex-col sm:flex-row items-baseline justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground">PDD Tracking</h1>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1 opacity-70">Post Disbursement Documents & RTO Workflow</p>
        </div>

        <div className="flex items-center p-1 bg-muted/50 backdrop-blur-md rounded-xl border border-border shadow-sm">
          <button
            onClick={() => handleTabChange('pending')}
            className={cn(
              "px-6 py-2 rounded-lg text-xs font-black transition-all duration-300",
              activeTab === 'pending' 
                ? "bg-red-500 text-white shadow-lg shadow-red-500/30 scale-105" 
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            PENDING FILES
          </button>
          <button
            onClick={() => handleTabChange('completed')}
            className={cn(
              "px-6 py-2 rounded-lg text-xs font-black transition-all duration-300",
              activeTab === 'completed' 
                ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 scale-105" 
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            COMPLETED FILES
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {loans.length === 0 ? (
          <div className="stat-card text-center py-8 text-muted-foreground">
            No disbursed loans found
          </div>
        ) : (
          loans.map((loan: any) => {
            const isManager = user?.role === 'pdd_manager';
            const isPendingApproval = isManager && loan.pdd_status === 'pending_approval';
            const isCompleted = activeTab === 'completed' && isManager;

            return (
              <div 
                key={loan.id} 
                className={cn(
                  "stat-card relative overflow-hidden transition-all duration-500 hover:shadow-xl",
                  isPendingApproval ? "!bg-red-50 dark:!bg-red-950/40 border-2 !border-red-500 shadow-md shadow-red-500/20" : "",
                  !isPendingApproval && isManager && activeTab === 'pending' && "border-l-4 border-l-amber-500/50 bg-amber-500/[0.02]",
                  isCompleted && "border-l-4 border-l-emerald-500 border-emerald-500/20 bg-emerald-500/[0.02]"
                )}
              >
                {/* Visual Status Highlight for PDD Manager */}
                {isManager && (
                  <div className={cn(
                    "absolute top-0 right-0 w-32 h-32 -mr-16 -mt-16 rounded-full blur-3xl opacity-20",
                    activeTab === 'pending' ? (isPendingApproval ? "bg-red-600" : "bg-amber-400") : "bg-emerald-500"
                  )} />
                )}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span className="mono text-xs text-accent font-medium bg-accent/10 px-2 py-0.5 rounded-md">{loan.loan_number}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${Number(loan.delay_days) > 0 ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500'}`}>
                        {loan.delay_days || '0'} days delayed
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${getPddStatusStyles(loan.pdd_status)}`}>
                        {(loan.pdd_status || 'pending').replace(/_/g, ' ')}
                      </span>
                    </div>
                    <p className="font-semibold text-foreground text-base truncate">{loan.applicant_name}</p>
                    <p className="text-sm text-muted-foreground truncate">{loan.vehicle_number || '—'} • {loan.maker_name} {loan.model_variant_name}</p>
                    {(loan.pdd_submitted_by_name || loan.pdd_rejection_reason) && (
                      <div className="mt-2 space-y-1">
                        {loan.pdd_submitted_by_name && (
                          <p className="text-xs text-muted-foreground">
                            Submitted by {loan.pdd_submitted_by_name}
                          </p>
                        )}
                        {loan.pdd_rejection_reason && (
                          <p className="text-xs text-red-600">
                            Rejection reason: {loan.pdd_rejection_reason}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Quick Summary Section for Manager Dash */}
                  {isManager && !expandedLoans.has(loan.id) && (
                    <div className="flex-1 lg:flex-none lg:w-[400px] grid grid-cols-2 gap-x-6 gap-y-2 py-3 px-4 rounded-xl bg-background/40 border border-border/40">
                       <div className="flex flex-col gap-0.5">
                         <span className="text-[9px] font-black text-muted-foreground uppercase opacity-60">Payment Status</span>
                         <span className="text-[11px] font-bold text-foreground truncate">{loan.balance_payment_status || '—'}</span>
                       </div>
                       <div className="flex flex-col gap-0.5">
                         <span className="text-[9px] font-black text-muted-foreground uppercase opacity-60">RTO Papers</span>
                         <span className="text-[11px] font-bold text-foreground truncate">{loan.rto_paper_details || '—'}</span>
                       </div>
                       <div className="flex flex-col gap-0.5">
                         <span className="text-[9px] font-black text-muted-foreground uppercase opacity-60">NOC Status</span>
                         <span className="text-[11px] font-bold text-foreground truncate">{loan.noc_status || '—'}</span>
                       </div>
                       <div className="flex flex-col gap-0.5">
                         <span className="text-[9px] font-black text-muted-foreground uppercase opacity-60">FC Status</span>
                         <span className="text-[11px] font-bold text-foreground truncate">{loan.current_fc_status || '—'}</span>
                       </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 shrink-0">
                    <button
                      onClick={() => navigate(`/loans/${loan.loan_number || loan.id}`)}
                      className="justify-center flex items-center gap-1.5 px-3 py-2 sm:py-1.5 rounded-lg border border-border bg-card text-xs font-medium text-foreground hover:bg-accent/10 hover:border-accent hover:text-accent transition-colors shadow-sm"
                    >
                      <FileText size={14} />
                      View
                    </button>
                    {canEditPdd && (
                      <button
                        onClick={() => {
                          setEditingLoanId(loan.id);
                          if (!expandedLoans.has(loan.id)) {
                            const newExpanded = new Set(expandedLoans);
                            newExpanded.add(loan.id);
                            setExpandedLoans(newExpanded);
                          }
                        }}
                        className="justify-center flex items-center gap-1.5 px-3 py-2 sm:py-1.5 rounded-lg border border-border bg-card text-xs font-medium text-foreground hover:bg-accent/10 hover:border-accent hover:text-accent transition-colors shadow-sm"
                      >
                        <Edit2 size={14} />
                        {user?.role === 'employee' ? 'Submit' : 'Edit'}
                      </button>
                    )}
                    {canApprovePdd && loan.pdd_status === 'pending_approval' && (
                      <>
                        <button
                          onClick={() => approvePdd.mutate(loan.loan_number || loan.id)}
                          disabled={approvePdd.isPending || rejectPdd.isPending}
                          className="justify-center flex items-center gap-1.5 px-3 py-2 sm:py-1.5 rounded-lg border border-green-500/40 bg-green-500/10 text-xs font-medium text-green-600 hover:bg-green-500/20 transition-colors shadow-sm disabled:opacity-50"
                        >
                          <CheckCircle2 size={14} />
                          Approve
                        </button>
                        <button
                          onClick={() => {
                            const reason = window.prompt('Enter rejection reason for this PDD');
                            if (!reason) return;
                            rejectPdd.mutate({ loanIdOrNumber: loan.loan_number || loan.id, reason });
                          }}
                          disabled={approvePdd.isPending || rejectPdd.isPending}
                          className="justify-center flex items-center gap-1.5 px-3 py-2 sm:py-1.5 rounded-lg border border-red-500/40 bg-red-500/10 text-xs font-medium text-red-600 hover:bg-red-500/20 transition-colors shadow-sm disabled:opacity-50"
                        >
                          <AlertTriangle size={14} />
                          Reject
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => {
                        const newExpanded = new Set(expandedLoans);
                        if (newExpanded.has(loan.id)) {
                          newExpanded.delete(loan.id);
                        } else {
                          newExpanded.add(loan.id);
                        }
                        setExpandedLoans(newExpanded);
                      }}
                      className="col-span-2 sm:w-auto justify-center flex items-center gap-1.5 px-3 py-2 sm:py-1.5 rounded-lg border border-border bg-card text-xs font-medium transition-colors shadow-sm"
                    >
                      {expandedLoans.has(loan.id) ? (
                        <>
                          <ChevronUp size={14} className="text-muted-foreground" />
                          <span className="text-muted-foreground">Collapse</span>
                        </>
                      ) : (
                        <>
                          <ChevronDown size={14} className="text-accent" />
                          <span className="text-accent">Expand</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {expandedLoans.has(loan.id) && (
                  editingLoanId === loan.id ? (
                    <div className="mt-6 pt-6 border-t border-border animate-in slide-in-from-top-2 duration-200">
                      <PDDForm 
                        loan={loan} 
                        onCancel={() => setEditingLoanId(null)} 
                        onSuccess={() => {
                          setEditingLoanId(null);
                          refetch();
                        }} 
                      />
                    </div>
                  ) : (
                    <div className="mt-6 pt-6 border-t border-border grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in slide-in-from-top-2 duration-200">
                  {/* Payment & Finance Details */}
                  <div className="space-y-4 bg-muted/20 p-4 rounded-xl border border-border/50">
                    <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <div className="w-1.5 h-4 bg-blue-500 rounded-full" />
                      Payment & Finance
                    </h3>
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <p className="text-muted-foreground mb-1">Payment Received</p>
                        <p className="font-semibold text-foreground">{formatDisplayDate(loan.payment_received_date)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground mb-1">M-Parivahan Financier</p>
                        <p className="font-semibold text-foreground">{loan.financier_m_parivahan || '—'}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground mb-1">Balance Status</p>
                        <p className="font-semibold text-foreground">{loan.balance_payment_status || '—'}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground mb-1">PDD at Fin. Co.</p>
                        <p className="font-semibold text-foreground">{loan.pdd_update_finance_company || '—'}</p>
                      </div>
                    </div>
                  </div>

                  {/* FC Details */}
                  <div className="space-y-4 bg-muted/20 p-4 rounded-xl border border-border/50 lg:col-span-2">
                    <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <div className="w-1.5 h-4 bg-indigo-500 rounded-full" />
                      FC (Form C) Details
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                      <div>
                        <p className="text-muted-foreground mb-1">Deposited By</p>
                        <p className="font-semibold text-foreground">{loan.fc_deposited_by || '—'}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground mb-1">Deposit Date</p>
                        <p className="font-semibold text-foreground">{formatDisplayDate(loan.fc_deposit_date)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground mb-1">FC Receipt</p>
                        <p className="font-semibold text-foreground">{loan.fc_receipt || '—'}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground mb-1">Zero Statement</p>
                        <p className="font-semibold text-foreground">{loan.zero_statement || '—'}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground mb-1">Current FC Status</p>
                        <p className="font-semibold text-foreground">{loan.current_fc_status || '—'}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground mb-1">Prev. Financier Acc.</p>
                        <p className="font-semibold text-foreground">{loan.prev_financier_account_status || '—'}</p>
                      </div>
                    </div>
                  </div>

                  {/* RTO Details */}
                  <div className="space-y-4 bg-muted/20 p-4 rounded-xl border border-border/50 lg:col-span-2">
                    <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <div className="w-1.5 h-4 bg-emerald-500 rounded-full" />
                      RTO & Document Details
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                      <div>
                        <p className="text-muted-foreground mb-1">Paper Details</p>
                        <p className="font-semibold text-foreground">{loan.rto_paper_details || '—'}</p>
                      </div>
                      <div className="col-span-2 sm:col-span-1">
                        <p className="text-muted-foreground mb-1">Pending Documents</p>
                        <p className="font-semibold text-foreground truncate">{loan.pending_rto_documents || '—'}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground mb-1">Doc Location</p>
                        <p className="font-semibold text-foreground">{loan.rto_docs_location || '—'}</p>
                      </div>
                      <div className="col-span-2 sm:col-span-1">
                        <p className="text-muted-foreground mb-1">Work Description</p>
                        <p className="font-semibold text-foreground truncate">{loan.rto_work_description || '—'}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground mb-1">Work Status</p>
                        <p className="font-semibold text-foreground">{loan.rto_work_status || '—'}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground mb-1">Location</p>
                        <p className="font-semibold text-foreground">{loan.dto_location || '—'}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground mb-1">Agent Name</p>
                        <p className="font-semibold text-foreground">{loan.rto_agent_name || '—'}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground mb-1">Agent Contact</p>
                        <div className="flex flex-col gap-0.5">
                          <p className="font-semibold text-foreground">{loan.rto_agent_mobile || '—'}</p>
                          {loan.rto_mail && <p className="text-muted-foreground truncate">{loan.rto_mail}</p>}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Vehicle Checks & Timeline */}
                  <div className="space-y-4 bg-muted/20 p-4 rounded-xl border border-border/50">
                    <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <div className="w-1.5 h-4 bg-amber-500 rounded-full" />
                      Checks & Timeline
                    </h3>
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <p className="text-muted-foreground mb-1">Pollution</p>
                        <p className="font-semibold text-foreground">{loan.pollution_status || '—'}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground mb-1">Insurance</p>
                        <p className="font-semibold text-foreground">{loan.insurance_status || '—'}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground mb-1">Vehicle Check</p>
                        <p className="font-semibold text-foreground">{loan.vehicle_check_status || '—'}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground mb-1">Police Case</p>
                        <p className="font-semibold text-foreground">{loan.police_case_status || '—'}</p>
                      </div>
                      <div className="border-t border-border/50 pt-3 col-span-2 mt-1">
                        <div>
                          <p className="text-muted-foreground mb-1">Commitment Date</p>
                          <p className="font-semibold text-foreground">{formatDisplayDate(loan.commitment_date)}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* NOC Details */}
                  <div className="space-y-4 bg-muted/20 p-4 rounded-xl border border-border/50 md:col-span-2 lg:col-span-3">
                    <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <div className="w-1.5 h-4 bg-purple-500 rounded-full" />
                      NOC Details
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                      <div>
                        <p className="text-muted-foreground mb-1">NOC Status</p>
                        <p className="font-semibold text-foreground">{loan.noc_status || '—'}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground mb-1">Checked By</p>
                        <p className="font-semibold text-foreground">{loan.noc_checked_by || '—'}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground mb-1">Previous DTO NOC</p>
                        <p className="font-semibold text-foreground">{loan.previous_dto_noc || '—'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )
            )}
              </div>
            );
          })
        )}
      </div>

    </div>
  );
}
