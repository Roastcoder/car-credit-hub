import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, Filter, Eye, Download, Receipt, Calendar, DollarSign } from 'lucide-react';
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

  // Filter for items that have a voucher generated
  const vouchers = applications.filter((app: any) => {
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

  const statusLabel = (status: string) => {
    return status.replace('_', ' ').toUpperCase();
  };

  const getPrimaryAction = (voucher: any) => {
    if (voucher.status === 'voucher_created') {
      return 'Add UTR';
    }
    if (voucher.status === 'payment_released') {
      return 'Upload Proof';
    }
    return 'Open Voucher';
  };

  return (
    <div className="p-4 md:p-6 pb-24 md:pb-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 md:mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Payment Vouchers</h1>
          <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 mt-1">Centralized track of all generated payment vouchers</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2 border-slate-200 dark:border-slate-800">
            <Download size={14} />
            Export List
          </Button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {formatCurrency(vouchers.reduce((sum, v) => sum + parseFloat(v.payment_amount || v.amount || 0), 0))}
            </p>
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
                const date = new Date(v.voucher_date || v.created_at);
                const now = new Date();
                return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
              }).length}
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
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

      {/* Content View */}
      {isLoading ? (
        <div className="flex items-center justify-center p-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : vouchers.length > 0 ? (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {vouchers.map((v: any) => (
            <div
              key={v.id}
              className="relative overflow-hidden rounded-[1.6rem] border border-[#d8cdf9] bg-[linear-gradient(135deg,#f7f1ff_0%,#fffaf5_52%,#ffffff_100%)] shadow-[0_14px_38px_rgba(94,53,177,0.10)]"
            >
              <div className="absolute inset-y-0 left-0 hidden sm:flex w-20 items-center justify-center bg-[linear-gradient(180deg,#5b2fd1_0%,#7d56f3_100%)] text-white">
                <span className="rotate-180 text-base font-extrabold tracking-[0.28em] [writing-mode:vertical-rl]">
                  VOUCHER
                </span>
              </div>

              <div className="absolute left-[4.5rem] top-1/2 hidden h-8 w-8 -translate-y-1/2 -translate-x-1/2 rounded-full border border-[#e9dcff] bg-white sm:block" />
              <div className="absolute right-0 top-1/2 hidden h-8 w-8 translate-x-1/2 -translate-y-1/2 rounded-full border border-[#e9dcff] bg-white sm:block" />

              <div className="relative p-4 sm:pl-24 sm:pr-6 sm:py-5">
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-[#6f5f89]">
                      Voucher for {v.payment_purpose || 'Payment Release'}
                    </p>
                    <h3 className="mt-1 truncate text-2xl font-black tracking-tight text-[#241a3d]">
                      {v.voucher_number}
                    </h3>
                    <p className="mt-1.5 text-sm text-[#5e5873]">
                      {v.applicant_name}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 self-start rounded-full border border-[#eadfff] bg-white/80 px-2.5 py-1.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full border border-[#efe7ff] bg-[#faf6ff]">
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#7b43f1]">
                        <div className="h-3 w-3 rounded-full bg-[#ff9559]" />
                      </div>
                    </div>
                    <span className={`rounded-full px-2.5 py-1 text-[9px] font-extrabold tracking-[0.16em] ${getStatusColor(v.status)}`}>
                      {statusLabel(v.status)}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 text-sm text-[#5f5a70] sm:grid-cols-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8a7da8]">Amount</p>
                    <p className="mt-1 text-xl font-black text-[#1e8e57]">
                      {formatCurrency(parseFloat(v.payment_amount || v.amount || 0))}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8a7da8]">Method</p>
                    <p className="mt-1 font-semibold capitalize text-[#241a3d]">
                      {v.payment_method?.replace('_', ' ') || 'Not set'}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8a7da8]">Date</p>
                    <p className="mt-1 font-semibold text-[#241a3d]">
                      {new Date(v.voucher_date || v.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="mt-4 rounded-[1.15rem] border border-dashed border-[#e1d7f8] bg-white/70 px-3.5 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8a7da8]">Payment Request</p>
                  <p className="mt-1 truncate text-sm font-semibold text-[#241a3d]">
                    {v.payment_id || `PAY-${v.id}`}
                  </p>
                  <p className="mt-1 truncate text-sm text-[#5f5a70]">
                    {v.payment_purpose || 'No purpose added'}
                  </p>
                </div>

                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-2 text-xs text-[#655b7f]">
                    <Calendar size={15} className="text-[#7b43f1]" />
                    <span>
                      {v.status === 'voucher_created'
                        ? 'Waiting for UTR update'
                        : v.status === 'payment_released'
                        ? 'Waiting for proof upload'
                        : 'Voucher completed'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-full border-[#e4d9ff] bg-white text-[#3e2b74] hover:bg-[#f8f2ff]"
                      onClick={() => navigate(`/payments/${v.id}`)}
                    >
                      <Eye size={14} className="mr-2" />
                      Details
                    </Button>
                    <Button
                      size="sm"
                      className="rounded-full bg-[#5b2fd1] text-white hover:bg-[#4c25b3]"
                      onClick={() => navigate(`/payments/${v.id}`)}
                    >
                      {getPrimaryAction(v)}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="glass-card p-20 text-center rounded-3xl border border-white/20 dark:border-white/10 shadow-sm bg-white/30 dark:bg-white/5">
          <div className="flex flex-col items-center justify-center max-w-sm mx-auto">
            <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/10 rounded-3xl flex items-center justify-center mb-6 transition-transform hover:scale-110 shadow-inner">
              <Receipt className="h-10 w-10 text-blue-500" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No Vouchers Found</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-0">
              Vouchers will appear here once they are generated for approved payment applications. 
              {searchTerm && " Try adjusting your search query."}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
