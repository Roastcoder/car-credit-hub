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
    <div className="p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Accounts Receivable</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage and track your incoming revenue and outgoing invoices</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2 border-slate-200 dark:border-slate-800">
            <Download size={16} />
            Export
          </Button>
          
          <Button 
            className="gap-2 bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-600/20"
            onClick={() => navigate('/loans/new')}
          >
            <Plus size={16} />
            New Invoice
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="glass-card p-4 rounded-xl border border-white/20 dark:border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Outstanding</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">{formatCurrency(stats.totalOutstanding)}</p>
            </div>
          </div>
        </div>
        <div className="glass-card p-4 rounded-xl border border-white/20 dark:border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Overdue</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">{formatCurrency(stats.overdue)}</p>
            </div>
          </div>
        </div>
        <div className="glass-card p-4 rounded-xl border border-white/20 dark:border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-yellow-100 dark:bg-yellow-900/20 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Due Soon</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">{formatCurrency(stats.dueSoon)}</p>
            </div>
          </div>
        </div>
        <div className="glass-card p-4 rounded-xl border border-white/20 dark:border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Paid/Settled</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">{formatCurrency(stats.current)}</p>
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
            placeholder="Search customers..."
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
          <option value="overdue">Overdue</option>
          <option value="due-soon">Due Soon</option>
          <option value="current">Current</option>
        </select>
        <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
          <Filter size={16} />
          Filter
        </button>
      </div>

      {/* Receivables Table */}
      <div className="glass-card rounded-xl border border-white/20 dark:border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Due Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Days</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500 animate-pulse">Loading receivables...</td>
                </tr>
              ) : filteredReceivables.length > 0 ? (
                filteredReceivables.map((item: any) => (
                  <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900 dark:text-white">{item.customer_name}</div>
                      <div className="text-xs text-gray-500">{item.invoice_number}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-semibold text-gray-900 dark:text-white">{formatCurrency(parseFloat(item.amount))}</div>
                      <div className="text-xs text-gray-500">Bal: {formatCurrency(parseFloat(item.outstanding_amount))}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600 dark:text-gray-400">
                      {new Date(item.due_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(item.status)}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600 dark:text-gray-400">
                      {item.days_overdue > 0 ? `${item.days_overdue} days late` : `Due in ${Math.abs(item.days_overdue)} days`}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <button 
                          className="p-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                          onClick={() => {
                            if (item.application_id) {
                              navigate(`/payments/${item.application_id}`);
                            } else if (item.loan_id) {
                              navigate(`/loans/${item.loan_id}`);
                            } else {
                              toast.info('No associated record found');
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
                              navigate(`/payments/applications/edit/${item.application_id}`);
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
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center">
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
                        className="gap-2 border-dashed border-blue-200 hover:border-blue-500 hover:bg-blue-50 dark:border-blue-800 dark:hover:bg-blue-900/20"
                        onClick={() => navigate('/loans/new')}
                      >
                        <Plus size={14} />
                        Create Manual Invoice
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