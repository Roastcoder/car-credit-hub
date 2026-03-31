import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { accountAPI, paymentApplicationAPI } from '@/lib/api';
import { 
  CreditCard, FileText, TrendingUp, Receipt, Activity, Clock
} from 'lucide-react';

export default function AccountDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    waiting_for_voucher: 0,
    waiting_for_utr: 0,
    waiting_for_proof: 0,
    total_completed: 0,
    total_disbursed: 0
  });
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

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              <div 
                onClick={() => navigate('/payments')}
                className="glass-card p-5 rounded-2xl cursor-pointer hover:scale-[1.02] transition-all duration-300 border border-white/20 dark:border-white/10 hover:shadow-xl group"
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center text-white mb-4 shadow-lg group-hover:shadow-blue-500/50 transition-all">
                  <CreditCard className="h-5 w-5" />
                </div>
                <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">Payment Requests</h3>
                <p className="text-xs text-gray-600 dark:text-gray-400">Approved files waiting for voucher, UTR, and proof</p>
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

              <div className="glass-card p-5 rounded-2xl border border-dashed border-white/30 dark:border-white/10">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-slate-500 to-slate-600 flex items-center justify-center text-white mb-4 shadow-lg">
                  <FileText className="h-5 w-5" />
                </div>
                <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">Closed Requests</h3>
                <p className="text-xs text-gray-600 dark:text-gray-400">Once proof is uploaded, the request becomes read-only for everyone.</p>
              </div>
            </div>
          </div>
        ) : (
          <Outlet />
        )}
    </div>
  );
}
