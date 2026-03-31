import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, Filter, Plus, Eye, Edit, Download, TrendingUp, X, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { accountAPI } from '@/lib/api';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function AccountsReceivable() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const { data: receivables = [], isLoading } = useQuery({
    queryKey: ['accounts-receivables'],
    queryFn: () => accountAPI.getReceivables()
  });


  const filteredReceivables = receivables.filter((item: any) => {
    const matchesSearch = item.customer_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || item.status?.toLowerCase() === filterStatus.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  const stats = {
    totalOutstanding: receivables.reduce((sum: number, item: any) => sum + parseFloat(item.outstanding_amount || 0), 0),
    overdue: receivables.filter((item: any) => item.status === 'Overdue').reduce((sum: number, item: any) => sum + parseFloat(item.outstanding_amount || 0), 0),
    dueSoon: receivables.filter((item: any) => item.status === 'Sent' || item.status === 'Due Soon').reduce((sum: number, item: any) => sum + parseFloat(item.outstanding_amount || 0), 0),
    current: receivables.filter((item: any) => item.status === 'Paid').reduce((sum: number, item: any) => sum + parseFloat(item.amount || 0), 0)
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Overdue': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'Due Soon': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'Current': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  return (
    <div className="p-3 md:p-4 pb-24 md:pb-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 md:mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Accounts Receivable</h1>
          <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 mt-1">Manage and track your incoming revenue</p>
        </div>
        
        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
          <Button variant="outline" size="sm" className="gap-2 border-slate-200 dark:border-slate-800 whitespace-nowrap">
            <Download size={14} />
            Export
          </Button>
          
          <Button 
            size="sm"
            className="gap-2 bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-600/20 whitespace-nowrap"
            onClick={() => navigate('/loans/new')}
          >
            <Plus size={14} />
            New Invoice
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-5">
        <div className="glass-card p-3.5 rounded-xl border border-white/20 dark:border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wide font-medium">Total Outstanding</p>
              <p className="text-base font-bold text-gray-900 dark:text-white">{formatCurrency(stats.totalOutstanding)}</p>
            </div>
          </div>
        </div>
        <div className="glass-card p-3.5 rounded-xl border border-white/20 dark:border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wide font-medium">Overdue</p>
              <p className="text-base font-bold text-gray-900 dark:text-white">{formatCurrency(stats.overdue)}</p>
            </div>
          </div>
        </div>
        <div className="glass-card p-3.5 rounded-xl border border-white/20 dark:border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-yellow-100 dark:bg-yellow-900/20 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <p className="text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wide font-medium">Due Soon</p>
              <p className="text-base font-bold text-gray-900 dark:text-white">{formatCurrency(stats.dueSoon)}</p>
            </div>
          </div>
        </div>
        <div className="glass-card p-3.5 rounded-xl border border-white/20 dark:border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wide font-medium">Paid/Settled</p>
              <p className="text-base font-bold text-gray-900 dark:text-white">{formatCurrency(stats.current)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            placeholder="Search customers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-all shadow-sm"
          />
        </div>
        <div className="flex items-center gap-2">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="flex-1 sm:w-40 px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-all shadow-sm"
          >
            <option value="all">All Status</option>
            <option value="overdue">Overdue</option>
            <option value="due-soon">Due Soon</option>
            <option value="current">Current</option>
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
      ) : filteredReceivables.length > 0 ? (
        <>
          {/* Mobile Card View */}
          <div className="md:hidden space-y-4 mb-8">
            {filteredReceivables.map((item: any) => (
              <div key={item.id} className="glass-card p-5 rounded-2xl border border-white/20 dark:border-white/10 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${getStatusColor(item.status)}`}>
                    {item.status}
                  </div>
                  <div className="text-[10px] text-gray-500 font-mono">#{item.invoice_number}</div>
                </div>
                
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white leading-tight mb-1">{item.customer_name}</h3>
                    <p className="text-xs text-gray-500">
                      {new Date(item.due_date).toLocaleDateString()} • {item.days_overdue > 0 ? `${item.days_overdue} days late` : `Due in ${Math.abs(item.days_overdue)} days`}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-blue-600 dark:text-blue-400">{formatCurrency(parseFloat(item.outstanding_amount))}</p>
                    <p className="text-[10px] text-gray-500">of {formatCurrency(parseFloat(item.amount))}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-4 border-t border-white/10">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1 gap-2 rounded-xl text-xs h-9"
                    onClick={() => {
                      if (item.application_id) navigate(`/account/payments/${item.application_id}`);
                      else if (item.loan_id) navigate(`/loans/${item.loan_id}`);
                      else toast.info('No record found');
                    }}
                  >
                    <Eye size={14} />
                    View
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1 gap-2 rounded-xl text-xs h-9"
                    onClick={() => {
                      if (item.application_id) navigate(`/account/payments/edit/${item.application_id}`);
                      else if (item.loan_id) navigate(`/loans/${item.loan_id}/edit`);
                    }}
                  >
                    <Edit size={14} />
                    Edit
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block glass-card rounded-2xl border border-white/20 dark:border-white/10 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50/50 dark:bg-slate-900/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-widest">Customer</th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-widest">Amount</th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-widest">Due Date</th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-widest">Status</th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-widest">Days</th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-widest">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                  {filteredReceivables.map((item: any) => (
                    <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="font-semibold text-sm text-gray-900 dark:text-white">{item.customer_name}</div>
                        <div className="text-[10px] text-gray-500 font-mono">{item.invoice_number}</div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="font-bold text-sm text-gray-900 dark:text-white">{formatCurrency(parseFloat(item.amount))}</div>
                        <div className="text-[10px] text-gray-500">Bal: {formatCurrency(parseFloat(item.outstanding_amount))}</div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-600 dark:text-gray-400">
                        {new Date(item.due_date).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full ${getStatusColor(item.status)}`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-600 dark:text-gray-400">
                        {item.days_overdue > 0 ? (
                          <span className="text-red-500 font-medium">{item.days_overdue} days late</span>
                        ) : (
                          <span className="text-green-500 font-medium">Due in {Math.abs(item.days_overdue)} days</span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-blue-600" onClick={() => navigate(item.application_id ? `/account/payments/${item.application_id}` : `/loans/${item.loan_id}`)}>
                            <Eye size={14} />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-500" onClick={() => navigate(item.application_id ? `/account/payments/edit/${item.application_id}` : `/loans/${item.loan_id}/edit`)}>
                            <Edit size={14} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <div className="glass-card p-12 text-center rounded-2xl border border-white/20 dark:border-white/10 shadow-sm">
          <div className="flex flex-col items-center justify-center max-w-[300px] mx-auto">
            <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/10 rounded-full flex items-center justify-center mb-4 transition-transform hover:scale-110">
              <FileText className="h-8 w-8 text-blue-500" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">No Receivables Yet</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-6">
              Accounting data is automatically generated when loans are processed or manually created.
            </p>
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-2 border-dashed border-blue-200 hover:border-blue-500 hover:bg-blue-50 dark:border-blue-800 dark:hover:bg-blue-900/20 rounded-xl"
              onClick={() => navigate('/loans/new')}
            >
              <Plus size={14} />
              Create Manual Invoice
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}