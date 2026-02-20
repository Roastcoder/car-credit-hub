import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency, LOAN_STATUSES } from '@/lib/mock-data';
import LoanStatusBadge from '@/components/LoanStatusBadge';
import { Search, Plus, ChevronRight } from 'lucide-react';

type LoanStatusFilter = 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected' | 'disbursed' | 'cancelled' | 'all';

export default function Loans() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<LoanStatusFilter>('all');

  const { data: loans = [], isLoading } = useQuery({
    queryKey: ['loans'],
    queryFn: async () => {
      const { data } = await supabase
        .from('loans')
        .select('*, banks(name), brokers(name)')
        .order('created_at', { ascending: false });
      return data ?? [];
    },
  });

  const filtered = loans.filter((l: any) => {
    const matchSearch = !search ||
      l.applicant_name?.toLowerCase().includes(search.toLowerCase()) ||
      l.id?.toLowerCase().includes(search.toLowerCase()) ||
      l.car_model?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || l.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Loan Applications</h1>
          <p className="text-sm text-muted-foreground mt-1">{filtered.length} applications found</p>
        </div>
        <Link to="/loans/new" className="inline-flex items-center gap-2 bg-accent text-accent-foreground font-semibold py-2.5 px-4 rounded-xl hover:opacity-90 transition-opacity text-sm">
          <Plus size={16} /> New Application
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by name, ID, or car..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all ${statusFilter === 'all' ? 'bg-accent text-accent-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
          >All</button>
          {LOAN_STATUSES.map(s => (
            <button
              key={s.value}
              onClick={() => setStatusFilter(s.value as LoanStatusFilter)}
              className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all ${statusFilter === s.value ? 'bg-accent text-accent-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
            >{s.label}</button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="stat-card overflow-hidden">
        {isLoading ? (
          <div className="py-12 text-center text-muted-foreground text-sm">Loading applications…</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-3 font-medium text-muted-foreground">Loan ID</th>
                  <th className="text-left py-3 px-3 font-medium text-muted-foreground">Applicant</th>
                  <th className="text-left py-3 px-3 font-medium text-muted-foreground hidden md:table-cell">Vehicle</th>
                  <th className="text-left py-3 px-3 font-medium text-muted-foreground hidden lg:table-cell">Bank</th>
                  <th className="text-right py-3 px-3 font-medium text-muted-foreground">Amount</th>
                  <th className="text-right py-3 px-3 font-medium text-muted-foreground hidden sm:table-cell">EMI</th>
                  <th className="text-left py-3 px-3 font-medium text-muted-foreground">Status</th>
                  <th className="py-3 px-3"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((loan: any) => (
                  <tr key={loan.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors group cursor-pointer" onClick={() => navigate(`/loans/${loan.id}`)}>
                    <td className="py-3.5 px-3 mono text-xs text-accent font-medium">{loan.loan_number || loan.id}</td>
                    <td className="py-3.5 px-3">
                      <p className="font-medium text-foreground">{loan.applicant_name}</p>
                      <p className="text-xs text-muted-foreground">{loan.mobile}</p>
                    </td>
                    <td className="py-3.5 px-3 hidden md:table-cell">
                      <p className="text-foreground">{loan.maker_name || loan.car_make} {loan.model_variant_name || loan.car_model}</p>
                      <p className="text-xs text-muted-foreground">{loan.vehicle_number || loan.car_variant}</p>
                    </td>
                    <td className="py-3.5 px-3 text-muted-foreground hidden lg:table-cell">{loan.banks?.name || '—'}</td>
                    <td className="py-3.5 px-3 text-right font-medium text-foreground">{formatCurrency(Number(loan.loan_amount))}</td>
                    <td className="py-3.5 px-3 text-right text-muted-foreground hidden sm:table-cell">{formatCurrency(Number(loan.emi))}/mo</td>
                    <td className="py-3.5 px-3"><LoanStatusBadge status={loan.status} /></td>
                    <td className="py-3.5 px-3">
                      <ChevronRight size={16} className="text-muted-foreground group-hover:text-accent transition-colors" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && !isLoading && (
              <div className="py-12 text-center text-muted-foreground">No applications found</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
