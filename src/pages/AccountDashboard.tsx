import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { accountAPI } from '@/lib/api';
import { 
  Users, CreditCard, BarChart3, Settings, FileText, Calculator, 
  TrendingUp, DollarSign, Receipt, Wallet, PieChart, Target,
  ChevronRight, Activity, Clock, AlertCircle
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
    description: 'Account dashboard overview' 
  },
  { 
    label: 'Accounts Receivable', 
    path: '/account/receivables', 
    icon: <TrendingUp size={18} />, 
    description: 'Manage incoming payments' 
  },
  { 
    label: 'Accounts Payable', 
    path: '/account/payables', 
    icon: <Receipt size={18} />, 
    description: 'Manage outgoing payments' 
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
    description: 'Financial statements & reports' 
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
    totalRevenue: 0,
    outstandingReceivables: 0,
    pendingPayables: 0,
    netProfitMargin: 0
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
      const data = await accountAPI.getOverview();
      setStats(data.stats);
      setRecentTransactions(data.recentTransactions);
      setBranchSummary(data.branchSummary || []);
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
    <div className="flex h-full">
      {/* Side Navigation */}
      <div className={`${sideNavOpen ? 'w-80' : 'w-16'} transition-all duration-300 glass-panel border-r border-white/20 dark:border-white/10 flex flex-col`}>
        <div className="p-4 border-b border-white/20 dark:border-white/10">
          <div className="flex items-center justify-between">
            {sideNavOpen && (
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Account Department</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">Financial Management</p>
              </div>
            )}
            <button
              onClick={() => setSideNavOpen(!sideNavOpen)}
              className="p-2 rounded-lg hover:bg-white/20 dark:hover:bg-white/10 transition-colors"
            >
              <ChevronRight className={`h-4 w-4 transition-transform ${sideNavOpen ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {ACCOUNT_NAV_ITEMS.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                title={!sideNavOpen ? item.label : undefined}
                className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-white/20 dark:hover:bg-white/10'
                } ${!sideNavOpen ? 'justify-center' : ''}`}
              >
                <span className={isActive ? 'text-white' : 'text-blue-500'}>
                  {item.icon}
                </span>
                {sideNavOpen && (
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{item.label}</p>
                    <p className="text-xs opacity-75 truncate">{item.description}</p>
                  </div>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {isOverviewPage ? (
          <div className="p-6">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Account Dashboard</h1>
              <p className="text-gray-600 dark:text-gray-400">
                Welcome back, {user?.name || 'User'}. Monitor your financial operations and key metrics.
              </p>
            </div>

            {/* Stats Grid */}
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="glass-card p-6 rounded-2xl border border-white/20 dark:border-white/10 animate-pulse">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                    <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="glass-card p-6 rounded-2xl border border-white/20 dark:border-white/10">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Revenue</p>
                    <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                      +12.5%
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(stats.totalRevenue)}</p>
                </div>
                <div className="glass-card p-6 rounded-2xl border border-white/20 dark:border-white/10">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Outstanding Receivables</p>
                    <span className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400">
                      -8.2%
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(stats.outstandingReceivables)}</p>
                </div>
                <div className="glass-card p-6 rounded-2xl border border-white/20 dark:border-white/10">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending Payables</p>
                    <span className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400">
                      +5.1%
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(stats.pendingPayables)}</p>
                </div>
                <div className="glass-card p-6 rounded-2xl border border-white/20 dark:border-white/10">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Net Profit Margin</p>
                    <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                      +2.3%
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.netProfitMargin}%</p>
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              <div 
                onClick={() => navigate('/account/receivables')}
                className="glass-card p-6 rounded-2xl cursor-pointer hover:scale-105 transition-all duration-300 border border-white/20 dark:border-white/10 hover:shadow-xl"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-green-500 to-green-600 flex items-center justify-center text-white mb-4">
                  <TrendingUp className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Receivables</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Manage incoming payments</p>
              </div>

              <div 
                onClick={() => navigate('/account/payables')}
                className="glass-card p-6 rounded-2xl cursor-pointer hover:scale-105 transition-all duration-300 border border-white/20 dark:border-white/10 hover:shadow-xl"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-red-500 to-red-600 flex items-center justify-center text-white mb-4">
                  <Receipt className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Payables</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Manage outgoing payments</p>
              </div>

              <div 
                onClick={() => navigate('/account/reports')}
                className="glass-card p-6 rounded-2xl cursor-pointer hover:scale-105 transition-all duration-300 border border-white/20 dark:border-white/10 hover:shadow-xl"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-purple-500 to-purple-600 flex items-center justify-center text-white mb-4">
                  <BarChart3 className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Reports</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Financial statements</p>
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
                      <div key={transaction.id} className="flex items-center justify-between p-4 rounded-xl bg-white/20 dark:bg-white/5">
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            transaction.type === 'Credit' || transaction.credit_amount > 0 
                              ? 'bg-green-100 text-green-600 dark:bg-green-900/20' 
                              : 'bg-red-100 text-red-600 dark:bg-red-900/20'
                          }`}>
                            {transaction.type === 'Credit' || transaction.credit_amount > 0 
                              ? <TrendingUp size={16} /> 
                              : <Receipt size={16} />}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">{transaction.description}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {new Date(transaction.transaction_date).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`font-semibold ${
                            transaction.credit_amount > 0 
                              ? 'text-green-600 dark:text-green-400' 
                              : 'text-red-600 dark:text-red-400'
                          }`}>
                            {transaction.credit_amount > 0 
                              ? `+${formatCurrency(transaction.credit_amount)}` 
                              : `-${formatCurrency(transaction.debit_amount)}`}
                          </p>
                          <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                            Completed
                          </span>
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
          <div className="p-6">
            <div className="text-center py-12">
              <AlertCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Page Under Development</h3>
              <p className="text-gray-600 dark:text-gray-400">This section is currently being built.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}