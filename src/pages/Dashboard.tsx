import { useAuth } from '@/contexts/AuthContext';
import StatCard from '@/components/StatCard';
import LoanStatusBadge from '@/components/LoanStatusBadge';
import { MOCK_LOANS, formatCurrency, LOAN_STATUSES } from '@/lib/mock-data';
import { ROLE_LABELS } from '@/lib/auth';
import { FileText, IndianRupee, TrendingUp, Clock, Users, Building2, CheckCircle2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Link } from 'react-router-dom';

const STATUS_CHART_COLORS = ['#94a3b8', '#3b82f6', '#f59e0b', '#10b981', '#ef4444', '#14b8a6', '#6b7280'];

export default function Dashboard() {
  const { user } = useAuth();
  if (!user) return null;

  const totalLoans = MOCK_LOANS.length;
  const totalVolume = MOCK_LOANS.reduce((s, l) => s + l.loanAmount, 0);
  const disbursed = MOCK_LOANS.filter(l => l.status === 'disbursed');
  const disbursedAmount = disbursed.reduce((s, l) => s + l.loanAmount, 0);
  const pendingReview = MOCK_LOANS.filter(l => l.status === 'under_review').length;

  const statusData = LOAN_STATUSES.map(s => ({
    name: s.label,
    value: MOCK_LOANS.filter(l => l.status === s.value).length,
  })).filter(d => d.value > 0);

  const bankData = [...new Set(MOCK_LOANS.map(l => l.assignedBank).filter(Boolean))].map(bank => ({
    name: bank.replace(' Bank', ''),
    loans: MOCK_LOANS.filter(l => l.assignedBank === bank).length,
    amount: MOCK_LOANS.filter(l => l.assignedBank === bank).reduce((s, l) => s + l.loanAmount, 0) / 100000,
  }));

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">
          Welcome, {user.name}
        </h1>
        <p className="text-muted-foreground text-sm mt-1">{ROLE_LABELS[user.role]} Dashboard • {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Applications" value={String(totalLoans)} change="+12% this month" changeType="positive" icon={<FileText size={20} />} />
        <StatCard label="Loan Volume" value={formatCurrency(totalVolume)} change="+8.5% this month" changeType="positive" icon={<IndianRupee size={20} />} />
        <StatCard label="Disbursed" value={formatCurrency(disbursedAmount)} change={`${disbursed.length} loans`} changeType="neutral" icon={<CheckCircle2 size={20} />} />
        <StatCard label="Under Review" value={String(pendingReview)} change="Needs attention" changeType="negative" icon={<Clock size={20} />} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <div className="stat-card">
          <h3 className="font-semibold text-foreground mb-4">Bank-wise Distribution (₹ Lakhs)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={bankData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '13px' }} />
                <Bar dataKey="amount" fill="hsl(var(--accent))" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="stat-card">
          <h3 className="font-semibold text-foreground mb-4">Status Breakdown</h3>
          <div className="h-64">
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
              {MOCK_LOANS.slice(0, 5).map(loan => (
                <tr key={loan.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                  <td className="py-3 px-2 mono text-xs text-accent font-medium">{loan.id}</td>
                  <td className="py-3 px-2 font-medium text-foreground">{loan.applicantName}</td>
                  <td className="py-3 px-2 text-muted-foreground hidden sm:table-cell">{loan.carMake} {loan.carModel}</td>
                  <td className="py-3 px-2 font-medium text-foreground">{formatCurrency(loan.loanAmount)}</td>
                  <td className="py-3 px-2"><LoanStatusBadge status={loan.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
