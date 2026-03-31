import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { accountAPI, paymentApplicationAPI } from '@/lib/api';
import { 
  Users, CreditCard, BarChart3, Settings, FileText, Calculator, 
  TrendingUp, DollarSign, Receipt, Wallet, PieChart, Target,
  ChevronRight, Activity, Clock, AlertCircle, Eye
} from 'lucide-react';

interface SideNavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  description: string;
}

const ACCOUNT_NAV_ITEMS: SideNavItem[] = [
  { 
    label: 'Overview', 
    path: '/account', 
    icon: <Activity size={18} />, 
    description: 'Dashboard overview' 
  },
  { 
    label: 'Process Payments', 
    path: '/payments/applications', 
    icon: <CreditCard size={18} />, 
    description: 'Review and release payments' 
  },
  { 
    label: 'Payment Vouchers', 
    path: '/account/vouchers', 
    icon: <Receipt size={18} />, 
    description: 'Manage generated vouchers' 
  },
  { 
    label: 'General Ledger', 
    path: '/account/ledger', 
    icon: <FileText size={18} />, 
    description: 'View all transactions' 
  },
  { 
    label: 'Financial Reports', 
    path: '/account/reports', 
    icon: <BarChart3 size={18} />, 
    description: 'Financial statements' 
  },
  { 
    label: 'Budget Management', 
    path: '/account/budget', 
    icon: <Target size={18} />, 
    description: 'Budget planning & tracking' 
  },
  { 
    label: 'Tax Management', 
    path: '/account/tax', 
    icon: <Calculator size={18} />, 
    description: 'Tax calculations & filings' 
  },
  { 
    label: 'Expense Tracking', 
    path: '/account/expenses', 
    icon: <Wallet size={18} />, 
    description: 'Track business expenses' 
  },
  { 
    label: 'Cash Flow', 
    path: '/account/cashflow', 
    icon: <DollarSign size={18} />, 
    description: 'Monitor cash flow' 
  },
  { 
    label: 'Audit Trail', 
    path: '/account/audit', 
    icon: <Clock size={18} />, 
    description: 'Transaction audit logs' 
  }
];

export default function AccountDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sideNavOpen, setSideNavOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    waiting_for_voucher: 0,
    waiting_for_utr: 0,
    waiting_for_proof: 0,
    total_completed: 0,
    total_disbursed: 0
  });
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [branchSummary, setBranchSummary] = useState([]);

  const isOverviewPage = location.pathname === '/account';

  useEffect(() => {
    if (isOverviewPage) {
      fetchAccountOverview();
    }
  }, [isOverviewPage]);

  const fetchAccountOverview = async () => {
    try {
      setLoading(true);
      // Fetch both general overview and accountant-specific payment stats
      const [overviewData, paymentStats] = await Promise.all([
        accountAPI.getOverview(),
        paymentApplicationAPI.getAccountantStats()
      ]);
      
      setStats(paymentStats);
      setRecentTransactions(overviewData.recentTransactions);
      setBranchSummary(overviewData.branchSummary || []);
    } catch (error) {
      console.error('Error fetching account overview:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="h-full">
      {isOverviewPage ? (
        <div className="p-3 md:p-4 pb-24 md:pb-6">
            <div className="mb-4 md:mb-6">
              <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-1">Account Dashboard</h1>
              <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
                Welcome back, {user?.name || 'User'}. Monitor your financial operations and key metrics.
              </p>
            </div>

            {/* Stats Grid */}
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="glass-card p-4 rounded-xl border border-white/20 dark:border-white/10 animate-pulse">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
                    <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="glass-card p-4 md:p-5 rounded-xl border border-white/20 dark:border-white/10 border-l-4 border-l-yellow-500">
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Waiting for Voucher</p>
                    <Clock className="h-3.5 w-3.5 text-yellow-500" />
                  </div>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.waiting_for_voucher}</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">Manager approved apps</p>
                </div>
                <div className="glass-card p-4 md:p-5 rounded-xl border border-white/20 dark:border-white/10 border-l-4 border-l-blue-500">
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Waiting for UTR</p>
                    <CreditCard className="h-3.5 w-3.5 text-blue-500" />
                  </div>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.waiting_for_utr}</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">Payment pending</p>
                </div>
                <div className="glass-card p-4 md:p-5 rounded-xl border border-white/20 dark:border-white/10 border-l-4 border-l-purple-500">
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Pending Proof</p>
                    <FileText className="h-3.5 w-3.5 text-purple-500" />
                  </div>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.waiting_for_proof}</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">UTR added, proof missing</p>
                </div>
                <div className="glass-card p-4 md:p-5 rounded-xl border border-white/20 dark:border-white/10 border-l-4 border-l-green-500">
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Total Disbursed</p>
                    <TrendingUp className="h-3.5 w-3.5 text-green-500" />
                  </div>
                  <p className="text-lg md:text-xl font-bold text-gray-900 dark:text-white">
                    {formatCurrency(Number(stats.total_disbursed || 0))}
                  </p>
                  <p className="text-[10px] text-gray-500 mt-0.5">From {stats.total_completed} apps</p>
                </div>
              </div>
            )}

            {/* Branch Summary - Centralized View */}
            {branchSummary.length > 0 && (
              <div className="glass-card rounded-2xl border border-white/20 dark:border-white/10 mb-8">
                <div className="p-6 border-b border-white/20 dark:border-white/10">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Branch-wise Payment Summary</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Centralized account department managing all branches</p>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {branchSummary.map((branch: any) => (
                      <div key={branch.branch_id} className="p-4 rounded-xl bg-white/20 dark:bg-white/5 border border-white/10">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h4 className="font-semibold text-gray-900 dark:text-white">{branch.branch_name}</h4>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{branch.branch_code}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                              {branch.total_payment_applications}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Applications</p>
                          </div>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Total Amount:</span>
                            <span className="font-semibold text-gray-900 dark:text-white">
                              {formatCurrency(parseFloat(branch.total_payment_amount))}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Pending:</span>
                            <span className="text-yellow-600 dark:text-yellow-400 font-medium">
                              {branch.pending_approvals}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Ready:</span>
                            <span className="text-green-600 dark:text-green-400 font-medium">
                              {branch.ready_for_processing}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              <div 
                onClick={() => navigate('/payments/applications')}
                className="glass-card p-5 rounded-2xl cursor-pointer hover:scale-[1.02] transition-all duration-300 border border-white/20 dark:border-white/10 hover:shadow-xl group"
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center text-white mb-4 shadow-lg group-hover:shadow-blue-500/50 transition-all">
                  <CreditCard className="h-5 w-5" />
                </div>
                <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">Process Payments</h3>
                <p className="text-xs text-gray-600 dark:text-gray-400">Applications waiting for action</p>
              </div>

              <div 
                onClick={() => navigate('/account/vouchers')}
                className="glass-card p-5 rounded-2xl cursor-pointer hover:scale-[1.02] transition-all duration-300 border border-white/20 dark:border-white/10 hover:shadow-xl group"
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-purple-500 to-purple-600 flex items-center justify-center text-white mb-4 shadow-lg group-hover:shadow-purple-500/50 transition-all">
                  <Receipt className="h-5 w-5" />
                </div>
                <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">Payment Vouchers</h3>
                <p className="text-xs text-gray-600 dark:text-gray-400">View all generated vouchers</p>
              </div>

              <div 
                onClick={() => navigate('/account/reports')}
                className="glass-card p-5 rounded-2xl cursor-pointer hover:scale-[1.02] transition-all duration-300 border border-white/20 dark:border-white/10 hover:shadow-xl group"
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 flex items-center justify-center text-white mb-4 shadow-lg group-hover:shadow-indigo-500/50 transition-all">
                  <BarChart3 className="h-5 w-5" />
                </div>
                <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">Financial Reports</h3>
                <p className="text-xs text-gray-600 dark:text-gray-400">Analyze performance and cash flow</p>
              </div>
            </div>

            {/* Recent Transactions */}
            <div className="glass-card rounded-2xl border border-white/20 dark:border-white/10">
              <div className="p-6 border-b border-white/20 dark:border-white/10">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Transactions</h3>
              </div>
              <div className="p-6">
                {loading ? (
                  <div className="space-y-4">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-white/20 dark:bg-white/5 animate-pulse">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700"></div>
                          <div>
                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-1 w-32"></div>
                            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-1 w-20"></div>
                          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : recentTransactions.length > 0 ? (
                  <div className="space-y-4">
                    {recentTransactions.map((transaction: any) => (
                     <div key={transaction.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-xl bg-white/20 dark:bg-white/5 group gap-4 sm:gap-0">
                        <div className="flex items-center gap-4 w-full sm:w-auto">
                          <div className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center ${
                            transaction.type === 'Credit' || transaction.credit_amount > 0 
                              ? 'bg-green-100 text-green-600 dark:bg-green-900/20' 
                              : 'bg-red-100 text-red-600 dark:bg-red-900/20'
                          }`}>
                            {transaction.type === 'Credit' || transaction.credit_amount > 0 
                              ? <TrendingUp size={16} /> 
                              : <Receipt size={16} />}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white leading-tight">{transaction.description}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <p className="text-xs text-gray-600 dark:text-gray-400">
                                {new Date(transaction.transaction_date).toLocaleDateString()}
                              </p>
                              {transaction.reference_number && (
                                <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-gray-500 font-mono">
                                  #{transaction.reference_number}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-white/10">
                          <div className="text-left sm:text-right">
                            <p className={`font-semibold ${
                              transaction.credit_amount > 0 
                                ? 'text-green-600 dark:text-green-400' 
                                : 'text-red-600 dark:text-red-400'
                            }`}>
                              {transaction.credit_amount > 0 
                                ? `+${formatCurrency(transaction.credit_amount)}` 
                                : `-${formatCurrency(transaction.debit_amount)}`}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] px-2 py-1 rounded-full bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                              Completed
                            </span>
                            <button 
                              className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-all"
                              onClick={() => {
                                // If it contains a loan ID format (e.g. LON- or CL-)
                                if (transaction.description.includes('CL-') || transaction.description.includes('LON-')) {
                                  // Extract code or just navigate to loans list
                                  navigate('/loans');
                                } else {
                                  navigate('/payments');
                                }
                              }}
                              title="View Context"
                            >
                              <Eye size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-600 dark:text-gray-400">No recent transactions found</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <Outlet />
        )}
    </div>
  );
}