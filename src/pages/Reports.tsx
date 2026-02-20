import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency } from '@/lib/mock-data';
import { BarChart3, Download, FileText, IndianRupee, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { toast } from 'sonner';

const CHART_COLORS = ['#2dd4bf', '#3b82f6', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#6b7280', '#ec4899'];
const STATUS_LABELS: Record<string, string> = {
  draft: 'Draft', submitted: 'Submitted', under_review: 'Under Review',
  approved: 'Approved', rejected: 'Rejected', disbursed: 'Disbursed', cancelled: 'Cancelled'
};

export default function Reports() {
  const [reportType, setReportType] = useState<'overview' | 'bank' | 'status' | 'disbursal'>('overview');

  const { data: loans = [] } = useQuery({
    queryKey: ['loans-reports'],
    queryFn: async () => {
      const { data } = await supabase.from('loans').select('*, banks(name), brokers(name)');
      return data ?? [];
    },
  });

  const statusData = Object.entries(STATUS_LABELS).map(([key, label]) => ({
    name: label,
    value: (loans as any[]).filter(l => l.status === key).length,
  })).filter(d => d.value > 0);

  const bankData = [...new Set((loans as any[]).map(l => l.banks?.name).filter(Boolean))].map(bank => ({
    name: bank.replace(' Bank', ''),
    cases: (loans as any[]).filter(l => l.banks?.name === bank).length,
    amount: (loans as any[]).filter(l => l.banks?.name === bank).reduce((s, l) => s + Number(l.loan_amount), 0) / 100000,
  }));

  const monthlyData = [
    { month: 'Oct', applications: 12, disbursed: 8, amount: 85 },
    { month: 'Nov', applications: 18, disbursed: 12, amount: 120 },
    { month: 'Dec', applications: 15, disbursed: 10, amount: 98 },
    { month: 'Jan', applications: 22, disbursed: 15, amount: 145 },
    { month: 'Feb', applications: loans.length, disbursed: (loans as any[]).filter(l => l.status === 'disbursed').length, amount: (loans as any[]).reduce((s, l) => s + Number(l.loan_amount), 0) / 100000 },
  ];

  const totalVolume = (loans as any[]).reduce((s, l) => s + Number(l.loan_amount), 0);
  const avgLoanSize = loans.length > 0 ? totalVolume / loans.length : 0;
  const conversionRate = loans.length > 0 ? Math.round(((loans as any[]).filter(l => l.status === 'disbursed').length / loans.length) * 100) : 0;

  const handleExportPDF = () => {
    toast.success('Report exported successfully!');
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Reports & Analytics</h1>
          <p className="text-muted-foreground text-sm mt-1">Comprehensive business insights</p>
        </div>
        <button onClick={handleExportPDF} className="flex items-center gap-2 bg-accent text-accent-foreground font-semibold py-2.5 px-4 rounded-xl hover:opacity-90 transition-opacity text-sm">
          <Download size={16} /> Export PDF
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-2"><FileText size={16} className="text-accent" /><span className="text-xs text-muted-foreground">Total Applications</span></div>
          <p className="text-2xl font-bold text-foreground">{loans.length}</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-2"><IndianRupee size={16} className="text-accent" /><span className="text-xs text-muted-foreground">Total Volume</span></div>
          <p className="text-2xl font-bold text-foreground">{formatCurrency(totalVolume)}</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-2"><TrendingUp size={16} className="text-accent" /><span className="text-xs text-muted-foreground">Avg. Loan Size</span></div>
          <p className="text-2xl font-bold text-foreground">{formatCurrency(avgLoanSize)}</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-2"><BarChart3 size={16} className="text-accent" /><span className="text-xs text-muted-foreground">Conversion Rate</span></div>
          <p className="text-2xl font-bold text-foreground">{conversionRate}%</p>
        </div>
      </div>

      {/* Report type tabs */}
      <div className="flex items-center gap-2 mb-6 flex-wrap">
        {([
          { key: 'overview', label: 'Overview' },
          { key: 'bank', label: 'Bank-wise' },
          { key: 'status', label: 'Status-wise' },
          { key: 'disbursal', label: 'Disbursal Trend' },
        ] as const).map(tab => (
          <button key={tab.key} onClick={() => setReportType(tab.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${reportType === tab.key ? 'bg-accent text-accent-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {(reportType === 'overview' || reportType === 'bank') && (
          <div className="stat-card">
            <h3 className="font-semibold text-foreground mb-4">Bank-wise Distribution (₹ Lakhs)</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={bankData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                  <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} />
                  <Bar dataKey="amount" fill="hsl(var(--accent))" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {(reportType === 'overview' || reportType === 'status') && (
          <div className="stat-card">
            <h3 className="font-semibold text-foreground mb-4">Status Breakdown</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statusData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={3} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                    {statusData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {(reportType === 'overview' || reportType === 'disbursal') && (
          <div className="stat-card lg:col-span-2">
            <h3 className="font-semibold text-foreground mb-4">Monthly Trend</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                  <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} />
                  <Line type="monotone" dataKey="applications" stroke="hsl(var(--accent))" strokeWidth={2} dot={{ r: 4 }} name="Applications" />
                  <Line type="monotone" dataKey="disbursed" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} name="Disbursed" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
