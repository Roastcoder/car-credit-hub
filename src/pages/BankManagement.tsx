import { useState } from 'react';
import { BANKS, MOCK_LOANS, formatCurrency } from '@/lib/mock-data';
import { Building2, Search, Plus, TrendingUp, FileText, CheckCircle2, XCircle } from 'lucide-react';

const BANK_DATA = BANKS.map((bank, i) => ({
  id: String(i + 1),
  name: bank,
  contactPerson: ['Anil Sharma', 'Rekha Menon', 'Suresh Yadav', 'Kavita Jain', 'Manoj Gupta', 'Priyanka Das', 'Rajiv Khanna', 'Suman Verma'][i],
  email: bank.toLowerCase().replace(/\s/g, '') + '@lending.com',
  interestRate: [8.5, 9.0, 8.75, 9.25, 8.9, 9.1, 8.65, 9.5][i],
  totalCases: MOCK_LOANS.filter(l => l.assignedBank === bank).length,
  disbursed: MOCK_LOANS.filter(l => l.assignedBank === bank && l.status === 'disbursed').length,
  volume: MOCK_LOANS.filter(l => l.assignedBank === bank).reduce((s, l) => s + l.loanAmount, 0),
  status: 'active' as const,
}));

export default function BankManagement() {
  const [search, setSearch] = useState('');

  const filtered = BANK_DATA.filter(b => b.name.toLowerCase().includes(search.toLowerCase()));
  const totalVolume = BANK_DATA.reduce((s, b) => s + b.volume, 0);
  const totalCases = BANK_DATA.reduce((s, b) => s + b.totalCases, 0);

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Bank / NBFC Management</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage lending partners and track performance</p>
        </div>
        <button className="flex items-center gap-2 bg-accent text-accent-foreground font-semibold py-2.5 px-4 rounded-xl hover:opacity-90 transition-opacity text-sm">
          <Plus size={16} /> Add Bank / NBFC
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="stat-card flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center"><Building2 size={20} className="text-accent" /></div>
          <div><p className="text-2xl font-bold text-foreground">{BANK_DATA.length}</p><p className="text-xs text-muted-foreground">Active Banks</p></div>
        </div>
        <div className="stat-card flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center"><FileText size={20} className="text-accent" /></div>
          <div><p className="text-2xl font-bold text-foreground">{totalCases}</p><p className="text-xs text-muted-foreground">Total Cases</p></div>
        </div>
        <div className="stat-card flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center"><TrendingUp size={20} className="text-accent" /></div>
          <div><p className="text-2xl font-bold text-foreground">{formatCurrency(totalVolume)}</p><p className="text-xs text-muted-foreground">Total Volume</p></div>
        </div>
      </div>

      {/* Search */}
      <div className="stat-card mb-4">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input type="text" placeholder="Search banks..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:border-accent" />
        </div>
      </div>

      {/* Cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map(bank => (
          <div key={bank.id} className="stat-card">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent font-bold text-sm">
                  {bank.name.split(' ')[0].substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{bank.name}</h3>
                  <p className="text-xs text-muted-foreground">{bank.contactPerson}</p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-emerald-100 text-emerald-700 text-xs font-medium">
                <CheckCircle2 size={10} /> Active
              </span>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center border-t border-border pt-3">
              <div><p className="text-lg font-bold text-foreground">{bank.totalCases}</p><p className="text-[10px] text-muted-foreground">Cases</p></div>
              <div><p className="text-lg font-bold text-foreground">{bank.disbursed}</p><p className="text-[10px] text-muted-foreground">Disbursed</p></div>
              <div><p className="text-lg font-bold text-accent">{bank.interestRate}%</p><p className="text-[10px] text-muted-foreground">Rate</p></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
