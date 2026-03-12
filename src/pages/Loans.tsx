import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, loansAPI } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { formatCurrency, LOAN_STATUSES } from '@/lib/mock-data';
import { exportToCSV, parseCSV } from '@/lib/export-utils';
import { exportLoanPDF, shareLoanPDF, downloadLoanPDF } from '@/lib/pdf-export';
import { getRolePermissions, canAccessLoan } from '@/lib/permissions';
import { RemarksModal } from '@/components/RemarksModal';
import { toast } from 'sonner';
import LoanStatusBadge from '@/components/LoanStatusBadge';
import PDDStatusBadge from '@/components/PDDStatusBadge';
import { Search, Plus, ChevronRight, Download, Upload, Printer, MessageCircle, MessageSquare } from 'lucide-react';

type LoanStatusFilter = 'submitted' | 'under_review' | 'approved' | 'rejected' | 'disbursed' | 'cancelled' | 'all';
type PDDStatusFilter = 'all' | 'pending' | 'pending_approval' | 'approved' | 'rejected';

export default function Loans() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<LoanStatusFilter>('all');
  const [pddStatusFilter, setPddStatusFilter] = useState<PDDStatusFilter>('all');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [remarksModal, setRemarksModal] = useState<{ open: boolean; loanId: string; currentRemarks: string }>({ open: false, loanId: '', currentRemarks: '' });
  const importRef = useRef<HTMLInputElement>(null);
  
  const permissions = getRolePermissions(user?.role || 'employee');

  const { data: loans = [], isLoading } = useQuery({
    queryKey: ['loans', user?.branch_id],
    queryFn: async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/loans`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
          }
        });
        if (!response.ok) return [];
        const data = await response.json();
        
        // Backend already handles role-based filtering, so just return the data
        return data;
      } catch {
        return [];
      }
    },
    enabled: !!user,
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      await loansAPI.update(id as any, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loans'] });
      toast.success('Status updated');
    },
    onError: () => toast.error('Failed to update status'),
  });

  const deleteLoan = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/loans/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` },
      });
      if (!res.ok) throw new Error('Failed to delete loan');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loans'] });
      toast.success('Loan deleted successfully');
    },
    onError: () => toast.error('Failed to delete loan'),
  });

  const canEditStatus = permissions.canChangeStatus;
  const canAddRemarks = permissions.canAddRemarks;
  const canCreateLoan = permissions.canCreate;

  const handleExport = () => {
    if (filtered.length === 0) { toast.error('No data to export'); return; }
    // Export complete loan data with all fields
    exportToCSV(filtered, 'loans');
    toast.success('Loans exported as CSV!');
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    try {
      const text = await file.text();
      const rows = parseCSV(text);
      if (rows.length === 0) { toast.error('No valid data found in CSV'); return; }
      let imported = 0;
      for (const row of rows) {
        const id = row['Loan ID'] || `IMP-${Date.now()}-${imported}`;
        try {
          await loansAPI.create({
            id,
            applicant_name: row['Applicant'] || row['applicant_name'] || 'Unknown',
            mobile: row['Mobile'] || row['mobile'] || '0000000000',
            loan_amount: Number(row['Loan Amount'] || row['loan_amount'] || 0),
            car_make: row['Car Make'] || row['car_make'] || '',
            car_model: row['Car Model'] || row['car_model'] || '',
            status: 'draft',
            created_by: user.id,
          });
          imported++;
        } catch (e) {
          // Skip err
        }
      }
      queryClient.invalidateQueries({ queryKey: ['loans'] });
      toast.success(`${imported} loans imported successfully!`);
    } catch (err: any) {
      toast.error(err.message || 'Import failed');
    }
    e.target.value = '';
  };

  const filtered = loans.filter((l: any) => {
    const matchSearch = !search ||
      l.applicant_name?.toLowerCase().includes(search.toLowerCase()) ||
      l.id?.toLowerCase().includes(search.toLowerCase()) ||
      l.car_model?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || l.status === statusFilter;
    const loanPddStatus = l.pdd_status || 'pending';
    const matchPddStatus = pddStatusFilter === 'all' || loanPddStatus === pddStatusFilter;
    return matchSearch && matchStatus && matchPddStatus;
  });

  return (
    <div className="pb-20 lg:pb-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="hidden sm:block">
          <h1 className="text-2xl font-bold text-foreground">Loan Applications</h1>
          <p className="text-sm text-muted-foreground mt-1">{filtered.length} applications found</p>
        </div>
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 scrollbar-hide mt-3 sm:mt-0">
          <button onClick={handleExport} className="whitespace-nowrap flex-shrink-0 flex items-center gap-1.5 sm:gap-2 bg-muted text-foreground font-medium py-2 sm:py-2.5 px-3 sm:px-4 rounded-xl hover:bg-muted/80 transition-opacity text-xs sm:text-sm">
            <Download size={14} className="sm:w-4 sm:h-4" /> Export
          </button>
          <button onClick={() => importRef.current?.click()} className="whitespace-nowrap flex-shrink-0 flex items-center gap-1.5 sm:gap-2 bg-muted text-foreground font-medium py-2 sm:py-2.5 px-3 sm:px-4 rounded-xl hover:bg-muted/80 transition-opacity text-xs sm:text-sm">
            <Upload size={14} className="sm:w-4 sm:h-4" /> Import CSV
          </button>
          <input ref={importRef} type="file" accept=".csv" className="hidden" onChange={handleImport} />
          {canCreateLoan && (
            <Link to="/loans/new" className="whitespace-nowrap flex-shrink-0 inline-flex items-center gap-1.5 sm:gap-2 bg-accent text-accent-foreground font-semibold py-2 sm:py-2.5 px-3 sm:px-4 rounded-xl hover:opacity-90 transition-opacity text-xs sm:text-sm">
              <Plus size={14} className="sm:w-4 sm:h-4" /> New Application
            </Link>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by name, ID, or car..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all"
          />
        </div>
        <div className="flex gap-2 flex-wrap items-center mt-1 sm:mt-0">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all ${statusFilter === 'all' ? 'bg-accent text-accent-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
          >All</button>
          {LOAN_STATUSES.map(s => (
            <button
              key={s.value}
              onClick={() => setStatusFilter(s.value as LoanStatusFilter)}
              className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all ${statusFilter === s.value ? 'bg-accent text-accent-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
            >{s.label}</button>
          ))}
        </div>
      </div>

      <div className="flex gap-2 flex-wrap items-center mb-4">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">PDD</span>
        {(['all', 'pending', 'pending_approval', 'approved', 'rejected'] as PDDStatusFilter[]).map((status) => (
          <button
            key={status}
            onClick={() => setPddStatusFilter(status)}
            className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all ${pddStatusFilter === status ? 'bg-accent text-accent-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
          >
            {status === 'all' ? 'All PDD' : status.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden space-y-3 pb-4">
        {isLoading ? (
          <div className="py-12 text-center text-muted-foreground text-sm">Loading applications…</div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">No applications found</div>
        ) : (
          filtered.map((loan: any) => (
            <div
              key={loan.id}
              onClick={() => navigate(`/loans/${loan.loan_number || loan.id}`)}
              className="stat-card active:scale-[0.98] transition-transform cursor-pointer"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground truncate">{loan.applicant_name}</p>
                  <p className="text-xs text-muted-foreground mono">{loan.loan_number || loan.id}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <LoanStatusBadge status={loan.status} />
                  <PDDStatusBadge status={loan.pdd_status} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Amount</p>
                  <p className="font-bold text-foreground">{formatCurrency(Number(loan.loan_amount))}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">EMI</p>
                  <p className="font-medium text-foreground">{formatCurrency(Number(loan.emi))}/mo</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Vehicle</p>
                  <p className="text-foreground truncate">{loan.maker_name || loan.car_make} {loan.model_variant_name || loan.car_model}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Bank</p>
                  <p className="text-foreground truncate">{loan.bank_name || loan.assigned_bank_name || '—'}</p>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-border flex flex-wrap items-center gap-2" onClick={e => e.stopPropagation()}>
                <button
                  onClick={() => exportLoanPDF(loan)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border bg-card text-xs font-medium text-foreground hover:bg-accent/10 transition-colors"
                >
                  <Printer size={13} className="text-accent" /> PDF
                </button>
                <button
                  onClick={() => downloadLoanPDF(loan)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border bg-card text-xs font-medium text-foreground hover:bg-accent/10 transition-colors"
                >
                  <Download size={13} className="text-accent" /> Save
                </button>
                <button
                  onClick={() => shareLoanPDF(loan)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border bg-card text-xs font-medium text-foreground hover:bg-green-500/10 transition-colors"
                >
                  <MessageCircle size={13} className="text-green-500" /> Share
                </button>
                {canAddRemarks && (
                  <button
                    onClick={() => setRemarksModal({ open: true, loanId: loan.id, currentRemarks: loan.remark || '' })}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border bg-card text-xs font-medium text-foreground hover:bg-blue-500/10 transition-colors"
                  >
                    <MessageSquare size={13} className="text-blue-500" /> Remarks
                  </button>
                )}
                {permissions.canEdit && (
                  <button
                    onClick={() => navigate(`/loans/${loan.loan_number || loan.id}/edit`)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border bg-card text-xs font-medium text-foreground hover:bg-accent/10 transition-colors"
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit
                  </button>
                )}
                {permissions.canDelete && (
                  <button
                    onClick={() => setDeleteConfirm(loan.id)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-red-500/50 bg-red-500/10 text-xs font-medium text-red-500 hover:bg-red-500/20 transition-colors"
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Delete
                  </button>
                )}
                {canEditStatus && (
                  <select
                    value={loan.status}
                    onChange={(e) => updateStatus.mutate({ id: loan.id, status: e.target.value })}
                    disabled={updateStatus.isPending}
                    className="flex-1 min-w-[120px] px-3 py-1.5 rounded-lg border border-border bg-card text-xs font-medium text-foreground focus:outline-none focus:border-accent"
                  >
                    {LOAN_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden lg:block">
        <div className="stat-card overflow-hidden">
          {isLoading ? (
            <div className="py-12 text-center text-muted-foreground text-sm">Loading applications…</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-3 font-medium text-muted-foreground">Loan ID</th>
                    <th className="text-left py-3 px-3 font-medium text-muted-foreground">Applicant</th>
                    <th className="text-left py-3 px-3 font-medium text-muted-foreground">Vehicle</th>
                    <th className="text-left py-3 px-3 font-medium text-muted-foreground">Bank</th>
                    <th className="text-right py-3 px-3 font-medium text-muted-foreground">Amount</th>
                    <th className="text-right py-3 px-3 font-medium text-muted-foreground">EMI</th>
                    <th className="text-left py-3 px-3 font-medium text-muted-foreground">Status</th>
                    <th className="text-left py-3 px-3 font-medium text-muted-foreground">PDD</th>
                    {(permissions.canEdit || permissions.canDelete || canEditStatus || canAddRemarks) && <th className="text-left py-3 px-3 font-medium text-muted-foreground">Actions</th>}
                    <th className="py-3 px-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((loan: any) => (
                    <tr key={loan.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors group cursor-pointer" onClick={() => navigate(`/loans/${loan.loan_number || loan.id}`)}>
                      <td className="py-3.5 px-3 mono text-xs text-accent font-medium">{loan.loan_number || loan.id}</td>
                      <td className="py-3.5 px-3">
                        <p className="font-medium text-foreground">{loan.applicant_name}</p>
                        <p className="text-xs text-muted-foreground">{loan.mobile}</p>
                      </td>
                      <td className="py-3.5 px-3">
                        <p className="text-foreground">{loan.maker_name || loan.car_make} {loan.model_variant_name || loan.car_model}</p>
                        <p className="text-xs text-muted-foreground">{loan.vehicle_number || loan.car_variant}</p>
                      </td>
                      <td className="py-3.5 px-3 text-muted-foreground">{loan.bank_name || loan.assigned_bank_name || '—'}</td>
                      <td className="py-3.5 px-3 text-right font-medium text-foreground">{formatCurrency(Number(loan.loan_amount))}</td>
                      <td className="py-3.5 px-3 text-right text-muted-foreground">{formatCurrency(Number(loan.emi))}/mo</td>
                      <td className="py-3.5 px-3"><LoanStatusBadge status={loan.status} /></td>
                      <td className="py-3.5 px-3"><PDDStatusBadge status={loan.pdd_status} /></td>
                      {(permissions.canEdit || permissions.canDelete || canEditStatus || canAddRemarks) && (
                        <td className="py-3.5 px-3" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center gap-2">
                            {permissions.canEdit && (
                              <button
                                onClick={() => navigate(`/loans/${loan.loan_number || loan.id}/edit`)}
                                className="p-1.5 rounded-md border border-border bg-card hover:bg-accent/10 transition-colors"
                                title="Edit"
                              >
                                <svg className="w-3.5 h-3.5 text-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                            )}
                            {canAddRemarks && (
                              <button
                                onClick={() => setRemarksModal({ open: true, loanId: loan.id, currentRemarks: loan.remark || '' })}
                                className="p-1.5 rounded-md border border-border bg-card hover:bg-blue-500/10 transition-colors"
                                title="Add Remarks"
                              >
                                <MessageSquare size={14} className="text-blue-500" />
                              </button>
                            )}
                            {permissions.canDelete && (
                              <button
                                onClick={() => setDeleteConfirm(loan.id)}
                                className="p-1.5 rounded-md border border-red-500/50 bg-red-500/10 hover:bg-red-500/20 transition-colors"
                                title="Delete"
                              >
                                <svg className="w-3.5 h-3.5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            )}
                            {canEditStatus && (
                              <select
                                value={loan.status}
                                onChange={(e) => updateStatus.mutate({ id: loan.id, status: e.target.value })}
                                disabled={updateStatus.isPending}
                                className="px-2 py-1 rounded-md border border-border bg-card text-xs font-medium text-foreground focus:outline-none focus:border-accent"
                              >
                                {LOAN_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                              </select>
                            )}
                          </div>
                        </td>
                      )}
                      <td className="py-3.5 px-3">
                        <ChevronRight size={16} className="text-muted-foreground group-hover:text-accent transition-colors" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filtered.length === 0 && !isLoading && (
                <div className="py-12 text-center text-muted-foreground">No applications found</div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setDeleteConfirm(null)}>
          <div className="bg-card rounded-2xl shadow-2xl max-w-md w-full p-6 border border-border" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center">
                <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground">Delete Loan Application</h3>
                <p className="text-sm text-muted-foreground">This action cannot be undone</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-6">
              Are you sure you want to delete this loan application? All associated data will be permanently removed.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-border bg-muted text-foreground font-medium hover:bg-muted/80 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  deleteLoan.mutate(deleteConfirm);
                  setDeleteConfirm(null);
                }}
                disabled={deleteLoan.isPending}
                className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 text-white font-semibold hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                {deleteLoan.isPending ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Remarks Modal */}
      <RemarksModal
        open={remarksModal.open}
        onClose={() => setRemarksModal({ open: false, loanId: '', currentRemarks: '' })}
        loanId={remarksModal.loanId}
        currentRemarks={remarksModal.currentRemarks}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['loans'] });
          setRemarksModal({ open: false, loanId: '', currentRemarks: '' });
        }}
      />
    </div>
  );
}
