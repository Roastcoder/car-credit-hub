import { CheckCircle2, AlertTriangle, Edit2, FileText, ChevronDown, ChevronUp, List, Plus, ClipboardCheck, Eye, Search, Filter, ArrowRight, IndianRupee, Car, User, MapPin, Clock, Calendar, Landmark, ShieldCheck, Timer, Files, Send, X as CloseIcon } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useState, useEffect, useMemo } from 'react';
import PDDForm from '@/components/PDDForm';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { getRolePermissions } from '@/lib/permissions';
import MobilePageSwitcher from '@/components/MobilePageSwitcher';
import { cn } from '@/lib/utils';

const getPddStatusStyles = (status?: string) => {
  if (status === 'approved') {
    return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
  }
  if (status === 'rejected') {
    return 'bg-rose-500/10 text-rose-600 border-rose-500/20';
  }
  if (status === 'pending_approval') {
    return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
  }
  return 'bg-muted text-muted-foreground border-border';
};

const LoanDocumentsList = ({ loanId }: { loanId: string | number }) => {
  const { data: documents = [], isLoading } = useQuery({
    queryKey: ['loan-documents-mini', loanId],
    queryFn: async () => {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/loans/${loanId}/documents`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` },
      });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!loanId,
  });

  if (isLoading) return <div className="text-[10px] animate-pulse text-muted-foreground">Loading documents...</div>;
  if (documents.length === 0) return <div className="text-[10px] text-muted-foreground italic">No documents attached</div>;

  // Categorize documents: Latest of each type vs Historical versions
  const latestByType: Record<string, any> = {};
  const history: any[] = [];
  const sortedDocs = [...documents].sort((a, b) => b.id - a.id);
  
  sortedDocs.forEach(doc => {
    if (!latestByType[doc.document_type]) {
      latestByType[doc.document_type] = doc;
    } else {
      history.push(doc);
    }
  });

  const latest = Object.values(latestByType);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <p className="text-[8px] font-black text-emerald-600 uppercase tracking-widest ml-1">Current Latest Versions</p>
        <div className="flex flex-wrap gap-2">
          {latest.map((doc: any) => (
            <a
              key={doc.id}
              href={`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${doc.file_url}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[9px] font-black text-emerald-700 hover:bg-emerald-500/20 transition-all shadow-sm uppercase tracking-tighter"
            >
              <CheckCircle2 size={10} />
              {doc.document_type.replace(/_/g, ' ')}
            </a>
          ))}
        </div>
      </div>

      {history.length > 0 && (
        <div className="space-y-2">
          <p className="text-[8px] font-black text-muted-foreground/60 uppercase tracking-widest ml-1">Previous History (Replaced Files)</p>
          <div className="flex flex-wrap gap-2">
            {history.map((doc: any) => (
              <a
                key={doc.id}
                href={`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${doc.file_url}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-muted/40 border border-border/60 text-[9px] font-bold text-muted-foreground/70 hover:bg-muted/60 transition-all shadow-sm uppercase tracking-tighter"
              >
                <Clock size={8} />
                {doc.document_type.replace(/_/g, ' ')}
                <span className="text-[7px] font-medium opacity-50 px-1 bg-white/50 rounded ml-1">v{doc.id}</span>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default function PDDTracking() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [expandedLoans, setExpandedLoans] = useState<Set<number>>(new Set());
  const [activeTab, setActiveTab] = useState<'pending' | 'completed'>((searchParams.get('tab') as 'pending' | 'completed') || 'pending');
  const [searchTerm, setSearchTerm] = useState('');

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
    const date = new Date(value as any);
    return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const [editingLoanId, setEditingLoanId] = useState<number | null>(null);

  const [rejectionModal, setRejectionModal] = useState<{ isOpen: boolean; loanId: string | number | null }>({ isOpen: false, loanId: null });
  const [rejectionReason, setRejectionReason] = useState('');

  const { data: allLoans = [], isLoading, refetch } = useQuery({
    queryKey: ['pdd-loans-raw', user?.id, user?.role, user?.branch_id, activeTab],
    queryFn: async () => {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/loans?status=approved,disbursed`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
      });
      if (!response.ok) return [];
      const rawData = await response.json();
      return Array.isArray(rawData) ? rawData : (rawData.data || []);
    },
    enabled: !!user,
  });

  const processedLoans = useMemo(() => {
    let data = allLoans;
    if (user?.role === 'employee') {
      data = data.filter((loan: any) => Number(loan.created_by) === Number(user.id));
    } else if (user?.role === 'manager') {
      const allowedBranchIds = Array.from(new Set([
        ...(((user as any)?.managed_branch_ids || []) as number[]),
        Number(user.branch_id || 0)
      ].filter((branchId) => Number(branchId) > 0)));
      data = data.filter((loan: any) => allowedBranchIds.includes(Number(loan.branch_id)));
    }

    if (activeTab === 'pending') {
      data = data.filter((loan: any) => loan.pdd_status === 'pending_approval' || !loan.pdd_status || loan.pdd_status === 'pending');
    } else {
      data = data.filter((loan: any) => loan.pdd_status === 'approved');
    }

    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      data = data.filter((loan: any) => 
        loan.applicant_name?.toLowerCase().includes(q) || 
        loan.loan_number?.toLowerCase().includes(q) ||
        loan.vehicle_number?.toLowerCase().includes(q)
      );
    }

    return data;
  }, [allLoans, user, activeTab, searchTerm]);

  const canEditPdd = user?.role === 'employee' || user?.role === 'manager' || user?.role === 'pdd_manager';
  const canApprovePdd = user?.role === 'manager' || user?.role === 'admin' || user?.role === 'super_admin' || user?.role === 'pdd_manager';

  const approvePdd = useMutation({
    mutationFn: async (loanIdOrNumber: string | number) => {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/loans/${loanIdOrNumber}/pdd/approve`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
      });
      if (!response.ok) throw new Error('Failed to approve PDD');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pdd-loans-raw'] });
      toast.success('PDD Approved Successfully');
    },
    onError: (err: any) => toast.error(err.message),
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
      if (!response.ok) throw new Error('Failed to reject PDD');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pdd-loans-raw'] });
      toast.success('PDD Sent Back for Correction');
    },
    onError: (err: any) => toast.error(err.message),
  });

  const toggleLoan = (id: number) => {
    setExpandedLoans(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <div className="w-12 h-12 border-4 border-accent/20 border-t-accent rounded-full animate-spin" />
      <p className="text-sm font-black text-muted-foreground uppercase tracking-widest">Loading PDD Dashboard...</p>
    </div>
  );

  return (
    <div className="pb-20 lg:pb-12 max-w-[1600px] mx-auto px-4 sm:px-6 animate-in fade-in duration-500">
      <MobilePageSwitcher options={loanSwitcherOptions} activeLabel="PDD Tracking" />

      {/* Modern Dashboard Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-10">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 rounded-xl bg-accent text-white shadow-lg shadow-accent/20">
              <ClipboardCheck size={20} />
            </div>
            <h1 className="text-3xl font-black tracking-tight text-foreground">PDD Workflow</h1>
          </div>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-[0.2em] opacity-70">Post Disbursement Verification & Tracking</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative group flex-1 min-w-[280px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-accent transition-colors" size={16} />
            <input 
              type="text" 
              placeholder="Search applicant, loan #, or vehicle..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-card border border-border/60 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all shadow-sm"
            />
          </div>
          <div className="flex items-center p-1 bg-muted/40 backdrop-blur-md rounded-2xl border border-border/60 shadow-inner">
            <button
              onClick={() => handleTabChange('pending')}
              className={cn(
                "px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-500",
                activeTab === 'pending' 
                  ? "bg-rose-500 text-white shadow-xl shadow-rose-500/30 scale-105" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Pending ({allLoans.filter(l => l.pdd_status !== 'approved').length})
            </button>
            <button
              onClick={() => handleTabChange('completed')}
              className={cn(
                "px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-500",
                activeTab === 'completed' 
                  ? "bg-emerald-600 text-white shadow-xl shadow-emerald-600/30 scale-105" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Completed ({allLoans.filter(l => l.pdd_status === 'approved').length})
            </button>
          </div>
        </div>
      </div>

      {/* Loans Grid/List */}
      <div className="space-y-6">
        {processedLoans.length === 0 ? (
          <div className="bg-card border-2 border-dashed border-border/60 rounded-[2.5rem] py-20 flex flex-col items-center justify-center text-center gap-4">
            <div className="p-4 rounded-3xl bg-muted/30 text-muted-foreground/40">
              <Search size={48} />
            </div>
            <div>
              <p className="text-lg font-black text-foreground">No applications found</p>
              <p className="text-sm text-muted-foreground font-medium">Try adjusting your filters or search term</p>
            </div>
          </div>
        ) : (
          processedLoans.map((loan: any) => {
            const isManager = user?.role === 'pdd_manager';
            const isPendingApproval = isManager && loan.pdd_status === 'pending_approval';
            const isExpanded = expandedLoans.has(loan.id);
            const isBT = loan.scheme === 'BT' || loan.scheme === 'Purchase & BT';

            return (
              <div 
                key={loan.id} 
                className={cn(
                  "group relative bg-card border border-border/60 rounded-[2rem] transition-all duration-500 hover:shadow-2xl hover:shadow-accent/5",
                  isExpanded ? "ring-2 ring-accent/20 shadow-2xl" : "",
                  isPendingApproval ? "bg-rose-50/30 dark:bg-rose-950/10 border-rose-500/20 shadow-lg shadow-rose-500/5" : ""
                )}
              >
                {isPendingApproval && (
                  <div className="absolute top-0 right-10 -translate-y-1/2 flex items-center gap-2 px-3 py-1 bg-rose-500 text-white text-[9px] font-black uppercase tracking-widest rounded-full shadow-lg z-20">
                    <AlertTriangle size={10} />
                    Needs Review
                  </div>
                )}

                <div className="p-6 sm:p-8">
                  <div className="flex flex-col xl:flex-row gap-8 items-start xl:items-center">
                    {/* Primary Info */}
                    <div className="flex-1 flex gap-5 items-center">
                      <div className={cn(
                        "w-16 h-16 rounded-[1.5rem] flex items-center justify-center shrink-0 border shadow-inner transition-transform duration-500 group-hover:scale-110",
                        isBT ? "bg-indigo-500/10 text-indigo-600 border-indigo-500/20" : "bg-blue-500/10 text-blue-600 border-blue-500/20"
                      )}>
                        <Car size={32} />
                      </div>
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="text-xl font-black text-foreground tracking-tight">{loan.applicant_name}</h3>
                          <span className={cn(
                            "px-2.5 py-0.5 rounded-full text-[9px] font-black border uppercase tracking-widest",
                            getPddStatusStyles(loan.pdd_status)
                          )}>
                            {loan.pdd_status?.replace(/_/g, ' ') || 'Pending'}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-bold text-muted-foreground/80">
                          <span className="text-accent">{loan.loan_number}</span>
                          <div className="w-1 h-1 rounded-full bg-border" />
                          <span>{loan.car_make} {loan.car_model}</span>
                          <div className="w-1 h-1 rounded-full bg-border" />
                          <span className="flex items-center gap-1.5 uppercase">
                            <MapPin size={12} className="text-rose-500" />
                            {loan.branch_name || 'Branch'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Quick Summary Grid */}
                    {!isExpanded && (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-8 gap-y-2 py-4 px-6 rounded-3xl bg-muted/20 border border-border/40 w-full xl:w-auto xl:min-w-[500px]">
                        <div className="space-y-0.5">
                          <p className="text-[9px] font-black text-muted-foreground/60 uppercase tracking-widest">Payment</p>
                          <p className="text-[11px] font-bold text-foreground truncate">{loan.balance_payment_status || '—'}</p>
                        </div>
                        <div className="space-y-0.5">
                          <p className="text-[9px] font-black text-muted-foreground/60 uppercase tracking-widest">RTO Status</p>
                          <p className="text-[11px] font-bold text-foreground truncate">{loan.rto_work_status || '—'}</p>
                        </div>
                        <div className="space-y-0.5">
                          <p className="text-[9px] font-black text-muted-foreground/60 uppercase tracking-widest">Insurance</p>
                          <p className="text-[11px] font-bold text-foreground truncate">{loan.insurance_status || '—'}</p>
                        </div>
                        <div className="space-y-0.5">
                          <p className="text-[9px] font-black text-muted-foreground/60 uppercase tracking-widest">{isBT ? 'FC Status' : 'Police Case'}</p>
                          <p className="text-[11px] font-bold text-foreground truncate">{isBT ? (loan.current_fc_status || '—') : (loan.police_case_status || '—')}</p>
                        </div>
                      </div>
                    )}

                    {/* Actions Row */}
                    <div className="flex items-center gap-3 w-full xl:w-auto justify-end">
                      <button
                        onClick={() => navigate(`/loans/${loan.loan_number || loan.id}`)}
                        className="px-5 py-2.5 rounded-xl border border-border text-[10px] font-black uppercase tracking-widest hover:bg-muted transition-all active:scale-95"
                      >
                        Details
                      </button>
                      
                      {canEditPdd && (
                        <button
                          onClick={() => setEditingLoanId(editingLoanId === loan.id ? null : loan.id)}
                          className={cn(
                            "px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 flex items-center gap-2 shadow-lg shadow-accent/20",
                            editingLoanId === loan.id ? "bg-slate-700 text-white" : "bg-accent text-white"
                          )}
                        >
                          <Edit2 size={14} />
                          {editingLoanId === loan.id ? 'Close Edit' : 'Edit PDD'}
                        </button>
                      )}

                      <button
                        onClick={() => toggleLoan(loan.id)}
                        className="p-2.5 rounded-xl border border-border/60 hover:bg-accent/5 transition-all text-muted-foreground hover:text-accent active:scale-90"
                      >
                        {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                      </button>
                    </div>
                  </div>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="mt-8 pt-8 border-t border-border/60 animate-in slide-in-from-top-4 duration-500">
                      {editingLoanId === loan.id ? (
                        <PDDForm 
                          loan={loan} 
                          existingDocuments={[]}
                          onCancel={() => setEditingLoanId(null)} 
                          onSuccess={() => {
                            setEditingLoanId(null);
                            refetch();
                          }} 
                        />
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                          {/* Financial Panel */}
                          <div className="space-y-5 bg-blue-500/[0.03] p-6 rounded-3xl border border-blue-500/10">
                            <h4 className="text-[11px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-2">
                              <Landmark size={14} /> Financial Tracking
                            </h4>
                            <div className="grid grid-cols-2 gap-x-6 gap-y-4 text-xs">
                              <div>
                                <p className="text-muted-foreground font-medium mb-1 uppercase tracking-tighter text-[9px]">Received Date</p>
                                <p className="font-bold text-foreground">{formatDisplayDate(loan.payment_received_date)}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground font-medium mb-1 uppercase tracking-tighter text-[9px]">M-Parivahan Fin.</p>
                                <p className="font-bold text-foreground truncate">{loan.financier_m_parivahan || '—'}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground font-medium mb-1 uppercase tracking-tighter text-[9px]">Balance Status</p>
                                <p className="font-bold text-foreground">{loan.balance_payment_status || '—'}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground font-medium mb-1 uppercase tracking-tighter text-[9px]">Fin. Co. PDD</p>
                                <p className="font-bold text-foreground">{loan.pdd_update_finance_company || '—'}</p>
                              </div>
                            </div>
                          </div>

                          {/* RTO Panel */}
                          <div className="space-y-5 bg-emerald-500/[0.03] p-6 rounded-3xl border border-emerald-500/10">
                            <h4 className="text-[11px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-2">
                              <Files size={14} /> RTO & Documents
                            </h4>
                            <div className="grid grid-cols-2 gap-x-6 gap-y-4 text-xs">
                              <div className="col-span-2">
                                <p className="text-muted-foreground font-medium mb-1 uppercase tracking-tighter text-[9px]">Paper Details</p>
                                <p className="font-bold text-foreground">{loan.rto_paper_details || '—'}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground font-medium mb-1 uppercase tracking-tighter text-[9px]">Work Status</p>
                                <p className="font-bold text-foreground">{loan.rto_work_status || '—'}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground font-medium mb-1 uppercase tracking-tighter text-[9px]">Location</p>
                                <p className="font-bold text-foreground">{loan.dto_location || '—'}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground font-medium mb-1 uppercase tracking-tighter text-[9px]">Agent</p>
                                <p className="font-bold text-foreground">{loan.rto_agent_name || '—'}</p>
                              </div>
                            </div>
                          </div>

                          {/* Verification Panel */}
                          <div className="space-y-5 bg-amber-500/[0.03] p-6 rounded-3xl border border-amber-500/10">
                            <h4 className="text-[11px] font-black text-amber-600 uppercase tracking-widest flex items-center gap-2">
                              <ShieldCheck size={14} /> Checks & Verification
                            </h4>
                            <div className="grid grid-cols-2 gap-x-6 gap-y-4 text-xs">
                              <div>
                                <p className="text-muted-foreground font-medium mb-1 uppercase tracking-tighter text-[9px]">Insurance</p>
                                <p className="font-bold text-foreground">{loan.insurance_status || '—'}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground font-medium mb-1 uppercase tracking-tighter text-[9px]">Pollution</p>
                                <p className="font-bold text-foreground">{loan.pollution_status || '—'}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground font-medium mb-1 uppercase tracking-tighter text-[9px]">Police Case</p>
                                <p className="font-bold text-foreground">{loan.police_case_status || '—'}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground font-medium mb-1 uppercase tracking-tighter text-[9px]">Challan</p>
                                <p className="font-bold text-foreground">{loan.challan_status || '—'}</p>
                              </div>
                            </div>
                          </div>

                          {/* Conditional FC Section */}
                          {isBT && (
                            <div className="space-y-5 bg-indigo-500/[0.03] p-6 rounded-3xl border border-indigo-500/10 xl:col-span-2">
                              <h4 className="text-[11px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2">
                                <Landmark size={14} /> Foreclosure (FC) Details
                              </h4>
                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-8 gap-y-4 text-xs">
                                <div>
                                  <p className="text-muted-foreground font-medium mb-1 uppercase tracking-tighter text-[9px]">FC Deposited By</p>
                                  <p className="font-bold text-foreground">{loan.fc_deposited_by || '—'}</p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground font-medium mb-1 uppercase tracking-tighter text-[9px]">Deposit Date</p>
                                  <p className="font-bold text-foreground">{formatDisplayDate(loan.fc_deposit_date)}</p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground font-medium mb-1 uppercase tracking-tighter text-[9px]">FC Status</p>
                                  <p className="font-bold text-foreground">{loan.current_fc_status || '—'}</p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground font-medium mb-1 uppercase tracking-tighter text-[9px]">Receipt</p>
                                  <p className="font-bold text-foreground">{loan.fc_receipt || '—'}</p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground font-medium mb-1 uppercase tracking-tighter text-[9px]">Zero Statement</p>
                                  <p className="font-bold text-foreground">{loan.zero_statement || '—'}</p>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Attached Documents Quick Access */}
                          <div className={cn(
                            "space-y-5 bg-slate-500/[0.03] p-6 rounded-3xl border border-slate-500/10",
                            !isBT ? "xl:col-span-3" : "xl:col-span-1"
                          )}>
                            <h4 className="text-[11px] font-black text-slate-600 uppercase tracking-widest flex items-center gap-2">
                              <Eye size={14} /> Verification Files
                            </h4>
                            <LoanDocumentsList loanId={loan.loan_number || loan.id} />
                          </div>

                          {/* Manager Approval Actions */}
                          {isPendingApproval && (
                            <div className="md:col-span-2 xl:col-span-3 p-6 rounded-3xl bg-amber-500/[0.03] border-2 border-dashed border-amber-500/20 flex flex-col sm:flex-row items-center justify-between gap-6 mt-4">
                              <div className="flex gap-4 items-center">
                                <div className="p-3 rounded-2xl bg-amber-500 text-white shadow-lg shadow-amber-500/20">
                                  <ShieldCheck size={24} />
                                </div>
                                <div>
                                  <p className="text-sm font-black text-foreground">Pending PDD Approval</p>
                                  <p className="text-xs text-muted-foreground font-medium">Verify all documents and data before approving this application.</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-3 w-full sm:w-auto">
                                <button
                                  onClick={() => {
                                    setRejectionModal({ isOpen: true, loanId: loan.loan_number || loan.id });
                                    setRejectionReason('');
                                  }}
                                  disabled={rejectPdd.isPending}
                                  className="flex-1 sm:flex-none px-8 py-3 rounded-2xl border-2 border-rose-500/20 text-rose-600 text-xs font-black uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all active:scale-95"
                                >
                                  Sent Back
                                </button>
                                <button
                                  onClick={() => {
                                    if (confirm('Approve this PDD application?')) approvePdd.mutate(loan.loan_number || loan.id);
                                  }}
                                  disabled={approvePdd.isPending}
                                  className="flex-1 sm:flex-none px-10 py-3 rounded-2xl bg-emerald-600 text-white text-xs font-black uppercase tracking-widest hover:bg-emerald-700 shadow-xl shadow-emerald-600/30 transition-all active:scale-95"
                                >
                                  Approve PDD
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Custom Rejection Modal */}
      {rejectionModal.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-card w-full max-w-md rounded-[2.5rem] border border-border shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8 space-y-6">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-rose-500 text-white shadow-lg shadow-rose-500/20">
                    <AlertTriangle size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-foreground">Reject PDD</h3>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Correction Required</p>
                  </div>
                </div>
                <button 
                  onClick={() => setRejectionModal({ isOpen: false, loanId: null })}
                  className="p-2 rounded-full hover:bg-muted transition-colors text-muted-foreground"
                >
                  <CloseIcon size={20} />
                </button>
              </div>

              <div className="space-y-4">
                <p className="text-sm font-bold text-foreground/80 leading-relaxed">
                  Please provide a clear reason for sending this application back. The employee will see this as revision remarks.
                </p>
                <textarea
                  autoFocus
                  placeholder="e.g. RC Document is blurry, please re-upload..."
                  className="w-full px-5 py-4 bg-muted/30 border border-border rounded-2xl text-sm min-h-[140px] focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all font-medium"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={() => setRejectionModal({ isOpen: false, loanId: null })}
                  className="flex-1 px-6 py-4 rounded-2xl text-xs font-black text-muted-foreground hover:bg-muted transition-all uppercase tracking-widest"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (!rejectionReason.trim()) return toast.error('Please enter a reason');
                    rejectPdd.mutate({ loanIdOrNumber: rejectionModal.loanId!, reason: rejectionReason });
                    setRejectionModal({ isOpen: false, loanId: null });
                  }}
                  disabled={rejectPdd.isPending}
                  className="flex-[2] px-8 py-4 bg-rose-600 text-white rounded-2xl text-xs font-black hover:bg-rose-700 shadow-xl shadow-rose-600/30 transition-all flex items-center justify-center gap-2 uppercase tracking-widest"
                >
                  <Send size={16} />
                  Confirm Rejection
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
