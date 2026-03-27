import { useState } from 'react';
import { Download, Calendar, TrendingUp, TrendingDown, BarChart3, PieChart } from 'lucide-react';

export default function FinancialReports() {
  const [reportType, setReportType] = useState('profit-loss');
  const [period, setPeriod] = useState('this-month');

  const reports = [
    { name: 'Profit & Loss', key: 'profit-loss', icon: <TrendingUp size={20} />, description: 'Income statement' },
    { name: 'Balance Sheet', key: 'balance-sheet', icon: <BarChart3 size={20} />, description: 'Financial position' },
    { name: 'Cash Flow', key: 'cash-flow', icon: <TrendingDown size={20} />, description: 'Cash movements' },
    { name: 'Trial Balance', key: 'trial-balance', icon: <PieChart size={20} />, description: 'Account balances' }
  ];

  const profitLossData = [
    { category: 'Revenue', items: [
      { name: 'Loan Processing Fees', amount: 125000 },
      { name: 'Commission Income', amount: 85000 },
      { name: 'Interest Income', amount: 45000 }
    ]},
    { category: 'Expenses', items: [
      { name: 'Salaries & Benefits', amount: 95000 },
      { name: 'Office Rent', amount: 25000 },
      { name: 'Marketing Expenses', amount: 18000 },
      { name: 'Utilities', amount: 8500 },
      { name: 'Other Expenses', amount: 12000 }
    ]}
  ];

  const totalRevenue = profitLossData[0].items.reduce((sum, item) => sum + item.amount, 0);
  const totalExpenses = profitLossData[1].items.reduce((sum, item) => sum + item.amount, 0);
  const netProfit = totalRevenue - totalExpenses;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Financial Reports</h1>
          <p className="text-gray-600 dark:text-gray-400">Generate and view financial statements</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            <option value="this-month">This Month</option>
            <option value="last-month">Last Month</option>
            <option value="this-quarter">This Quarter</option>
            <option value="this-year">This Year</option>
            <option value="custom">Custom Period</option>
          </select>
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            <Calendar size={16} />
            Date Range
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <Download size={16} />
            Export PDF
          </button>
        </div>
      </div>

      {/* Report Type Selection */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {reports.map((report) => (
          <button
            key={report.key}
            onClick={() => setReportType(report.key)}
            className={`p-4 rounded-xl border transition-all duration-200 text-left ${
              reportType === report.key
                ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                : 'glass-card border-white/20 dark:border-white/10 hover:bg-white/20 dark:hover:bg-white/5'
            }`}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className={`p-2 rounded-lg ${
                reportType === report.key
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
              }`}>
                {report.icon}
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">{report.name}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">{report.description}</p>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Report Content */}
      {reportType === 'profit-loss' && (
        <div className="glass-card rounded-xl border border-white/20 dark:border-white/10">
          <div className="p-6 border-b border-white/20 dark:border-white/10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Profit & Loss Statement</h2>
            <p className="text-gray-600 dark:text-gray-400">For the period: January 2024</p>
          </div>
          
          <div className="p-6">
            {/* Revenue Section */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                Revenue
              </h3>
              <div className="space-y-3">
                {profitLossData[0].items.map((item, index) => (
                  <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-800">
                    <span className="text-gray-700 dark:text-gray-300">{item.name}</span>
                    <span className="font-semibold text-green-600 dark:text-green-400">₹{item.amount.toLocaleString()}</span>
                  </div>
                ))}
                <div className="flex justify-between items-center py-3 border-t-2 border-gray-200 dark:border-gray-700 font-semibold">
                  <span className="text-gray-900 dark:text-white">Total Revenue</span>
                  <span className="text-green-600 dark:text-green-400 text-lg">₹{totalRevenue.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Expenses Section */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <TrendingDown className="h-5 w-5 text-red-600" />
                Expenses
              </h3>
              <div className="space-y-3">
                {profitLossData[1].items.map((item, index) => (
                  <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-800">
                    <span className="text-gray-700 dark:text-gray-300">{item.name}</span>
                    <span className="font-semibold text-red-600 dark:text-red-400">₹{item.amount.toLocaleString()}</span>
                  </div>
                ))}
                <div className="flex justify-between items-center py-3 border-t-2 border-gray-200 dark:border-gray-700 font-semibold">
                  <span className="text-gray-900 dark:text-white">Total Expenses</span>
                  <span className="text-red-600 dark:text-red-400 text-lg">₹{totalExpenses.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Net Profit */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">Net Profit</h3>
                  <p className="text-gray-600 dark:text-gray-400">Total Revenue - Total Expenses</p>
                </div>
                <div className="text-right">
                  <span className={`text-3xl font-bold ${
                    netProfit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                  }`}>
                    ₹{Math.abs(netProfit).toLocaleString()}
                  </span>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {((netProfit / totalRevenue) * 100).toFixed(1)}% margin
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Other report types placeholder */}
      {reportType !== 'profit-loss' && (
        <div className="glass-card rounded-xl border border-white/20 dark:border-white/10 p-12 text-center">
          <div className="text-gray-400 mb-4">
            <BarChart3 size={48} className="mx-auto" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            {reports.find(r => r.key === reportType)?.name} Report
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            This report is currently under development and will be available soon.
          </p>
        </div>
      )}
    </div>
  );
}