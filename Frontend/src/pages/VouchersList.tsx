import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, Filter, Download, Receipt, Calendar, DollarSign } from 'lucide-react';
import { paymentApplicationAPI } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { Button } from "@/components/ui/button";

export default function VouchersList() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPeriod, setFilterPeriod] = useState('all');

  const { data: applications = [], isLoading } = useQuery({
    queryKey: ['payment-applications'],
    queryFn: () => paymentApplicationAPI.getAll(),
  });

  const matchesPeriod = (dateValue: string) => {
    if (filterPeriod === 'all') return true;
    const date = new Date(dateValue);
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(startOfToday);
    startOfWeek.setDate(startOfToday.getDate() - startOfToday.getDay());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    if (filterPeriod === 'today') return date >= startOfToday;
    if (filterPeriod === 'this-week') return date >= startOfWeek;
    if (filterPeriod === 'this-month') return date >= startOfMonth;
    return true;
  };

  const vouchers = (applications as any[]).filter((app: any) => {
    if (!app.voucher_number) return false;
    const matchesSearch =
      app.voucher_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.applicant_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.payment_id?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch && matchesPeriod(app.voucher_date || app.created_at);
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'voucher_created': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400';
      case 'payment_released': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const statusLabel = (status: string) => status.replace(/_/g, ' ').toUpperCase();

  const getPrimaryAction = (voucher: any) => {
    if (voucher.status === 'voucher_created') return 'Add UTR';
    if (voucher.status === 'payment_released') return 'Upload Proof';
    return 'Open';
  };

  const totalValue = vouchers.reduce((sum, v) => sum + parseFloat(v.payment_amount || v.amount || 0), 0);

  return (
    <div className="p-4 md:p-6 pb-24 md:pb-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 md:mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Payment Vouchers</h1>
          <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 mt-1">Centralized track of all generated payment vouchers</p>
        </div>
        <Button variant="outline" size="sm" className="gap-2 border-slate-200 dark:border-slate-800 w-fit">
          <Download size={14} /> Export List
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="glass-card p-5 rounded-2xl border border-white/20 dark:border-white/10 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center text-purple-600">
            <Receipt size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Vouchers</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{vouchers.length}</p>
          </div>
        </div>
        <div className="glass-card p-5 rounded-2xl border border-white/20 dark:border-white/10 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-900/20 flex items-center justify-center text-green-600">
            <DollarSign size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Value</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(totalValue)}</p>
          </div>
        </div>
        <div className="glass-card p-5 rounded-2xl border border-white/20 dark:border-white/10 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center text-blue-600">
            <Calendar size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Created This Month</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {vouchers.filter(v => {
                const d = new Date(v.voucher_date || v.created_at);
                const now = new Date();
                return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
              }).length}
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            placeholder="Search by Voucher No, Applicant or Payment ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-all shadow-sm"
          />
        </div>
        <div className="flex items-center gap-2">
          <select
            value={filterPeriod}
            onChange={(e) => setFilterPeriod(e.target.value)}
            className="flex-1 sm:w-40 px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-all shadow-sm"
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="this-week">This Week</option>
            <option value="this-month">This Month</option>
          </select>
          <Button variant="outline" size="icon" className="rounded-xl border-gray-300 dark:border-gray-600">
            <Filter size={16} />
          </Button>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center p-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      ) : vouchers.length === 0 ? (
        <div className="glass-card p-20 text-center rounded-3xl border border-white/20 dark:border-white/10 shadow-sm">
          <div className="flex flex-col items-center justify-center max-w-sm mx-auto">
            <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/10 rounded-3xl flex items-center justify-center mb-6">
              <Receipt className="h-10 w-10 text-blue-500" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No Vouchers Found</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
              Vouchers will appear here once they are generated for approved payment applications.
              {searchTerm && ' Try adjusting your search query.'}
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Mobile Cards */}
          <div className="grid grid-cols-1 gap-4 md:hidden">
            {vouchers.map((v: any) => (
              <div
                key={v.id}
                onClick={() => navigate(`/payments/${v.id}`)}
                className="bg-card border border-border rounded-xl p-4 cursor-pointer hover:shadow-md transition-all"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-purple-600 font-mono">{v.voucher_number}</span>
                  <span className={`px-2 py-0.5 text-[9px] font-bold uppercase rounded-full ${getStatusColor(v.status)}`}>
                    {statusLabel(v.status)}
                  </span>
                </div>
                <p className="text-sm font-semibold text-foreground">{v.applicant_name}</p>
                <p className="text-xs text-muted-foreground mb-2">{v.loan_number}</p>
                <div className="flex items-center justify-between">
                  <p className="text-lg font-bold text-green-600">{formatCurrency(parseFloat(v.payment_amount || v.amount || 0))}</p>
                  <p className="text-xs text-muted-foreground">{new Date(v.voucher_date || v.created_at).toLocaleDateString('en-IN')}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table */}
          <div className="hidden md:block bg-card border border-border rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50 border-b border-border">
                    <th className="px-4 py-3 text-left text-[10px] font-bold text-muted-foreground uppercase tracking-wider">#</th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Voucher No</th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Date</th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Applicant</th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Loan No</th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Method</th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold text-muted-foreground uppercase tracking-wider">UTR / Ref</th>
                    <th className="px-4 py-3 text-right text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Amount</th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {vouchers.map((v: any, idx: number) => (
                    <tr
                      key={v.id}
                      onClick={() => navigate(`/payments/${v.id}`)}
                      className="hover:bg-muted/30 transition-colors cursor-pointer"
                    >
                      <td className="px-4 py-3 text-xs text-muted-foreground">{idx + 1}</td>
                      <td className="px-4 py-3">
                        <span className="font-bold text-purple-600 dark:text-purple-400 font-mono">{v.voucher_number}</span>
                      </td>
                      <td className="px-4 py-3 text-xs text-foreground whitespace-nowrap">
                        {new Date(v.voucher_date || v.created_at).toLocaleDateString('en-IN')}
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-xs font-bold text-foreground">{v.applicant_name}</p>
                        <p className="text-[10px] text-muted-foreground">{v.applicant_phone}</p>
                      </td>
                      <td className="px-4 py-3 text-xs font-mono text-accent">{v.loan_number || '—'}</td>
                      <td className="px-4 py-3 text-xs text-foreground capitalize">{v.payment_method?.replace(/_/g, ' ') || '—'}</td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400">
                          {v.utr_number || v.reference_number || '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-sm font-extrabold text-green-600 dark:text-green-400">
                          {formatCurrency(parseFloat(v.payment_amount || v.amount || 0))}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded-full ${getStatusColor(v.status)}`}>
                          {statusLabel(v.status)}
                        </span>
                      </td>
                      <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                        <Button
                          size="sm"
                          className="h-7 px-3 text-[10px] font-bold rounded-lg bg-purple-600 hover:bg-purple-700 text-white"
                          onClick={() => navigate(`/payments/${v.id}`)}
                        >
                          {getPrimaryAction(v)}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-muted/50 border-t-2 border-border">
                    <td colSpan={7} className="px-4 py-3 text-xs font-bold text-muted-foreground">
                      Total ({vouchers.length} vouchers)
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-extrabold text-green-600">
                      {formatCurrency(totalValue)}
                    </td>
                    <td colSpan={2} />
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
