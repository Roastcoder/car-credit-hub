import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { usersAPI, loansAPI } from '@/lib/api';
import { UserCheck, Search, Activity, CalendarDays, MapPin, Mail } from 'lucide-react';
import { format } from 'date-fns';

export default function MyBrokers() {
  const [search, setSearch] = useState('');

  // Fetch the current user's referred brokers
  const { data: brokers = [], isLoading } = useQuery({
    queryKey: ['my-referred-brokers'],
    queryFn: async () => {
      const data = await usersAPI.getAll();
      return Array.isArray(data) ? data : (data.data || []);
    },
  });

  // Fetch loans to display total cases generated per broker
  const { data: loans = [] } = useQuery({
    queryKey: ['my-brokers-loans'],
    queryFn: async () => {
      const data = await loansAPI.getAll();
      return Array.isArray(data) ? data : (data.data || []);
    },
  });

  // Filter based on search input
  const filtered = brokers.filter((b: any) =>
    (b.full_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (b.email || '').toLowerCase().includes(search.toLowerCase()) ||
    (b.branch_name || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Brokers</h1>
          <p className="text-muted-foreground text-sm mt-1">Brokers you have successfully referred</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div className="stat-card flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
            <UserCheck size={20} className="text-accent" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">{brokers.length}</p>
            <p className="text-xs text-muted-foreground">Total Referred</p>
          </div>
        </div>
        <div className="stat-card flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
            <Activity size={20} className="text-accent" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">
              {brokers.reduce((total: number, b: any) => total + loans.filter((l: any) => l.created_by === b.id).length, 0)}
            </p>
            <p className="text-xs text-muted-foreground">Combined Cases Generated</p>
          </div>
        </div>
      </div>

      <div className="stat-card mb-4">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="Search by name, email, or branch..." 
            value={search} 
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:border-accent" 
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {isLoading ? (
          <div className="col-span-full py-8 text-center text-muted-foreground text-sm">Loading your brokers…</div>
        ) : filtered.length === 0 ? (
          <div className="col-span-full py-8 text-center text-muted-foreground text-sm">
            {brokers.length === 0 ? "You haven't referred any brokers yet." : "No brokers match your search."}
          </div>
        ) : (
          filtered.map((b: any) => {
            const brokerLoans = loans.filter((l: any) => l.created_by === b.id);
            return (
              <div key={b.id} className="stat-card hover:border-accent/40 hover:shadow-lg transition-all">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-sm border border-white/20">
                    {(b.full_name || 'U').split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-foreground text-base truncate">{b.full_name}</p>
                    <div className="flex items-center gap-1 mt-0.5 text-xs text-muted-foreground truncate">
                      <Mail size={12} className="shrink-0" />
                      <span className="truncate">{b.email}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm border-t border-border pt-4">
                  <div className="flex items-center gap-2">
                    <Activity size={14} className="text-muted-foreground" />
                    <div>
                      <p className="font-semibold text-foreground">{brokerLoans.length} Cases</p>
                      <p className="text-[10px] text-muted-foreground">Generated</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <CalendarDays size={14} className="text-muted-foreground" />
                    <div>
                      <p className="font-semibold text-foreground">{b.created_at ? format(new Date(b.created_at), 'MMM d, yyyy') : 'N/A'}</p>
                      <p className="text-[10px] text-muted-foreground">Joined</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 col-span-2 mt-1">
                    <MapPin size={14} className="text-muted-foreground" />
                    <span className="font-medium text-muted-foreground truncate">{b.branch_name || 'No Branch'}</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
}
