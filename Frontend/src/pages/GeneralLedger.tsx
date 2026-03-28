import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Filter, Download, Calendar, FileText, BookOpen, ArrowUpRight, ArrowDownRight, History } from 'lucide-react';
import { accountAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

export default function GeneralLedger() {
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState('this-month');

  const { data: ledgerData, isLoading } = useQuery({
    queryKey: ['general-ledger', dateRange],
    queryFn: () => accountAPI.getLedger({ period: dateRange })
  });

  const transactions = ledgerData?.transactions || [];
  const accountSummary = ledgerData?.summary || [
    { account: 'Assets', balance: '₹0', type: 'debit' },
    { account: 'Liabilities', balance: '₹0', type: 'credit' },
    { account: 'Equity', balance: '₹0', type: 'credit' },
    { account: 'Revenue', balance: '₹0', type: 'credit' },
    { account: 'Expenses', balance: '₹0', type: 'debit' }
  ];

  const filteredTransactions = transactions.filter((t: any) => 
    t.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.account_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatCurrency = (amount: number | string) => {
    const val = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">General Ledger</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Complete record of every financial transaction across all accounts</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2 border-slate-200 dark:border-slate-800">
            <Download size={16} />
            Export Ledger
          </Button>
          <Button className="gap-2 bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-600/20">
            <FileText size={16} />
            Trial Balance
          </Button>
        </div>
      </div>

      {/* Account Summary */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        {accountSummary.map((item, index) => (
          <div key={index} className="glass-card p-4 rounded-xl border border-white/20 dark:border-white/10">
            <div className="text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{item.account}</p>
              <p className={`text-lg font-semibold ${
                item.type === 'debit' ? 'text-blue-600 dark:text-blue-400' : 'text-green-600 dark:text-green-400'
              }`}>
                {item.balance}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6 bg-white/50 dark:bg-black/20 p-2 rounded-2xl border border-white/20 dark:border-white/10 backdrop-blur-sm">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search by description or account..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 border-none shadow-none focus-visible:ring-1 focus-visible:ring-blue-500/20 bg-transparent"
          />
        </div>
        
        <Select value={dateRange} onValueChange={setDateRange}>
          <SelectTrigger className="w-[180px] border-none bg-white dark:bg-slate-900/50">
            <div className="flex items-center gap-2">
              <Calendar size={14} />
              <SelectValue placeholder="Period" />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="this-week">This Week</SelectItem>
            <SelectItem value="this-month">This Month</SelectItem>
            <SelectItem value="this-quarter">This Quarter</SelectItem>
            <SelectItem value="this-year">This Year</SelectItem>
          </SelectContent>
        </Select>

        <Button variant="outline" size="icon" className="border-none bg-white dark:bg-slate-900/50">
          <Filter size={16} />
        </Button>
      </div>

      {/* Transactions Table */}
      <div className="glass-card rounded-xl border border-white/20 dark:border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Account</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Description</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Debit</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Credit</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500 animate-pulse">Loading ledger transactions...</td>
                </tr>
              ) : filteredTransactions.length > 0 ? (
                filteredTransactions.map((transaction: any) => (
                  <tr key={transaction.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600 dark:text-gray-400">
                      {new Date(transaction.transaction_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900 dark:text-white">{transaction.account_name}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-gray-600 dark:text-gray-400">{transaction.description}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      {parseFloat(transaction.debit) > 0 && (
                        <span className="font-semibold text-red-600 dark:text-red-400">{formatCurrency(transaction.debit)}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      {parseFloat(transaction.credit) > 0 && (
                        <span className="font-semibold text-green-600 dark:text-green-400">{formatCurrency(transaction.credit)}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <span className="font-semibold text-gray-900 dark:text-white">{formatCurrency(transaction.balance)}</span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center justify-center max-w-[300px] mx-auto">
                      <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/10 rounded-full flex items-center justify-center mb-4 transition-transform hover:scale-110">
                        <History className="h-8 w-8 text-blue-500" />
                      </div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">No Ledger Entries</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                        Transactions are recorded here as they occur in real-time across the platform.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
            {!isLoading && filteredTransactions.length > 0 && (
              <tfoot className="bg-gray-50 dark:bg-gray-800/50">
                <tr>
                  <td colSpan={3} className="px-6 py-4 text-right font-semibold text-gray-900 dark:text-white">
                    Total:
                  </td>
                  <td className="px-6 py-4 text-right font-semibold text-red-600 dark:text-red-400">
                    {formatCurrency(filteredTransactions.reduce((s: number, t: any) => s + parseFloat(t.debit || 0), 0))}
                  </td>
                  <td className="px-6 py-4 text-right font-semibold text-green-600 dark:text-green-400">
                    {formatCurrency(filteredTransactions.reduce((s: number, t: any) => s + parseFloat(t.credit || 0), 0))}
                  </td>
                  <td className="px-6 py-4 text-right font-semibold text-gray-900 dark:text-white">
                    -
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
}