import { useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';

import LoanStatusBadge from '@/components/LoanStatusBadge';
import { LOAN_STATUSES } from '@/lib/constants';
import { formatCurrency } from '@/lib/utils';
import { ROLE_LABELS } from '@/lib/auth';
import { loansAPI, branchesAPI, smsAPI } from '@/lib/api';
import { FileText, IndianRupee, CheckCircle2, Clock, Building2, MapPin, ChevronRight, Activity, BarChart3, MessagesSquare } from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, AreaChart, Area, Legend 
} from 'recharts';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { SDUIRenderer } from '@/components/SDUI/SDUIRenderer';
import { SDUIComponentProps } from '@/components/SDUI/types';

const STATUS_CHART_COLORS = ['#1e40af', '#1d4ed8', '#2563eb', '#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe'];

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const todayString = new Date().toISOString().split('T')[0];
  const [adminFilterMode, setAdminFilterMode] = useState<'all' | 'month' | 'day'>('all');
  const [selectedMonth, setSelectedMonth] = useState(todayString.slice(0, 7));
  const [selectedDay, setSelectedDay] = useState(todayString);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);

  const { data: loans = [], isLoading: isLoadingLoans } = useQuery({
    queryKey: ['loans-dashboard', user?.branch_id, user?.role],
    queryFn: async () => {
      try {
        const data = await loansAPI.getAll();
        const loansData = Array.isArray(data) ? data : (data.data || []);
        return loansData;
      } catch (error) {
        console.error('Dashboard fetch error:', error);
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
        return await branchesAPI.getById(Number(user.branch_id));
      } catch {
        return null;
      }
    },
    enabled: !!user?.branch_id,
  });

  const { data: smsBalance } = useQuery({
    queryKey: ['sms-balance'],
    queryFn: async () => {
      if (user?.role === 'super_admin' || user?.role === 'admin' || user?.role === 'manager' || user?.role === 'pdd_manager') {
        return await smsAPI.getBalance();
      }
      return null;
    },
    enabled: user?.role === 'super_admin' || user?.role === 'admin' || user?.role === 'manager' || user?.role === 'pdd_manager'
  });

  if (!user) return null;

  const isAdminDashboard = user.role === 'admin' || user.role === 'super_admin';
  const isPddDashboard = user.role === 'pdd_manager';
  const isBroker = user.role === 'broker';
  const isAccountant = user.role === 'accountant';

  const filteredAdminLoans = useMemo(() => {
    return loans.filter((loan: any) => {
      if (!loan?.created_at) return adminFilterMode === 'all';

      const loanDate = new Date(loan.created_at);
      if (Number.isNaN(loanDate.getTime())) return adminFilterMode === 'all';

      if (adminFilterMode === 'month') {
        return loanDate.toISOString().slice(0, 7) === selectedMonth;
      }

      if (adminFilterMode === 'day') {
        return loanDate.toISOString().split('T')[0] === selectedDay;
      }

      return true;
    });
  }, [loans, adminFilterMode, selectedMonth, selectedDay]);

  const dashboardLoans = isAdminDashboard ? filteredAdminLoans : loans;
  const totalLoans = dashboardLoans.length;
  const totalVolume = dashboardLoans.reduce((s: number, l: any) => s + Number(l.loan_amount), 0);
  const disbursed = dashboardLoans.filter((l: any) => l.status === 'disbursed');
  const disbursedAmount = disbursed.reduce((s: number, l: any) => s + Number(l.loan_amount), 0);
  const pendingReview = dashboardLoans.filter((l: any) => l.status === 'under_review').length;

  const statusData = LOAN_STATUSES.map(s => ({
    name: s.label,
    value: dashboardLoans.filter((l: any) => l.status === s.value).length,
  })).filter(d => d.value > 0);

  const statusKpis = LOAN_STATUSES.map((status) => {
    const matchingLoans = dashboardLoans.filter((loan: any) => loan.status === status.value);
    const amount = matchingLoans.reduce((sum: number, loan: any) => sum + Number(loan.loan_amount || 0), 0);

    return {
      ...status,
      count: matchingLoans.length,
      amount,
    };
  }).filter((item) => item.count > 0);

  const displayLoans = useMemo(() => {
    if (!selectedStatus) return dashboardLoans;
    return dashboardLoans.filter((l: any) => l.status === selectedStatus);
  }, [dashboardLoans, selectedStatus]);

  // Consider all loans with a bank assigned for the chart
  const loansWithBank = displayLoans.filter((l: any) => (l.bank_name || l.assigned_bank_name || l.banks?.name));
  const bankNames = [...new Set(loansWithBank.map((l: any) => l.bank_name || l.assigned_bank_name || l.banks?.name).filter(Boolean))];
  const bankData = bankNames.map(bank => ({
    name: (bank as string).replace(' Bank', '').replace(' NBFC', ''),
    loans: loansWithBank.filter((l: any) => (l.bank_name || l.assigned_bank_name || l.banks?.name) === bank).length,
    amount: loansWithBank.filter((l: any) => (l.bank_name || l.assigned_bank_name || l.banks?.name) === bank).reduce((s: number, l: any) => s + Number(l.loan_amount), 0) / 100000,
  }));

  // New Data Aggregations for Expanded Charts
  const verticalData = useMemo(() => {
    const counts: Record<string, number> = {};
    displayLoans.forEach((l: any) => {
      const v = l.vertical || 'Other';
      counts[v] = (counts[v] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [displayLoans]);

  const branchData = useMemo(() => {
    const data: Record<string, number> = {};
    displayLoans.forEach((l: any) => {
      const b = l.branch_name || 'Main Branch';
      data[b] = (data[b] || 0) + (Number(l.loan_amount) / 100000); // In Lakhs
    });
    return Object.entries(data).map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10); // Top 10 branches
  }, [displayLoans]);

  const trendData = useMemo(() => {
    const monthly: Record<string, { name: string, amount: number, count: number }> = {};
    // Use the full loans array for trends if in "all" mode, otherwise just the filtered set
    const trendBase = adminFilterMode === 'all' ? loans : displayLoans;
    
    trendBase.forEach((l: any) => {
      if (!l.created_at) return;
      const date = new Date(l.created_at);
      const monthYear = date.toISOString().slice(0, 7); // YYYY-MM
      if (!monthly[monthYear]) {
        monthly[monthYear] = { name: monthYear, amount: 0, count: 0 };
      }
      monthly[monthYear].amount += Number(l.loan_amount) / 100000;
      monthly[monthYear].count += 1;
    });
    
    // Pad with last 6 months to ensure a line is drawn even with single month data
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      months.push(d.toISOString().slice(0, 7));
    }

    return months.map(m => ({
      name: m,
      amount: monthly[m]?.amount || 0,
      count: monthly[m]?.count || 0
    }));
  }, [loans, displayLoans, adminFilterMode]);

  const loanTypeData = useMemo(() => {
    const counts: Record<string, number> = {};
    displayLoans.forEach((l: any) => {
      const t = l.loan_type_vehicle || 'Unknown';
      counts[t] = (counts[t] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [displayLoans]);

  const pddStats = useMemo(() => {
    if (!isPddDashboard) return null;
    const disbursedLoans = loans.filter((l: any) => l.status === 'disbursed');
    return {
      total: disbursedLoans.length,
      pendingApproval: disbursedLoans.filter((l: any) => l.pdd_status === 'pending_approval').length,
      delayed: disbursedLoans.filter((l: any) => (l.pdd_status !== 'approved' && Number(l.delay_days) > 15)).length,
      pending: disbursedLoans.filter((l: any) => l.pdd_status === 'pending' || !l.pdd_status).length
    };
  }, [loans, isPddDashboard]);

  const pddLoans = useMemo(() => {
    if (!isPddDashboard) return [];
    return loans.filter((l: any) => l.status === 'disbursed')
      .sort((a: any, b: any) => (Number(b.delay_days || 0) - Number(a.delay_days || 0)))
      .slice(0, 15);
  }, [loans, isPddDashboard]);

  const buildLoansFilterUrl = (status?: string) => {
    const params = new URLSearchParams();

    if (status) params.set('status', status);
    if (isAdminDashboard && adminFilterMode === 'month') params.set('month', selectedMonth);
    if (isAdminDashboard && adminFilterMode === 'day') params.set('day', selectedDay);

    const queryString = params.toString();
    return queryString ? `/loans?${queryString}` : '/loans';
  };

  // SDUI Configuration (This would typically come from your backend API)
  const brokerSduiConfig: SDUIComponentProps = {
    type: 'Grid',
    props: { columns: 4, className: 'mb-6' },
    children: [
      {
        type: 'StatCard',
        props: {
          title: 'Total Volume',
          value: 'ctx.totalVolume',
          sub: 'ctx.totalLoansText',
          iconName: 'IndianRupee',
          trendData: 'ctx.volumeTrend',
        }
      },
      {
        type: 'StatCard',
        props: {
          title: 'Disbursed',
          value: 'ctx.disbursedAmount',
          sub: 'ctx.disbursedCountText',
          iconName: 'CheckCircle2',
          color: '#10b981',
          trendData: 'ctx.disbursedTrend',
        }
      },
      {
        type: 'StatCard',
        props: {
          title: 'In Process',
          value: 'ctx.pendingReview',
          sub: 'Under Review',
          iconName: 'Clock',
          color: '#f59e0b',
          trendData: 'ctx.pendingTrend',
        }
      },
      {
        type: 'StatCard',
        props: {
          title: 'Approved',
          value: 'ctx.approvedCount',
          sub: 'Awaiting Disb.',
          iconName: 'CheckCircle2',
          color: '#3b82f6',
          trendData: 'ctx.approvedTrend',
        }
      }
    ]
  };

  const sduiContext = {
    totalVolume: formatCurrency(totalVolume),
    totalLoansText: `${totalLoans} applications`,
    volumeTrend: trendData.map(d => ({ value: d.amount })),
    disbursedAmount: formatCurrency(disbursedAmount),
    disbursedCountText: `${disbursed.length} files`,
    disbursedTrend: trendData.map(d => ({ value: d.amount * 0.7 })),
    pendingReview: pendingReview,
    pendingTrend: trendData.map(d => ({ value: d.count })),
    approvedCount: dashboardLoans.filter((l: any) => l.status === 'approved').length,
    approvedTrend: trendData.map(d => ({ value: d.count * 1.2 }))
  };

  return (
    <div className="relative z-10 text-text-main-light dark:text-text-main-dark">
      <div className="px-2 sm:px-4 pt-3 pb-20 lg:p-4 sm:lg:p-6">
        {!['super_admin', 'admin'].includes(user?.role || '') && (
          <div className="stat-card mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-l-4 border-l-blue-500">
            <div>
              <h2 className="text-lg font-semibold text-blue-900 dark:text-blue-100 flex items-center gap-2">Referral Program</h2>
              <p className="text-sm text-blue-700 dark:text-blue-300">Share this link to invite brokers. They will automatically report to you.</p>
            </div>
            <div className="flex bg-white/50 dark:bg-black/20 rounded-lg p-1 border border-blue-200 dark:border-blue-800 w-full sm:w-auto">
              <input
                type="text"
                readOnly
                value={`${window.location.origin}/signup?ref=${user.id}&name=${encodeURIComponent(user.name || '')}&branch=${user.branch_id || ''}`}
                className="bg-transparent text-sm w-full sm:w-64 px-3 outline-none text-blue-900 dark:text-blue-100"
              />
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/signup?ref=${user.id}&name=${encodeURIComponent(user.name || '')}&branch=${user.branch_id || ''}`);
                  toast.success('Referral link copied to clipboard!');
                }}
                className="bg-primary hover:bg-primary/90 transition-colors text-white font-medium text-sm px-4 py-2 rounded-md whitespace-nowrap"
              >
                Copy Link
              </button>
            </div>
          </div>
        )}

        {smsBalance && (
          <div className="mb-2 flex flex-wrap gap-4 items-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800/50 w-fit">
            <div className="flex items-center gap-2 text-blue-900 dark:text-blue-100 font-medium">
              <MessagesSquare size={18} className="text-blue-500" />
              <span>SMS Balance:</span>
            </div>
            <div className="flex gap-4">
              <div className="flex items-center gap-1.5 px-2 py-0.5 bg-white dark:bg-black/20 rounded border border-blue-200 dark:border-blue-800">
                <span className="text-[10px] font-bold uppercase text-blue-500">Trans</span>
                <span className="text-sm font-bold text-blue-900 dark:text-blue-100">{smsBalance.transactional || 0}</span>
              </div>
            </div>
          </div>
        )}

        {isPddDashboard && pddStats && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="stat-card border-l-4 border-l-blue-500">
              <h2 className="text-xl font-bold text-blue-900 dark:text-blue-100">PDD Management Dashboard</h2>
              <p className="text-sm text-blue-700 dark:text-blue-300">Tracking post-disbursement documents for all files.</p>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Total Disbursed', value: pddStats.total, sub: 'Files needing PDD', color: '#3b82f6', trend: trendData.map(d => ({ value: d.count })) },
                { label: 'Pending PDD', value: pddStats.pending, sub: 'Not submitted', color: '#f59e0b', trend: trendData.map(d => ({ value: d.count * 0.4 })) },
                { label: 'Awaiting Approval', value: pddStats.pendingApproval, sub: 'Needs review', color: '#8b5cf6', trend: trendData.map(d => ({ value: d.count * 0.2 })) },
                { label: 'Highly Delayed', value: pddStats.delayed, sub: '> 15 days delay', color: '#ef4444', trend: trendData.map(d => ({ value: d.count * 0.1 })) },
              ].map((kpi) => (
                <div key={kpi.label} className="stat-card bg-white dark:bg-card hover:shadow-md transition-shadow border-l-4" style={{ borderLeftColor: kpi.color }}>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{kpi.label}</p>
                    {kpi.trend.length > 1 && (
                      <div className="h-6 w-12">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={kpi.trend}>
                            <Area type="monotone" dataKey="value" stroke={kpi.color} fill={kpi.color} fillOpacity={0.1} strokeWidth={1.5} />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </div>
                  <p className="text-3xl font-black text-blue-950 dark:text-white mt-1">{kpi.value}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">{kpi.sub}</p>
                </div>
              ))}
            </div>

            <div className="stat-card">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold text-blue-950 dark:text-white">Active PDD Tracking</h3>
                  <p className="text-xs text-muted-foreground">Files sorted by delay duration</p>
                </div>
                <Link to="/pdd-tracking" className="text-xs font-bold text-accent hover:underline flex items-center gap-1">
                  View Full Tracking <ChevronRight size={14} />
                </Link>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-muted-foreground border-b border-border">
                      <th className="pb-3 font-semibold">Client / File</th>
                      <th className="pb-3 font-semibold text-center">Delay</th>
                      <th className="pb-3 font-semibold text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {pddLoans.map((loan: any) => (
                      <tr key={loan.id} className="group hover:bg-muted/30 transition-colors cursor-pointer" onClick={() => navigate(`/loans/${loan.loan_number || loan.id}`)}>
                        <td className="py-4">
                          <div className="font-bold text-blue-900 dark:text-blue-100">{loan.applicant_name}</div>
                          <div className="text-[10px] text-muted-foreground">{loan.loan_number} • {loan.car_make}</div>
                        </td>
                        <td className="py-4 text-center">
                          <span className={`px-2 py-1 rounded-md text-[10px] font-black ${Number(loan.delay_days) > 15 ? 'bg-red-500/10 text-red-600' : 'bg-amber-500/10 text-amber-600'}`}>
                            {loan.delay_days || 0} DAYS
                          </span>
                        </td>
                        <td className="py-4 text-right">
                          <div className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block ${
                            loan.pdd_status === 'pending_approval' ? 'bg-purple-500/10 text-purple-600' :
                            loan.pdd_status === 'rejected' ? 'bg-red-500/10 text-red-600' :
                            'bg-muted text-muted-foreground'
                          }`}>
                            {(loan.pdd_status || 'PENDING').replace(/_/g, ' ')}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {pddLoans.length === 0 && (
                      <tr><td colSpan={3} className="py-12 text-center text-muted-foreground font-medium">No disbursed files found needing PDD oversight.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {isAdminDashboard ? (
          <>
            <div className="stat-card mb-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-blue-900 dark:text-blue-100">Admin File Dashboard</h2>
                  <p className="text-sm text-muted-foreground mt-1">Filter KPI cards and charts month-wise or day-wise.</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex rounded-lg border border-border overflow-hidden">
                    {[
                      { value: 'all', label: 'All' },
                      { value: 'month', label: 'Month' },
                      { value: 'day', label: 'Day' },
                    ].map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setAdminFilterMode(option.value as 'all' | 'month' | 'day')}
                        className={`px-4 py-2 text-sm font-medium transition-colors ${adminFilterMode === option.value
                          ? 'bg-accent text-accent-foreground'
                          : 'bg-background text-foreground hover:bg-muted'
                          }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                  {adminFilterMode === 'month' && (
                    <input
                      type="month"
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(e.target.value)}
                      className="px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm"
                    />
                  )}
                  {adminFilterMode === 'day' && (
                    <input
                      type="date"
                      value={selectedDay}
                      onChange={(e) => setSelectedDay(e.target.value)}
                      className="px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm"
                    />
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 xl:grid-cols-4 2xl:grid-cols-7 gap-3 sm:gap-4 mb-6">
              <div
                onClick={() => setSelectedStatus(null)}
                className={`stat-card cursor-pointer transition-all ${!selectedStatus ? 'ring-2 ring-primary bg-primary/5 dark:bg-primary/10 border-transparent shadow-md' : 'hover:border-accent/40 hover:shadow-lg'}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">Total Files</p>
                  {trendData.length > 1 && (
                    <div className="h-6 w-12">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={trendData.map(d => ({ value: d.count }))}>
                          <Area type="monotone" dataKey="value" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.1} strokeWidth={1.5} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
                <p className="text-3xl font-bold text-blue-950 dark:text-white mt-1">{totalLoans}</p>
                <p className="text-[10px] text-muted-foreground mt-2">{formatCurrency(totalVolume)} volume</p>
              </div>
              {statusKpis.map((item, idx) => (
                <div
                  key={item.value}
                  onClick={() => setSelectedStatus(selectedStatus === item.value ? null : item.value)}
                  className={`stat-card cursor-pointer transition-all ${selectedStatus === item.value ? 'ring-2 ring-primary bg-primary/5 dark:bg-primary/10 border-transparent shadow-md' : 'hover:border-accent/40 hover:shadow-lg'}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">{item.label}</p>
                    <div className="h-6 w-12">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={trendData.map(d => ({ value: d.count * (0.5 + Math.random() * 0.5) }))}>
                          <Area type="monotone" dataKey="value" stroke={STATUS_CHART_COLORS[idx % STATUS_CHART_COLORS.length]} fill={STATUS_CHART_COLORS[idx % STATUS_CHART_COLORS.length]} fillOpacity={0.1} strokeWidth={1.5} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  <p className="text-3xl font-bold text-blue-950 dark:text-white mt-1">{item.count}</p>
                  <p className="text-[10px] text-muted-foreground mt-2">{formatCurrency(item.amount)} volume</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="stat-card">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-blue-900 dark:text-blue-100 flex items-center gap-2">
                    <Activity size={18} className="text-blue-500" />
                    Monthly Volume Trend (₹ Lakhs)
                  </h2>
                </div>
                <div className="h-[300px] w-full">
                  {trendData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={trendData}>
                        <defs>
                          <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.1)" vertical={false} />
                        <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'var(--text-muted-light)' }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted-light)' }} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={{ background: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(10px)', border: 'none', borderRadius: '12px', fontSize: '12px', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                        <Area type="monotone" dataKey="amount" stroke="#2563eb" strokeWidth={3} fillOpacity={1} fill="url(#colorAmount)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-muted-foreground text-sm">No trend data yet</div>
                  )}
                </div>
              </div>

              <div className="stat-card">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-blue-900 dark:text-blue-100">Branch Leaderboard (₹ Lakhs)</h2>
                  <BarChart3 size={18} className="text-blue-500" />
                </div>
                <div className="h-[300px] w-full">
                  {branchData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={branchData} layout="vertical" margin={{ left: 40 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.1)" horizontal={false} />
                        <XAxis type="number" hide />
                        <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: 'var(--text-muted-light)', fontWeight: 600 }} axisLine={false} tickLine={false} width={100} />
                        <Tooltip contentStyle={{ background: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(10px)', border: 'none', borderRadius: '12px', fontSize: '12px' }} />
                        <Bar dataKey="amount" fill="#3b82f6" radius={[0, 6, 6, 0]} barSize={20}>
                          {branchData.map((_, i) => (
                            <Cell key={i} fill={STATUS_CHART_COLORS[i % STATUS_CHART_COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-muted-foreground text-sm">No branch data available</div>
                  )}
                </div>
              </div>

              <div className="stat-card lg:col-span-1">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-blue-900 dark:text-blue-100">Vertical Distribution</h2>
                </div>
                <div className="flex-1 flex min-h-[250px] w-full h-[250px]">
                  {verticalData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={verticalData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={4} dataKey="value" stroke="none">
                          {verticalData.map((_, i) => (
                            <Cell key={i} fill={STATUS_CHART_COLORS[(i + 2) % STATUS_CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ background: 'rgba(255, 255, 255, 0.8)', backdropFilter: 'blur(10px)', border: 'none', borderRadius: '12px' }} />
                        <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 600 }} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-muted-foreground text-sm">No distribution data</div>
                  )}
                </div>
              </div>

              <div className="stat-card lg:col-span-1">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-blue-900 dark:text-blue-100">Loan Type (New vs Used)</h2>
                </div>
                <div className="flex-1 flex min-h-[250px] w-full h-[250px]">
                  {loanTypeData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={loanTypeData} cx="50%" cy="50%" innerRadius={70} outerRadius={90} paddingAngle={8} dataKey="value" stroke="none">
                          {loanTypeData.map((_, i) => (
                            <Cell key={i} fill={i === 0 ? '#2563eb' : '#fbbf24'} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ background: 'rgba(255, 255, 255, 0.8)', backdropFilter: 'blur(10px)', border: 'none', borderRadius: '12px' }} />
                        <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 600 }} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-muted-foreground text-sm">No type data</div>
                  )}
                </div>
              </div>

              <div className="stat-card">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-blue-900 dark:text-blue-100">File Status Distribution</h2>
                  <Link to="/loans" className="text-sm font-medium text-blue-500 hover:text-blue-800 dark:hover:text-blue-300 flex items-center gap-1">
                    View Loans <ChevronRight size={16} />
                  </Link>
                </div>
                <div className="flex-1 flex min-h-[250px] w-full h-[250px]">
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
              </div>

              <div className="stat-card">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-blue-900 dark:text-blue-100">Bank-wise Distribution (₹ Lakhs)</h2>
                  <Link to="/loans" className="text-sm font-medium text-blue-500 hover:text-blue-800 dark:hover:text-blue-300 flex items-center gap-1">
                    View Loans <ChevronRight size={16} />
                  </Link>
                </div>
                <div className="flex-1 flex min-h-[250px] w-full h-[250px] items-center justify-center">
                  {isLoadingLoans ? (
                    <div className="animate-pulse flex flex-col items-center gap-2">
                      <Activity className="h-8 w-8 text-blue-400 animate-spin" />
                      <span className="text-sm text-gray-500">Loading distribution...</span>
                    </div>
                  ) : bankData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={bankData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.2)" vertical={false} />
                        <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'var(--text-muted-light)' }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted-light)' }} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={{ background: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(10px)', border: 'none', borderRadius: '12px', fontSize: '12px', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                        <Bar dataKey="amount" fill="#2563eb" radius={[6, 6, 0, 0]} maxBarSize={40} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex flex-col items-center gap-3 text-muted-foreground">
                      <div className="w-12 h-12 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center">
                        <BarChart3 className="h-6 w-6 text-slate-300" />
                      </div>
                      <p className="text-sm font-medium">No distribution data available</p>
                      <p className="text-xs text-center max-w-[200px]">Once loans are assigned to banks, the distribution will appear here.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        ) : isBroker ? (
          // ── BROKER DASHBOARD: expanded KPIs and Charts ──
          <div className="space-y-6">
            <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 p-3 rounded-lg mb-4 flex items-center justify-between">
              <span className="text-sm font-bold text-blue-900 dark:text-blue-100 flex items-center gap-2">
                <Activity size={16} className="text-blue-500" />
                Server-Driven UI Layout Active
              </span>
              <span className="text-[10px] uppercase font-bold tracking-widest text-blue-500 bg-white dark:bg-black/20 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800">SDUI V1</span>
            </div>
            
            <SDUIRenderer config={brokerSduiConfig} context={sduiContext} />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="stat-card">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-blue-900 dark:text-blue-100 flex items-center gap-2">
                    <Activity size={18} className="text-blue-500" />
                    My Monthly Trend (₹ Lakhs)
                  </h2>
                </div>
                <div className="h-[250px] w-full">
                  {trendData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={trendData}>
                        <defs>
                          <linearGradient id="colorAmountBroker" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.1)" vertical={false} />
                        <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'var(--text-muted-light)' }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted-light)' }} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={{ background: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(10px)', border: 'none', borderRadius: '12px', fontSize: '12px' }} />
                        <Area type="monotone" dataKey="amount" stroke="#2563eb" strokeWidth={3} fillOpacity={1} fill="url(#colorAmountBroker)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-muted-foreground text-sm">No submission history yet</div>
                  )}
                </div>
              </div>

              <div className="stat-card">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-blue-900 dark:text-blue-100 flex items-center gap-2">
                    <BarChart3 size={18} className="text-blue-500" />
                    Status Distribution
                  </h2>
                </div>
                <div className="h-[250px] w-full">
                  {statusData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={statusData} cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={4} dataKey="value" stroke="none">
                          {statusData.map((_, i) => (
                            <Cell key={i} fill={STATUS_CHART_COLORS[i % STATUS_CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ background: 'rgba(255, 255, 255, 0.8)', backdropFilter: 'blur(10px)', border: 'none', borderRadius: '12px' }} />
                        <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 600 }} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-muted-foreground text-sm">No status data available</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : isAccountant ? (
          // ── ACCOUNTANT DASHBOARD: payment-focused KPIs ──
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
            {[
              { label: 'Total Files', value: totalLoans, sub: formatCurrency(totalVolume), status: null, color: '#3b82f6' },
              { label: 'Approved', value: dashboardLoans.filter((l: any) => l.status === 'approved').length, sub: 'Pending Disb.', status: 'approved', color: '#10b981' },
              { label: 'Disbursed', value: disbursed.length, sub: formatCurrency(disbursedAmount), status: 'disbursed', color: '#2563eb' },
              { label: 'Under Review', value: pendingReview, sub: 'Awaiting Action', status: 'under_review', color: '#f59e0b' },
            ].map((kpi) => (
              <div
                key={kpi.label}
                onClick={() => kpi.status && setSelectedStatus(selectedStatus === kpi.status ? null : kpi.status)}
                className={`stat-card cursor-pointer transition-all ${kpi.status && selectedStatus === kpi.status ? 'ring-2 ring-primary bg-primary/5 dark:bg-primary/10 border-transparent shadow-md' : 'hover:border-accent/40 hover:shadow-lg'}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">{kpi.label}</p>
                  <div className="h-6 w-12">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={trendData.map(d => ({ value: d.count * (0.8 + Math.random() * 0.4) }))}>
                        <Area type="monotone" dataKey="value" stroke={kpi.color} fill={kpi.color} fillOpacity={0.1} strokeWidth={1.5} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <p className="text-3xl font-bold text-blue-950 dark:text-white mt-1">{kpi.value}</p>
                <p className="text-[10px] text-muted-foreground mt-1">{kpi.sub}</p>
              </div>
            ))}
          </div>
        ) : isPddDashboard ? (
          null
        ) : (
          // ── EMPLOYEE / MANAGER / RBM DASHBOARD ──
          <div className="grid grid-cols-1 flex-col-reverse lg:grid-cols-3 gap-6">
            <div className="stat-card lg:col-span-2 order-2 lg:order-1">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-blue-900 dark:text-blue-100">Bank-wise Distribution (₹ Lakhs)</h2>
                <Link to="/loans" className="text-sm font-medium text-blue-500 hover:text-blue-800 dark:hover:text-blue-300 flex items-center gap-1">
                  View Loans <ChevronRight size={16} />
                </Link>
              </div>
              <div className="flex-1 flex min-h-[250px] w-full h-[250px] items-center justify-center">
                {isLoadingLoans ? (
                  <div className="animate-pulse flex flex-col items-center gap-2">
                    <Activity className="h-8 w-8 text-blue-400 animate-spin" />
                    <span className="text-sm text-gray-500">Loading distribution...</span>
                  </div>
                ) : bankData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={bankData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.2)" vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'var(--text-muted-light)' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted-light)' }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ background: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(10px)', border: 'none', borderRadius: '12px', fontSize: '12px', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                      <Bar dataKey="amount" fill="#2563eb" radius={[6, 6, 0, 0]} maxBarSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex flex-col items-center gap-3 text-muted-foreground">
                    <div className="w-12 h-12 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center">
                      <BarChart3 className="h-6 w-6 text-slate-300" />
                    </div>
                    <p className="text-sm font-medium">No distribution data available</p>
                    <p className="text-xs text-center max-w-[200px]">Once loans are assigned to banks, the distribution will appear here.</p>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-1 gap-3 sm:gap-4 lg:gap-6 order-1 lg:order-2">
              <div
                onClick={() => setSelectedStatus(null)}
                className={`stat-card col-span-2 lg:col-span-1 cursor-pointer transition-all ${!selectedStatus ? 'ring-2 ring-primary bg-primary/5 dark:bg-primary/10 border-transparent shadow-md' : 'hover:border-accent/40 hover:shadow-lg'}`}
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-blue-900 dark:text-blue-100">Total Loan Volume</h2>
                </div>
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
              <div
                onClick={() => setSelectedStatus(selectedStatus === 'disbursed' ? null : 'disbursed')}
                className={`stat-card col-span-1 p-4 sm:p-5 flex flex-col justify-center cursor-pointer transition-all ${selectedStatus === 'disbursed' ? 'ring-2 ring-primary bg-primary/5 dark:bg-primary/10 border-transparent shadow-md' : 'hover:border-accent/40 hover:shadow-lg'}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-sm sm:text-base font-semibold text-blue-700 dark:text-blue-300 mb-0">Disbursed</h2>
                  <div className="h-6 w-12">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={trendData.map(d => ({ value: d.count * 0.8 }))}>
                        <Area type="monotone" dataKey="value" stroke="#10b981" fill="#10b981" fillOpacity={0.1} strokeWidth={1.5} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <span className="text-xl sm:text-3xl font-bold text-blue-950 dark:text-white drop-shadow-sm">{formatCurrency(disbursedAmount)}</span>
                <div className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                  <CheckCircle2 size={14} className="text-emerald-500" />
                  <span>{disbursed.length} completed</span>
                </div>
              </div>
              <div
                onClick={() => setSelectedStatus(selectedStatus === 'under_review' ? null : 'under_review')}
                className={`stat-card col-span-1 p-4 sm:p-5 flex flex-col justify-center cursor-pointer transition-all ${selectedStatus === 'under_review' ? 'ring-2 ring-primary bg-primary/5 dark:bg-primary/10 border-transparent shadow-md' : 'hover:border-accent/40 hover:shadow-lg'}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-sm sm:text-base font-semibold text-blue-700 dark:text-blue-300 mb-0">Under Review</h2>
                  <div className="h-6 w-12">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={trendData.map(d => ({ value: d.count * 0.4 }))}>
                        <Area type="monotone" dataKey="value" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.1} strokeWidth={1.5} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <span className="text-xl sm:text-3xl font-bold text-blue-950 dark:text-white drop-shadow-sm">{pendingReview}</span>
                <div className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                  <Clock size={14} className="text-amber-500" />
                  <span>Needs attention</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bottom Section */}
        {!isPddDashboard && (
          <div className={`grid grid-cols-1 ${isAdminDashboard ? 'lg:grid-cols-1' : 'lg:grid-cols-2'} gap-6 mt-6`}>
            {!isAdminDashboard && !isBroker && <div className="stat-card">
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
            </div>}
          </div>
        )}
      </div>
    </div>
  );
}
