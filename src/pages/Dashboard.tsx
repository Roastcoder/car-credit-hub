import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';

import LoanStatusBadge from '@/components/LoanStatusBadge';
import { formatCurrency, LOAN_STATUSES } from '@/lib/mock-data';
import { ROLE_LABELS } from '@/lib/auth';
import { FileText, IndianRupee, CheckCircle2, Clock, Building2, MapPin, ChevronRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Link } from 'react-router-dom';
import FeatureCarousel from '@/components/FeatureCarousel';

const STATUS_CHART_COLORS = ['#94a3b8', '#3b82f6', '#f59e0b', '#10b981', '#ef4444', '#14b8a6', '#6b7280'];

export default function Dashboard() {
  const { user } = useAuth();

  const { data: loans = [] } = useQuery({
    queryKey: ['loans-dashboard', user?.branch_id],
    queryFn: async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/loans`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
        });
        if (!response.ok) return [];
        return await response.json();
      } catch {
        return [];
      }
    },
    enabled: !!user,
  });

  const { data: branchInfo } = useQuery({
    queryKey: ['branch-info', user?.branch_id],
    queryFn: async () => {
      if (!user?.branch_id) return null;
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/branches/${user.branch_id}`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
        });
        if (!response.ok) return null;
        return await response.json();
      } catch {
        return null;
      }
    },
    enabled: !!user?.branch_id,
  });

  if (!user) return null;

  const totalLoans = loans.length;
  const totalVolume = loans.reduce((s: number, l: any) => s + Number(l.loan_amount), 0);
  const disbursed = loans.filter((l: any) => l.status === 'disbursed');
  const disbursedAmount = disbursed.reduce((s: number, l: any) => s + Number(l.loan_amount), 0);
  const pendingReview = loans.filter((l: any) => l.status === 'under_review').length;

  const statusData = LOAN_STATUSES.map(s => ({
    name: s.label,
    value: loans.filter((l: any) => l.status === s.value).length,
  })).filter(d => d.value > 0);

  const bankNames = [...new Set(loans.map((l: any) => l.banks?.name).filter(Boolean))];
  const bankData = bankNames.map(bank => ({
    name: (bank as string).replace(' Bank', ''),
    loans: loans.filter((l: any) => l.banks?.name === bank).length,
    amount: loans.filter((l: any) => l.banks?.name === bank).reduce((s: number, l: any) => s + Number(l.loan_amount), 0) / 100000,
  }));

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden relative z-10 text-text-main-light dark:text-text-main-dark">
      <div className="flex-1 overflow-y-auto p-4 lg:p-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <button className="glass-card flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium hover:bg-white/60 dark:hover:bg-gray-800/60 transition-colors">
            <span className="text-text-muted-light dark:text-text-muted-dark">Current Month</span>
          </button>
        </div>

        {/* Feature Carousel Banner - Keep Existing */}
        <div className="mb-6">
          <FeatureCarousel />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Chart Section */}
          <div className="stat-card lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Bank-wise Distribution (₹ Lakhs)</h2>
              </div>
              <Link to="/loans" className="text-sm font-medium text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 flex items-center gap-1">
                View Loans <ChevronRight size={16} />
              </Link>
            </div>
            <div className="flex-1 flex min-h-[250px] w-full h-[250px]">
              {bankData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={bankData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.2)" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 12, fill: 'var(--text-muted-light)' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 12, fill: 'var(--text-muted-light)' }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ background: 'rgba(255, 255, 255, 0.8)', backdropFilter: 'blur(10px)', border: 'none', borderRadius: '12px', fontSize: '13px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <Bar dataKey="amount" fill="#3b82f6" radius={[6, 6, 0, 0]} maxBarSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full w-full flex items-center justify-center text-muted-foreground text-sm">No data yet</div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            {/* Action Cards */}
            <div className="stat-card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                  Total Loan Volume
                </h2>
              </div>
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="relative w-16 h-16 flex items-center justify-center">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                      <path className="dark:stroke-blue-900/30" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#dbeafe" strokeWidth="3"></path>
                      <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#3b82f6" strokeDasharray="75, 100" strokeWidth="3"></path>
                    </svg>
                    <span className="absolute text-primary"><IndianRupee size={16} /></span>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-primary">{formatCurrency(totalVolume)}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Total Processed</div>
                    <div className="text-sm font-semibold text-gray-800 dark:text-gray-200">{totalLoans} Applications</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="stat-card">
              <h2 className="text-lg font-semibold text-gray-600 dark:text-gray-300 mb-2">Disbursed Amount</h2>
              <div className="flex items-end gap-3 mb-1">
                <span className="text-3xl font-bold text-gray-900 dark:text-white">{formatCurrency(disbursedAmount)}</span>
              </div>
              <div className="text-sm text-muted-foreground flex items-center gap-1">
                <CheckCircle2 size={14} className="text-emerald-500" />
                <span>{disbursed.length} applications completed</span>
              </div>
            </div>
            <div className="stat-card">
              <h2 className="text-lg font-semibold text-gray-600 dark:text-gray-300 mb-2">Under Review</h2>
              <div className="flex items-end gap-3 mb-1">
                <span className="text-3xl font-bold text-gray-900 dark:text-white">{pendingReview}</span>
              </div>
              <div className="text-sm text-muted-foreground flex items-center gap-1">
                <Clock size={14} className="text-amber-500" />
                <span>Applications needing attention</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          <div className="stat-card">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                  Status Breakdown
                </h2>
              </div>
            </div>
            <div className="flex-1 flex min-h-[220px] w-full h-[220px]">
              {statusData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={statusData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={4} dataKey="value" stroke="none">
                      {statusData.map((_, i) => (
                        <Cell key={i} fill={STATUS_CHART_COLORS[i % STATUS_CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ background: 'rgba(255, 255, 255, 0.8)', backdropFilter: 'blur(10px)', border: 'none', borderRadius: '12px' }} itemStyle={{ color: '#1e293b' }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full w-full flex items-center justify-center text-muted-foreground text-sm">No data yet</div>
              )}
            </div>
            {statusData.length > 0 && (
              <div className="flex flex-wrap justify-center gap-4 mt-4 text-sm">
                {statusData.map((entry, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: STATUS_CHART_COLORS[index % STATUS_CHART_COLORS.length] }}></span>
                    <span className="text-gray-600 dark:text-gray-300">{entry.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="stat-card flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Recent Applications</h2>
              <Link to="/loans" className="text-sm font-medium text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 flex items-center gap-1">
                View all <ChevronRight size={16} />
              </Link>
            </div>
            <div className="flex-1 overflow-x-auto">
              <table className="w-full text-sm">
                <tbody>
                  {loans.slice(0, 5).map((loan: any) => (
                    <tr key={loan.id} className="border-b border-gray-100 dark:border-gray-800 last:border-0 hover:bg-white/40 dark:hover:bg-gray-800/40 transition-colors">
                      <td className="py-3 px-2">
                        <div className="font-medium text-gray-800 dark:text-gray-200">{loan.applicant_name}</div>
                        <div className="text-xs text-gray-500">{loan.car_make} {loan.car_model}</div>
                      </td>
                      <td className="py-3 px-2 font-medium text-gray-800 dark:text-gray-200">{formatCurrency(Number(loan.loan_amount))}</td>
                      <td className="py-3 px-2 text-right"><LoanStatusBadge status={loan.status} /></td>
                    </tr>
                  ))}
                  {loans.length === 0 && (
                    <tr><td colSpan={3} className="py-8 text-center text-gray-500">No applications yet. <Link to="/loans/new" className="text-primary hover:underline">Create your first loan →</Link></td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
