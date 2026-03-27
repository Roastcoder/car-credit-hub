import { useState } from 'react';
import { Search, Filter, Download, Calendar, FileText } from 'lucide-react';

export default function GeneralLedger() {
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState('this-month');

  const transactions = [
    { id: 1, date: '2024-01-15', account: 'Cash', description: 'Loan Processing Fee', debit: '25,000', credit: '', balance: '25,000' },
    { id: 2, date: '2024-01-14', account: 'Rent Expense', description: 'Office Rent Payment', debit: '8,500', credit: '', balance: '8,500' },
    { id: 3, date: '2024-01-13', account: 'Commission Income', description: 'Broker Commission', debit: '', credit: '15,750', balance: '15,750' },
    { id: 4, date: '2024-01-12', account: 'Utilities Expense', description: 'Electricity Bill', debit: '3,200', credit: '', balance: '3,200' },
    { id: 5, date: '2024-01-11', account: 'Bank Account', description: 'Customer Payment', debit: '', credit: '45,000', balance: '45,000' },
    { id: 6, date: '2024-01-10', account: 'Marketing Expense', description: 'Digital Marketing', debit: '12,000', credit: '', balance: '12,000' }
  ];

  const accountSummary = [
    { account: 'Assets', balance: '₹5,45,000', type: 'debit' },
    { account: 'Liabilities', balance: '₹1,25,000', type: 'credit' },
    { account: 'Equity', balance: '₹3,20,000', type: 'credit' },
    { account: 'Revenue', balance: '₹2,15,000', type: 'credit' },
    { account: 'Expenses', balance: '₹85,000', type: 'debit' }
  ];

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">General Ledger</h1>
          <p className="text-gray-600 dark:text-gray-400">View all financial transactions and account balances</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            <Download size={16} />
            Export
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <FileText size={16} />
            Trial Balance
          </button>
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
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            placeholder="Search transactions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          />
        </div>
        <select
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value)}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
        >
          <option value="today">Today</option>
          <option value="this-week">This Week</option>
          <option value="this-month">This Month</option>
          <option value="this-quarter">This Quarter</option>
          <option value="this-year">This Year</option>
          <option value="custom">Custom Range</option>
        </select>
        <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
          <Calendar size={16} />
          Date Range
        </button>
        <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
          <Filter size={16} />
          Filter
        </button>
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
              {transactions.map((transaction) => (
                <tr key={transaction.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600 dark:text-gray-400">
                    {transaction.date}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900 dark:text-white">{transaction.account}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-gray-600 dark:text-gray-400">{transaction.description}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    {transaction.debit && (
                      <span className="font-semibold text-red-600 dark:text-red-400">₹{transaction.debit}</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    {transaction.credit && (
                      <span className="font-semibold text-green-600 dark:text-green-400">₹{transaction.credit}</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <span className="font-semibold text-gray-900 dark:text-white">₹{transaction.balance}</span>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50 dark:bg-gray-800/50">
              <tr>
                <td colSpan={3} className="px-6 py-4 text-right font-semibold text-gray-900 dark:text-white">
                  Total:
                </td>
                <td className="px-6 py-4 text-right font-semibold text-red-600 dark:text-red-400">
                  ₹48,700
                </td>
                <td className="px-6 py-4 text-right font-semibold text-green-600 dark:text-green-400">
                  ₹60,750
                </td>
                <td className="px-6 py-4 text-right font-semibold text-gray-900 dark:text-white">
                  ₹12,050
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}