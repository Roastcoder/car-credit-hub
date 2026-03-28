import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, Filter, Plus, Eye, Edit, CreditCard, Receipt, Download, Info } from 'lucide-react';
import { accountAPI } from '@/lib/api';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function AccountsPayable() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const { data: payables = [], isLoading } = useQuery({
    queryKey: ['payables'],
    queryFn: () => accountAPI.getPayables(),
  });

  const filteredPayables = payables.filter((item: any) => {
    const matchesSearch = item.vendor_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || item.status?.toLowerCase() === filterStatus.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  const stats = {
    totalPayable: payables.reduce((sum: number, item: any) => sum + parseFloat(item.outstanding_amount || 0), 0),
    pending: payables.filter((item: any) => item.status === 'Pending').reduce((sum: number, item: any) => sum + parseFloat(item.outstanding_amount || 0), 0),
    approved: payables.filter((item: any) => item.status === 'Approved').reduce((sum: number, item: any) => sum + parseFloat(item.outstanding_amount || 0), 0),
    draft: payables.filter((item: any) => item.status === 'Draft').reduce((sum: number, item: any) => sum + parseFloat(item.outstanding_amount || 0), 0)
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
      case 'Pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'Approved': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'Paid': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'Draft': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  return (
    <div className="p-4 md:p-6 pb-24 md:pb-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 md:mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Accounts Payable</h1>
          <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 mt-1">Manage and track your outgoing payments</p>
        </div>
        
        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
          <Button variant="outline" size="sm" className="gap-2 border-slate-200 dark:border-slate-800 whitespace-nowrap">
            <Download size={14} />
            Export
          </Button>
          
          <Button 
            size="sm"
            className="gap-2 bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-600/20 whitespace-nowrap"
            onClick={() => navigate('/payments/new')}
          >
            <Plus size={14} />
            Record Bill
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="glass-card p-4 rounded-xl border border-white/20 dark:border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
              <Receipt className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Payable</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">{formatCurrency(stats.totalPayable)}</p>
            </div>
          </div>
        </div>
        <div className="glass-card p-4 rounded-xl border border-white/20 dark:border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-yellow-100 dark:bg-yellow-900/20 flex items-center justify-center">
              <Receipt className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Pending</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">{formatCurrency(stats.pending)}</p>
            </div>
          </div>
        </div>
        <div className="glass-card p-4 rounded-xl border border-white/20 dark:border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
              <Receipt className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Approved</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">{formatCurrency(stats.approved)}</p>
            </div>
          </div>
        </div>
        <div className="glass-card p-4 rounded-xl border border-white/20 dark:border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-900/20 flex items-center justify-center">
              <Receipt className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Draft</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">{formatCurrency(stats.draft)}</p>
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
            placeholder="Search vendors..."
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
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="paid">Paid</option>
            <option value="draft">Draft</option>
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
      ) : filteredPayables.length > 0 ? (
        <>
          {/* Mobile Card View */}
          <div className="md:hidden space-y-4 mb-8">
            {filteredPayables.map((item: any) => (
              <div key={item.id} className="glass-card p-5 rounded-2xl border border-white/20 dark:border-white/10 shadow-sm relative overflow-hidden">
                <div className="flex items-center justify-between mb-3 relative z-10">
                  <div className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${getStatusColor(item.status)}`}>
                    {item.status}
                  </div>
                  <div className="text-[10px] text-gray-500 font-mono">#{item.bill_number}</div>
                </div>
                
                <div className="flex items-start justify-between mb-4 relative z-10">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white leading-tight mb-1">{item.vendor_name}</h3>
                    <p className="text-xs text-gray-500 mb-2">{item.category}</p>
                    <p className="text-[10px] text-gray-400">
                      Due: {new Date(item.due_date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-red-600 dark:text-red-400">{formatCurrency(parseFloat(item.outstanding_amount))}</p>
                    <p className="text-[10px] text-gray-500">of {formatCurrency(parseFloat(item.amount))}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-4 border-t border-white/10 relative z-10">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1 gap-2 rounded-xl text-xs h-9"
                    onClick={() => {
                      const validId = parseInt(item.application_id);
                      if (!isNaN(validId)) navigate(`/account/payments/${validId}`);
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
                      const validId = parseInt(item.application_id);
                      if (!isNaN(validId)) navigate(`/account/payments/edit/${validId}`);
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
                    <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-500 uppercase tracking-widest">Vendor</th>
                    <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-500 uppercase tracking-widest">Amount</th>
                    <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-500 uppercase tracking-widest">Due Date</th>
                    <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-500 uppercase tracking-widest">Category</th>
                    <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-500 uppercase tracking-widest">Status</th>
                    <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-500 uppercase tracking-widest">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                  {filteredPayables.map((item: any) => (
                    <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-semibold text-gray-900 dark:text-white">{item.vendor_name}</div>
                        <div className="text-[10px] text-gray-500 font-mono">{item.bill_number}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-bold text-gray-900 dark:text-white">{formatCurrency(parseFloat(item.amount))}</div>
                        <div className="text-[10px] text-gray-500">Bal: {formatCurrency(parseFloat(item.outstanding_amount))}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                        {new Date(item.due_date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                        {item.category}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full ${getStatusColor(item.status)}`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-blue-600" 
                            onClick={() => {
                              const validId = parseInt(item.application_id);
                              if (!isNaN(validId)) navigate(`/account/payments/${validId}`);
                              else if (item.loan_id) navigate(`/loans/${item.loan_id}`);
                            }}
                          >
                            <Eye size={16} />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-gray-500" 
                            onClick={() => {
                              const validId = parseInt(item.application_id);
                              if (!isNaN(validId)) navigate(`/account/payments/edit/${validId}`);
                              else if (item.loan_id) navigate(`/loans/${item.loan_id}/edit`);
                            }}
                          >
                            <Edit size={16} />
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
            <div className="w-16 h-16 bg-red-50 dark:bg-red-900/10 rounded-full flex items-center justify-center mb-4 transition-transform hover:scale-110">
              <Receipt className="h-8 w-8 text-red-500" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">No Payables Yet</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-6">
              Bills and commissions will appear here once they are approved or manually recorded.
            </p>
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-2 border-dashed border-red-200 hover:border-red-500 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-900/20 rounded-xl"
              onClick={() => navigate('/payments/new')}
            >
              <Plus size={14} />
              Record Manual Bill
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}