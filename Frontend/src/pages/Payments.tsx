import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';
import { Search, Plus, Eye, FileText, CreditCard, CheckCircle, XCircle, Clock, DollarSign } from 'lucide-react';

type PaymentStatus = 'pending' | 'manager_approved' | 'accounts_processing' | 'paid' | 'rejected';

const PAYMENT_STATUSES = [
  { value: 'pending', label: 'Pending Review', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'manager_approved', label: 'Manager Approved', color: 'bg-blue-100 text-blue-800' },
  { value: 'accounts_processing', label: 'Accounts Processing', color: 'bg-purple-100 text-purple-800' },
  { value: 'paid', label: 'Paid', color: 'bg-green-100 text-green-800' },
  { value: 'rejected', label: 'Rejected', color: 'bg-red-100 text-red-800' }
];

const PaymentStatusBadge = ({ status }: { status: PaymentStatus }) => {
  const statusConfig = PAYMENT_STATUSES.find(s => s.value === status);
  if (!statusConfig) return <span className="text-xs text-muted-foreground">Unknown</span>;
  
  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusConfig.color}`}>
      {statusConfig.label}
    </span>
  );
};

export default function Payments() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | 'all'>('all');

  // Fetch payments based on user role
  const { data: payments = [], isLoading } = useQuery({
    queryKey: ['payments', user?.role, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/payments?${params}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
      });
      if (!response.ok) throw new Error('Failed to fetch payments');
      const data = await response.json();
      return Array.isArray(data) ? data : (data.data || []);
    },
    enabled: !!user,
  });

  // Update payment status (for managers and accounts)
  const updateStatus = useMutation({
    mutationFn: async ({ id, status, remarks }: { id: string; status: PaymentStatus; remarks?: string }) => {
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
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      toast.success('Payment status updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update status');
    }
  });

  const filtered = payments.filter((payment: any) => {
    const matchSearch = !search || 
      payment.loan_number?.toLowerCase().includes(search.toLowerCase()) ||
      payment.applicant_name?.toLowerCase().includes(search.toLowerCase()) ||
      payment.payment_id?.toLowerCase().includes(search.toLowerCase()) ||
      payment.beneficiary_name?.toLowerCase().includes(search.toLowerCase());
    
    const matchStatus = statusFilter === 'all' || payment.status === statusFilter;
    
    // Role-based filtering
    if (user?.role === 'accountant') {
      return matchSearch && matchStatus && ['manager_approved', 'accounts_processing', 'paid'].includes(payment.status);
    }
    
    return matchSearch && matchStatus;
  });

  const canCreatePayment = ['employee', 'manager', 'admin', 'super_admin'].includes(user?.role || '');
  const canApprove = ['manager', 'admin', 'super_admin'].includes(user?.role || '');
  const canProcess = user?.role === 'accountant';

  return (
    <div className="pb-20 lg:pb-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Payment Applications</h1>
          <p className="text-sm text-muted-foreground mt-1">{filtered.length} applications found</p>
        </div>
        <div className="flex items-center gap-2">
          {canCreatePayment && (
            <Link 
              to="/payments/new" 
              className="inline-flex items-center gap-2 bg-accent text-accent-foreground font-semibold py-2 px-4 rounded-xl hover:opacity-90 transition-opacity text-sm"
            >
              <Plus size={16} /> New Payment Application
            </Link>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1 max-w-sm relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search payments..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 transition-all"
          />
        </div>
        
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as PaymentStatus | 'all')}
          className="px-3 py-2 rounded-xl border border-border bg-card text-sm font-medium focus:outline-none focus:ring-2 focus:ring-accent/30"
        >
          <option value="all">All Status</option>
          {PAYMENT_STATUSES.map(status => (
            <option key={status.value} value={status.value}>{status.label}</option>
          ))}
        </select>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {PAYMENT_STATUSES.map(status => {
          const count = payments.filter((p: any) => p.status === status.value).length;
          const total = payments.filter((p: any) => p.status === status.value).reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0);
          
          return (
            <div key={status.value} className="bg-card rounded-lg border border-border p-4">
              <div className="flex items-center justify-between mb-2">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${status.color}`}>
                  {status.value === 'pending' && <Clock size={16} />}
                  {status.value === 'manager_approved' && <CheckCircle size={16} />}
                  {status.value === 'accounts_processing' && <CreditCard size={16} />}
                  {status.value === 'paid' && <DollarSign size={16} />}
                  {status.value === 'rejected' && <XCircle size={16} />}
                </div>
                <span className="text-2xl font-bold text-foreground">{count}</span>
              </div>
              <p className="text-xs text-muted-foreground mb-1">{status.label}</p>
              <p className="text-sm font-semibold text-foreground">{formatCurrency(total)}</p>
            </div>
          );
        })}
      </div>

      {/* Mobile Cards */}
      <div className="lg:hidden space-y-3">
        {isLoading ? (
          <div className="py-12 text-center text-muted-foreground text-sm">Loading payments...</div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">No payment applications found</div>
        ) : (
          filtered.map((payment: any) => (
            <div
              key={payment.id}
              onClick={() => navigate(`/payments/${payment.id}`)}
              className="bg-card rounded-lg border border-border p-4 cursor-pointer hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground truncate">
                    {payment.payment_id || `PAY-${payment.id}`}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {payment.loan_number} • {payment.applicant_name}
                  </p>
                </div>
                <PaymentStatusBadge status={payment.status} />
              </div>
              
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Amount</p>
                  <p className="font-bold text-foreground">{formatCurrency(Number(payment.amount))}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Type</p>
                  <p className="text-foreground capitalize">{payment.payment_type?.replace(/_/g, ' ')}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-muted-foreground">Beneficiary</p>
                  <p className="text-foreground truncate">{payment.beneficiary_name}</p>
                </div>
              </div>

              {/* Action buttons for mobile */}
              <div className="mt-3 pt-3 border-t border-border flex gap-2" onClick={e => e.stopPropagation()}>
                {canApprove && payment.status === 'pending' && (
                  <>
                    <button
                      onClick={() => updateStatus.mutate({ id: payment.id, status: 'manager_approved' })}
                      className="flex-1 px-3 py-1.5 bg-green-500/10 text-green-600 rounded-lg text-xs font-medium hover:bg-green-500/20 transition-colors"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => updateStatus.mutate({ id: payment.id, status: 'rejected' })}
                      className="flex-1 px-3 py-1.5 bg-red-500/10 text-red-600 rounded-lg text-xs font-medium hover:bg-red-500/20 transition-colors"
                    >
                      Reject
                    </button>
                  </>
                )}
                {canProcess && payment.status === 'manager_approved' && (
                  <button
                    onClick={() => navigate(`/payments/${payment.id}/voucher`)}
                    className="flex-1 px-3 py-1.5 bg-blue-500/10 text-blue-600 rounded-lg text-xs font-medium hover:bg-blue-500/20 transition-colors"
                  >
                    Create Voucher
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop Table */}
      <div className="hidden lg:block">
        <div className="bg-card rounded-lg border border-border overflow-hidden">
          {isLoading ? (
            <div className="py-12 text-center text-muted-foreground text-sm">Loading payments...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Payment ID</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Loan</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Customer</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Type</th>
                    <th className="text-right py-3 px-4 font-medium text-muted-foreground">Amount</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Beneficiary</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Created</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((payment: any) => (
                    <tr 
                      key={payment.id} 
                      className="border-b border-border/50 hover:bg-muted/30 transition-colors cursor-pointer"
                      onClick={() => navigate(`/payments/${payment.id}`)}
                    >
                      <td className="py-3 px-4 font-mono text-accent font-medium">
                        {payment.payment_id || `PAY-${payment.id}`}
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium text-foreground">{payment.loan_number}</p>
                          <p className="text-xs text-muted-foreground">Loan Amount: {formatCurrency(Number(payment.loan_amount || 0))}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-medium text-foreground">{payment.applicant_name}</p>
                      </td>
                      <td className="py-3 px-4">
                        <span className="capitalize">{payment.payment_type?.replace(/_/g, ' ')}</span>
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-foreground">
                        {formatCurrency(Number(payment.amount))}
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium text-foreground">{payment.beneficiary_name}</p>
                          <p className="text-xs text-muted-foreground">{payment.bank_name}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <PaymentStatusBadge status={payment.status} />
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">
                        {new Date(payment.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => navigate(`/payments/${payment.id}`)}
                            className="p-1.5 rounded-md border border-border bg-card hover:bg-accent/10 transition-colors"
                            title="View Details"
                          >
                            <Eye size={14} />
                          </button>
                          
                          {canApprove && payment.status === 'pending' && (
                            <>
                              <button
                                onClick={() => updateStatus.mutate({ id: payment.id, status: 'manager_approved' })}
                                className="p-1.5 rounded-md bg-green-500/10 text-green-600 hover:bg-green-500/20 transition-colors"
                                title="Approve"
                              >
                                <CheckCircle size={14} />
                              </button>
                              <button
                                onClick={() => updateStatus.mutate({ id: payment.id, status: 'rejected' })}
                                className="p-1.5 rounded-md bg-red-500/10 text-red-600 hover:bg-red-500/20 transition-colors"
                                title="Reject"
                              >
                                <XCircle size={14} />
                              </button>
                            </>
                          )}
                          
                          {canProcess && payment.status === 'manager_approved' && (
                            <button
                              onClick={() => navigate(`/payments/${payment.id}/voucher`)}
                              className="p-1.5 rounded-md bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 transition-colors"
                              title="Create Voucher"
                            >
                              <FileText size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filtered.length === 0 && !isLoading && (
                <div className="py-12 text-center text-muted-foreground">No payment applications found</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}