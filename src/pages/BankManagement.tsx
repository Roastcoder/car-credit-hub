import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency } from '@/lib/mock-data';
import { Building2, Search, Plus, TrendingUp, FileText } from 'lucide-react';

export default function BankManagement() {
  const [search, setSearch] = useState('');

  const { data: banks = [], isLoading } = useQuery({
    queryKey: ['banks'],
    queryFn: async () => {
      const { data } = await supabase.from('banks').select('*').order('name');
      return data ?? [];
    },
  });

  const { data: loans = [] } = useQuery({
    queryKey: ['loans-for-banks'],
    queryFn: async () => {
      const { data } = await supabase.from('loans').select('assigned_bank_id, loan_amount, status');
      return data ?? [];
    },
  });

  const filtered = (banks as any[]).filter(b => b.name.toLowerCase().includes(search.toLowerCase()));
  const totalVolume = (loans as any[]).reduce((s, l) => s + Number(l.loan_amount), 0);
  const totalCases = loans.length;

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

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="stat-card flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center"><Building2 size={20} className="text-accent" /></div>
          <div><p className="text-2xl font-bold text-foreground">{banks.length}</p><p className="text-xs text-muted-foreground">Active Banks</p></div>
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

      <div className="stat-card mb-4">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input type="text" placeholder="Search banks..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:border-accent" />
        </div>
      </div>

      {isLoading ? (
        <div className="py-8 text-center text-muted-foreground text-sm">Loading banks…</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((bank: any) => {
            const bankLoans = (loans as any[]).filter(l => l.assigned_bank_id === bank.id);
            const disbursed = bankLoans.filter(l => l.status === 'disbursed').length;
            return (
              <div key={bank.id} className="stat-card">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent font-bold text-sm">
                      {bank.name.split(' ')[0].substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">{bank.name}</h3>
                      <p className="text-xs text-muted-foreground">{bank.contact_person || 'No contact'}</p>
                    </div>
                  </div>
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium ${bank.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-muted text-muted-foreground'}`}>
                    {bank.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-3 text-center border-t border-border pt-3">
                  <div><p className="text-lg font-bold text-foreground">{bankLoans.length}</p><p className="text-[10px] text-muted-foreground">Cases</p></div>
                  <div><p className="text-lg font-bold text-foreground">{disbursed}</p><p className="text-[10px] text-muted-foreground">Disbursed</p></div>
                  <div><p className="text-lg font-bold text-accent">{bank.interest_rate}%</p><p className="text-[10px] text-muted-foreground">Rate</p></div>
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && <p className="text-muted-foreground text-sm col-span-2 text-center py-8">No banks found</p>}
        </div>
      )}
    </div>
  );
}
