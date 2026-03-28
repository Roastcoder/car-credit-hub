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
    <div className="p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Accounts Payable</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage and track your outgoing payments and vendor bills</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2 border-slate-200 dark:border-slate-800">
            <Download size={16} />
            Export
          </Button>
          
          <Button 
            className="gap-2 bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-600/20"
            onClick={() => navigate('/payments/applications/new')}
          >
            <Plus size={16} />
            Record New Bill
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
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            placeholder="Search vendors..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="paid">Paid</option>
          <option value="draft">Draft</option>
        </select>
        <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
          <Filter size={16} />
          Filter
        </button>
      </div>

      {/* Payables Table */}
      <div className="glass-card rounded-xl border border-white/20 dark:border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Vendor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Due Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500 animate-pulse">Loading payables...</td>
                </tr>
              ) : filteredPayables.length > 0 ? (
                filteredPayables.map((item: any) => (
                  <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900 dark:text-white">{item.vendor_name}</div>
                      <div className="text-xs text-gray-500">{item.bill_number}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-semibold text-gray-900 dark:text-white">{formatCurrency(parseFloat(item.amount))}</div>
                      <div className="text-xs text-gray-500">Bal: {formatCurrency(parseFloat(item.outstanding_amount))}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600 dark:text-gray-400">
                      {new Date(item.due_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600 dark:text-gray-400">
                      {item.category}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(item.status)}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <button 
                          className="p-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                          onClick={() => {
                            if (item.application_id) {
                              navigate(`/payments/applications/${item.application_id}`);
                            } else if (item.loan_id) {
                              navigate(`/loans/${item.loan_id}`);
                            } else {
                              toast.info('No associated payment or loan found for this record');
                            }
                          }}
                          title="View Details"
                        >
                          <Eye size={16} />
                        </button>
                        <button 
                          className="p-1 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-300"
                          onClick={() => {
                            if (item.application_id) {
                              navigate(`/payments/edit/${item.application_id}`);
                            } else if (item.loan_id) {
                              navigate(`/loans/${item.loan_id}/edit`);
                            } else {
                              toast.info('Direct edit not available for this record');
                            }
                          }}
                          title="Edit Record"
                        >
                          <Edit size={16} />
                        </button>
                        {item.status === 'Approved' && (
                          <div className="flex flex-col gap-1">
                            <button 
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/20 dark:hover:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 rounded-lg text-xs font-semibold transition-colors border border-indigo-100 dark:border-indigo-800/50"
                              onClick={() => {
                                if (item.application_id) {
                                  navigate(`/payments/applications/${item.application_id}`);
                                } else {
                                  toast.info('Please process this via the Payments module', {
                                    icon: <Info size={16} className="text-indigo-500" />
                                  });
                                }
                              }}
                            >
                              <CreditCard size={14} />
                              Process
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center">
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
                        className="gap-2 border-dashed border-red-200 hover:border-red-500 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-900/20"
                        onClick={() => navigate('/payments/applications/new')}
                      >
                        <Plus size={14} />
                        Record Manual Bill
                      </Button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}