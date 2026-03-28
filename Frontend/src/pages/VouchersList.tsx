import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, Filter, Eye, FileText, Download, Receipt, Calendar, User, DollarSign, ArrowRight } from 'lucide-react';
import { paymentApplicationAPI } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from 'sonner';

export default function VouchersList() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPeriod, setFilterPeriod] = useState('all');

  const { data: applications = [], isLoading } = useQuery({
    queryKey: ['payment-applications'],
    queryFn: () => paymentApplicationAPI.getAll(),
  });

  // Filter for items that have a voucher generated
  const vouchers = applications.filter((app: any) => 
    app.voucher_number && (
      app.voucher_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.applicant_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.payment_id?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

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
        <>
          {/* Mobile Card View */}
          <div className="md:hidden space-y-4 mb-8">
            {vouchers.map((v: any) => (
              <div key={v.id} className="glass-card p-5 rounded-2xl border border-white/20 dark:border-white/10 shadow-sm relative overflow-hidden group">
                <div className="flex items-center justify-between mb-3 relative z-10">
                  <div className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${getStatusColor(v.status)}`}>
                    {statusLabel(v.status)}
                  </div>
                  <div className="text-[10px] text-gray-500 font-mono font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded">
                    {v.voucher_number}
                  </div>
                </div>
                
                <div className="flex items-start justify-between mb-4 relative z-10">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white leading-tight mb-1">{v.applicant_name}</h3>
                    <p className="text-xs text-gray-500 mb-2 truncate max-w-[200px]">{v.payment_purpose}</p>
                    <div className="flex items-center gap-2 text-[10px] text-gray-400">
                      <Calendar size={10} />
                      {new Date(v.voucher_date || v.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-green-600 dark:text-green-400">{formatCurrency(parseFloat(v.payment_amount || v.amount || 0))}</p>
                    <p className="text-[10px] text-gray-500 font-mono lowercase">{v.payment_method?.replace('_', ' ')}</p>
                  </div>
                </div>

                <div className="pt-4 border-t border-white/10 relative z-10">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full gap-2 rounded-xl text-xs h-9 bg-white/50 dark:bg-white/5"
                    onClick={() => navigate(`/payments/${v.id}`)}
                  >
                    <Eye size={14} />
                    View Details
                    <ArrowRight size={14} className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block glass-card rounded-2xl border border-white/20 dark:border-white/10 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-white/10">
                  <tr>
                    <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Voucher No</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Date</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Applicant / Vendor</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Amount</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Method</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Status</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                  {vouchers.map((v: any) => (
                    <tr key={v.id} className="hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors group">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-bold text-blue-600 dark:text-blue-400 font-mono text-sm">{v.voucher_number}</div>
                        <div className="text-[10px] text-gray-400 font-mono">{v.payment_id || `PAY-${v.id}`}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                        {new Date(v.voucher_date || v.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-semibold text-gray-900 dark:text-white">{v.applicant_name}</div>
                        <div className="text-[10px] text-gray-500 truncate max-w-xs">{v.payment_purpose}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-bold text-green-600 dark:text-green-400 text-base">{formatCurrency(parseFloat(v.payment_amount || v.amount || 0))}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-600 dark:text-gray-400 capitalize">
                        {v.payment_method?.replace('_', ' ') || '—'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full ${getStatusColor(v.status)}`}>
                          {statusLabel(v.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 gap-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg group-hover:bg-blue-50 dark:group-hover:bg-blue-900/30"
                          onClick={() => navigate(`/payments/${v.id}`)}
                        >
                          <Eye size={16} />
                          Details
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
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
