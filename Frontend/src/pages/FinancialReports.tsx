import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { accountAPI } from '@/lib/api';
import { Download, Calendar, TrendingUp, TrendingDown, BarChart3, PieChart, FilePieChart, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export default function FinancialReports() {
  const [reportType, setReportType] = useState('profit-loss');
  const [period, setPeriod] = useState('this-month');

  const { data: reportData, isLoading } = useQuery({
    queryKey: ['financial-report', reportType, period],
    queryFn: () => accountAPI.generateReport({ type: reportType, period })
  });

  const reports = [
    { name: 'Profit & Loss', key: 'profit-loss', icon: <TrendingUp size={20} />, description: 'Income statement' },
    { name: 'Balance Sheet', key: 'balance-sheet', icon: <BarChart3 size={20} />, description: 'Financial position' },
    { name: 'Cash Flow', key: 'cash-flow', icon: <TrendingDown size={20} />, description: 'Cash movements' },
    { name: 'Trial Balance', key: 'trial-balance', icon: <PieChart size={20} />, description: 'Account balances' }
  ];

  const profitLossData = reportData || [
    { category: 'Revenue', items: [] },
    { category: 'Expenses', items: [] }
  ];

  const revenueItems = profitLossData.find((d: any) => d.category === 'Revenue')?.items || [];
  const expenseItems = profitLossData.find((d: any) => d.category === 'Expenses')?.items || [];

  const totalRevenue = revenueItems.reduce((sum: number, item: any) => sum + parseFloat(item.amount || 0), 0);
  const totalExpenses = expenseItems.reduce((sum: number, item: any) => sum + parseFloat(item.amount || 0), 0);
  const netProfit = totalRevenue - totalExpenses;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };
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
            {isLoading ? (
              <div className="py-20 text-center text-gray-500 animate-pulse">
                <Activity className="h-10 w-10 text-blue-500 mx-auto mb-4 animate-spin" />
                Generating real-time financial report...
              </div>
            ) : revenueItems.length > 0 || expenseItems.length > 0 ? (
              <>
                {/* Revenue Section */}
                <div className="mb-8 p-4 rounded-2xl bg-white/40 dark:bg-black/20 border border-white/20">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                    Revenue Streams
                  </h3>
                  <div className="space-y-3">
                    {revenueItems.length > 0 ? (
                      revenueItems.map((item: any, index: number) => (
                        <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-800 last:border-0">
                          <span className="text-gray-700 dark:text-gray-300 font-medium">{item.name}</span>
                          <span className="font-bold text-green-600 dark:text-green-400">{formatCurrency(parseFloat(item.amount))}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500 italic py-2">No revenue records found</p>
                    )}
                    <div className="flex justify-between items-center py-3 border-t-2 border-gray-200 dark:border-gray-700 font-bold mt-2">
                      <span className="text-gray-900 dark:text-white">Total Operating Revenue</span>
                      <span className="text-green-600 dark:text-green-400 text-xl">{formatCurrency(totalRevenue)}</span>
                    </div>
                  </div>
                </div>

                {/* Expenses Section */}
                <div className="mb-8 p-4 rounded-2xl bg-white/40 dark:bg-black/20 border border-white/20">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <TrendingDown className="h-5 w-5 text-red-600" />
                    Operating Expenses
                  </h3>
                  <div className="space-y-3">
                    {expenseItems.length > 0 ? (
                      expenseItems.map((item: any, index: number) => (
                        <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-800 last:border-0">
                          <span className="text-gray-700 dark:text-gray-300 font-medium">{item.name}</span>
                          <span className="font-bold text-red-600 dark:text-red-400">{formatCurrency(parseFloat(item.amount))}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500 italic py-2">No expense records found</p>
                    )}
                    <div className="flex justify-between items-center py-3 border-t-2 border-gray-200 dark:border-gray-700 font-bold mt-2">
                      <span className="text-gray-900 dark:text-white">Total Operating Expenses</span>
                      <span className="text-red-600 dark:text-red-400 text-xl">{formatCurrency(totalExpenses)}</span>
                    </div>
                  </div>
                </div>

                {/* Net Profit */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-[2rem] p-8 text-white shadow-xl shadow-blue-600/20">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-2xl font-black">{netProfit >= 0 ? 'Net Profit' : 'Net Loss'}</h3>
                      <p className="text-blue-100 mt-1 opacity-80">Final bottom-line performance for the selected period</p>
                    </div>
                    <div className="text-right">
                      <span className="text-4xl font-black drop-shadow-md">
                        {formatCurrency(Math.abs(netProfit))}
                      </span>
                      <div className="mt-2 text-sm font-bold bg-white/20 backdrop-blur-md rounded-full px-4 py-1 inline-block">
                        {totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : 0}% Margin
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="py-20 text-center">
                <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/10 rounded-[2rem] flex items-center justify-center mx-auto mb-6 transform rotate-3">
                  <FilePieChart className="h-10 w-10 text-blue-500" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Reports are empty</h3>
                <p className="max-w-xs mx-auto text-gray-500 dark:text-gray-400">
                  Once transactions are recorded in the ledger, your financial reports will be generated automatically.
                </p>
              </div>
            )}
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