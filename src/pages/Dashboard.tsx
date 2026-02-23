import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import StatCard from '@/components/StatCard';
import LoanStatusBadge from '@/components/LoanStatusBadge';
import { formatCurrency, LOAN_STATUSES } from '@/lib/mock-data';
import { ROLE_LABELS } from '@/lib/auth';
import { FileText, IndianRupee, CheckCircle2, Clock, Building2, MapPin } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Link } from 'react-router-dom';

const STATUS_CHART_COLORS = ['#94a3b8', '#3b82f6', '#f59e0b', '#10b981', '#ef4444', '#14b8a6', '#6b7280'];

export default function Dashboard() {
  const { user } = useAuth();

  const { data: loans = [] } = useQuery({
    queryKey: ['loans-dashboard', user?.branch_id],
    queryFn: async () => {
      let query = supabase
        .from('loans')
        .select('*, banks(name), brokers(name)');
      
      // Filter by branch unless admin
      if (user?.role !== 'super_admin' && user?.role !== 'admin' && user?.branch_id) {
        query = query.eq('branch_id', user.branch_id);
      }
      
      const { data } = await query.order('created_at', { ascending: false }).limit(50);
      return data ?? [];
    },
    enabled: !!user,
  });

  const { data: branchInfo } = useQuery({
    queryKey: ['branch-info', user?.branch_id],
    queryFn: async () => {
      if (!user?.branch_id) return null;
      const { data } = await supabase.from('branches' as any).select('*').eq('id', user.branch_id).single();
      return data as any;
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
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">
          Welcome, {user.full_name || user.email}
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          {user.role ? ROLE_LABELS[user.role] : 'User'} Dashboard • {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Branch Info Card */}
      {branchInfo && (
        <div className="stat-card mb-6 bg-gradient-to-br from-accent/5 to-accent/10 border-accent/20">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-accent/10">
              <Building2 size={24} className="text-accent" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-foreground mb-1">{branchInfo.name} Branch</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground">Branch Code</p>
                  <p className="font-semibold text-foreground">{branchInfo.code}</p>
                </div>
                {branchInfo.city && (
                  <div>
                    <p className="text-muted-foreground">City</p>
                    <p className="font-semibold text-foreground">{branchInfo.city}, {branchInfo.state}</p>
                  </div>
                )}
                {branchInfo.manager_name && (
                  <div>
                    <p className="text-muted-foreground">Manager</p>
                    <p className="font-semibold text-foreground">{branchInfo.manager_name}</p>
                  </div>
                )}
                {branchInfo.phone && (
                  <div>
                    <p className="text-muted-foreground">Contact</p>
                    <p className="font-semibold text-foreground">{branchInfo.phone}</p>
                  </div>
                )}
              </div>
              {branchInfo.address && (
                <div className="mt-3 flex items-start gap-2">
                  <MapPin size={14} className="text-muted-foreground mt-0.5" />
                  <p className="text-sm text-muted-foreground">{branchInfo.address}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-6">
        <StatCard label="Total Applications" value={String(totalLoans)} change="+12% this month" changeType="positive" icon={<FileText size={20} />} />
        <StatCard label="Loan Volume" value={formatCurrency(totalVolume)} change="+8.5% this month" changeType="positive" icon={<IndianRupee size={20} />} />
        <StatCard label="Disbursed" value={formatCurrency(disbursedAmount)} change={`${disbursed.length} loans`} changeType="neutral" icon={<CheckCircle2 size={20} />} />
        <StatCard label="Under Review" value={String(pendingReview)} change="Needs attention" changeType="negative" icon={<Clock size={20} />} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-4 mb-6">
        <div className="stat-card">
          <h3 className="font-semibold text-foreground mb-4">Bank-wise Distribution (₹ Lakhs)</h3>
          <div className="h-64">
            {bankData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={bankData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                  <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '13px' }} />
                  <Bar dataKey="amount" fill="hsl(var(--accent))" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm">No data yet</div>
            )}
          </div>
        </div>

        <div className="stat-card">
          <h3 className="font-semibold text-foreground mb-4">Status Breakdown</h3>
          <div className="h-64">
            {statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statusData} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={4} dataKey="value" label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                    {statusData.map((_, i) => (
                      <Cell key={i} fill={STATUS_CHART_COLORS[i % STATUS_CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm">No data yet</div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Loans */}
      <div className="stat-card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-foreground">Recent Applications</h3>
          <Link to="/loans" className="text-sm text-accent font-medium hover:underline">View all →</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-2 font-medium text-muted-foreground">ID</th>
                <th className="text-left py-3 px-2 font-medium text-muted-foreground">Applicant</th>
                <th className="text-left py-3 px-2 font-medium text-muted-foreground hidden sm:table-cell">Car</th>
                <th className="text-left py-3 px-2 font-medium text-muted-foreground">Amount</th>
                <th className="text-left py-3 px-2 font-medium text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {loans.slice(0, 5).map((loan: any) => (
                <tr key={loan.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                  <td className="py-3 px-2 mono text-xs text-accent font-medium">{loan.id}</td>
                  <td className="py-3 px-2 font-medium text-foreground">{loan.applicant_name}</td>
                  <td className="py-3 px-2 text-muted-foreground hidden sm:table-cell">{loan.car_make} {loan.car_model}</td>
                  <td className="py-3 px-2 font-medium text-foreground">{formatCurrency(Number(loan.loan_amount))}</td>
                  <td className="py-3 px-2"><LoanStatusBadge status={loan.status} /></td>
                </tr>
              ))}
              {loans.length === 0 && (
                <tr><td colSpan={5} className="py-8 text-center text-muted-foreground">No applications yet. <Link to="/loans/new" className="text-accent hover:underline">Create your first loan →</Link></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
