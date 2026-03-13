import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';

import LoanStatusBadge from '@/components/LoanStatusBadge';
import { LOAN_STATUSES } from '@/lib/constants';
import { formatCurrency } from '@/lib/utils';
import { ROLE_LABELS } from '@/lib/auth';
import { FileText, IndianRupee, CheckCircle2, Clock, Building2, MapPin, ChevronRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Link, useNavigate } from 'react-router-dom';

const STATUS_CHART_COLORS = ['#1e40af', '#1d4ed8', '#2563eb', '#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe'];

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: loans = [] } = useQuery({
    queryKey: ['loans-dashboard', user?.branch_id],
    queryFn: async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/loans`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
        });
        if (!response.ok) return [];
        const data = await response.json();
        
        // Filter based on role
        if (user?.role === 'employee') {
          return data.filter((l: any) => l.created_by === user.id);
        }
        if (user?.role === 'manager') {
          return data.filter((l: any) => l.branch_id === user.branch_id);
        }
        return data;
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

  const bankNames = [...new Set(loans.map((l: any) => l.bank_name || l.banks?.name).filter(Boolean))];
  const bankData = bankNames.map(bank => ({
    name: (bank as string).replace(' Bank', ''),
    loans: loans.filter((l: any) => (l.bank_name || l.banks?.name) === bank).length,
    amount: loans.filter((l: any) => (l.bank_name || l.banks?.name) === bank).reduce((s: number, l: any) => s + Number(l.loan_amount), 0) / 100000,
  }));

  return (
    <div className="relative z-10 text-text-main-light dark:text-text-main-dark">
      <div className="px-2 sm:px-4 pt-4 pb-20 lg:p-8">
        <div className="grid grid-cols-1 flex-col-reverse lg:grid-cols-3 gap-6">
          {/* Main Chart Section */}
          <div className="stat-card lg:col-span-2 order-2 lg:order-1">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <h2 className="text-lg font-semibold text-blue-900 dark:text-blue-100">Bank-wise Distribution (₹ Lakhs)</h2>
              </div>
              <Link to="/loans" className="text-sm font-medium text-blue-500 hover:text-blue-800 dark:hover:text-blue-300 flex items-center gap-1">
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

          <div className="grid grid-cols-2 lg:grid-cols-1 gap-3 sm:gap-4 lg:gap-6 order-1 lg:order-2">
            {/* Action Cards */}
            <div
              onClick={() => navigate('/loans')}
              className="stat-card col-span-2 lg:col-span-1 cursor-pointer hover:border-accent/40 hover:shadow-lg transition-all"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-blue-900 dark:text-blue-100 flex items-center gap-2">
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
                    <div className="text-sm text-blue-700 dark:text-blue-400">Total Processed</div>
                    <div className="text-sm font-semibold text-blue-900 dark:text-blue-200">{totalLoans} Applications</div>
                  </div>
                </div>
              </div>
            </div>

            <div
              onClick={() => navigate('/loans?status=disbursed')}
              className="stat-card col-span-1 p-4 sm:p-5 flex flex-col justify-center cursor-pointer hover:border-accent/40 hover:shadow-lg transition-all"
            >
              <h2 className="text-sm sm:text-base font-semibold text-blue-700 dark:text-blue-300 mb-1 lg:mb-2">Disbursed Amount</h2>
              <div className="flex items-end gap-2 mb-1">
                <span className="text-xl sm:text-3xl font-bold text-blue-950 dark:text-white drop-shadow-sm">{formatCurrency(disbursedAmount)}</span>
              </div>
              <div className="text-sm text-muted-foreground flex items-center gap-1">
                <CheckCircle2 size={14} className="text-emerald-500" />
                <span>{disbursed.length} applications completed</span>
              </div>
            </div>
            <div
              onClick={() => navigate('/loans?status=under_review')}
              className="stat-card col-span-1 p-4 sm:p-5 flex flex-col justify-center cursor-pointer hover:border-accent/40 hover:shadow-lg transition-all"
            >
              <h2 className="text-sm sm:text-base font-semibold text-blue-700 dark:text-blue-300 mb-1 lg:mb-2">Under Review</h2>
              <div className="flex items-end gap-2 mb-1">
                <span className="text-xl sm:text-3xl font-bold text-blue-950 dark:text-white drop-shadow-sm">{pendingReview}</span>
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
                <h2 className="text-lg font-semibold text-blue-900 dark:text-blue-100 flex items-center gap-2">
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
                    <span className="text-blue-700 dark:text-blue-300">{entry.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="stat-card flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-blue-900 dark:text-blue-100">Recent Applications</h2>
              <Link to="/loans" className="text-sm font-medium text-blue-500 hover:text-blue-800 dark:hover:text-blue-300 flex items-center gap-1">
                View all <ChevronRight size={16} />
              </Link>
            </div>
            <div className="flex-1 overflow-x-auto">
              <table className="w-full text-sm">
                <tbody>
                  {loans.slice(0, 5).map((loan: any) => (
                    <tr key={loan.id} className="border-b border-blue-100 dark:border-blue-900 last:border-0 hover:bg-white/40 dark:hover:bg-blue-900/40 transition-colors">
                      <td className="py-3 px-2">
                        <div className="font-medium text-blue-900 dark:text-blue-200">{loan.applicant_name}</div>
                        <div className="text-xs text-blue-500">{loan.car_make} {loan.car_model}</div>
                      </td>
                      <td className="py-3 px-2 font-medium text-blue-900 dark:text-blue-200">{formatCurrency(Number(loan.loan_amount))}</td>
                      <td className="py-3 px-2 text-right"><LoanStatusBadge status={loan.status} /></td>
                    </tr>
                  ))}
                  {loans.length === 0 && (
                    <tr><td colSpan={3} className="py-8 text-center text-blue-500">No applications yet. <Link to="/loans/new" className="text-primary hover:underline">Create your first loan →</Link></td></tr>
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
