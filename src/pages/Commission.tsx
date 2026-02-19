import { useState } from 'react';
import { MOCK_LOANS, formatCurrency } from '@/lib/mock-data';
import { CreditCard, IndianRupee, TrendingUp, Download, Filter, CheckCircle2, Clock, XCircle } from 'lucide-react';

interface CommissionEntry {
  id: string;
  loanId: string;
  applicant: string;
  broker: string;
  loanAmount: number;
  commissionRate: number;
  commissionAmount: number;
  status: 'paid' | 'pending' | 'on_hold';
  paidDate?: string;
}

const COMMISSION_DATA: CommissionEntry[] = MOCK_LOANS.filter(l => l.status === 'disbursed' || l.status === 'approved').map((l, i) => ({
  id: `COM-${String(i + 1).padStart(3, '0')}`,
  loanId: l.id,
  applicant: l.applicantName,
  broker: l.assignedBroker,
  loanAmount: l.loanAmount,
  commissionRate: 1.5,
  commissionAmount: Math.round(l.loanAmount * 0.015),
  status: l.status === 'disbursed' ? 'paid' : 'pending',
  paidDate: l.status === 'disbursed' ? '2025-02-15' : undefined,
}));

const STATUS_STYLES = {
  paid: { bg: 'bg-emerald-100 text-emerald-700', icon: <CheckCircle2 size={10} />, label: 'Paid' },
  pending: { bg: 'bg-amber-100 text-amber-700', icon: <Clock size={10} />, label: 'Pending' },
  on_hold: { bg: 'bg-red-100 text-red-700', icon: <XCircle size={10} />, label: 'On Hold' },
};

export default function Commission() {
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filtered = COMMISSION_DATA.filter(c => statusFilter === 'all' || c.status === statusFilter);
  const totalCommission = COMMISSION_DATA.reduce((s, c) => s + c.commissionAmount, 0);
  const paidCommission = COMMISSION_DATA.filter(c => c.status === 'paid').reduce((s, c) => s + c.commissionAmount, 0);
  const pendingCommission = COMMISSION_DATA.filter(c => c.status === 'pending').reduce((s, c) => s + c.commissionAmount, 0);

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Commission Module</h1>
          <p className="text-muted-foreground text-sm mt-1">Track broker and employee payouts</p>
        </div>
        <button className="flex items-center gap-2 bg-accent text-accent-foreground font-semibold py-2.5 px-4 rounded-xl hover:opacity-90 transition-opacity text-sm">
          <Download size={16} /> Export Report
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="stat-card flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center"><CreditCard size={20} className="text-accent" /></div>
          <div><p className="text-2xl font-bold text-foreground">{formatCurrency(totalCommission)}</p><p className="text-xs text-muted-foreground">Total Commission</p></div>
        </div>
        <div className="stat-card flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center"><CheckCircle2 size={20} className="text-emerald-600" /></div>
          <div><p className="text-2xl font-bold text-foreground">{formatCurrency(paidCommission)}</p><p className="text-xs text-muted-foreground">Paid Out</p></div>
        </div>
        <div className="stat-card flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center"><Clock size={20} className="text-amber-600" /></div>
          <div><p className="text-2xl font-bold text-foreground">{formatCurrency(pendingCommission)}</p><p className="text-xs text-muted-foreground">Pending</p></div>
        </div>
      </div>

      {/* Filters */}
      <div className="stat-card mb-4">
        <div className="flex items-center gap-2 flex-wrap">
          <Filter size={14} className="text-muted-foreground" />
          {['all', 'paid', 'pending', 'on_hold'].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${statusFilter === s ? 'bg-accent text-accent-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>
              {s === 'all' ? 'All' : s === 'on_hold' ? 'On Hold' : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="stat-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-3 font-medium text-muted-foreground">ID</th>
                <th className="text-left py-3 px-3 font-medium text-muted-foreground">Loan</th>
                <th className="text-left py-3 px-3 font-medium text-muted-foreground hidden sm:table-cell">Broker</th>
                <th className="text-left py-3 px-3 font-medium text-muted-foreground">Loan Amount</th>
                <th className="text-left py-3 px-3 font-medium text-muted-foreground">Commission</th>
                <th className="text-left py-3 px-3 font-medium text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => {
                const style = STATUS_STYLES[c.status];
                return (
                  <tr key={c.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-3 mono text-xs text-accent font-medium">{c.id}</td>
                    <td className="py-3 px-3">
                      <p className="font-medium text-foreground">{c.applicant}</p>
                      <p className="text-xs text-muted-foreground">{c.loanId}</p>
                    </td>
                    <td className="py-3 px-3 text-muted-foreground hidden sm:table-cell">{c.broker}</td>
                    <td className="py-3 px-3 font-medium text-foreground">{formatCurrency(c.loanAmount)}</td>
                    <td className="py-3 px-3">
                      <p className="font-bold text-accent">{formatCurrency(c.commissionAmount)}</p>
                      <p className="text-[10px] text-muted-foreground">{c.commissionRate}%</p>
                    </td>
                    <td className="py-3 px-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium ${style.bg}`}>
                        {style.icon} {style.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && <p className="text-center text-muted-foreground py-8 text-sm">No commission records found</p>}
      </div>
    </div>
  );
}
