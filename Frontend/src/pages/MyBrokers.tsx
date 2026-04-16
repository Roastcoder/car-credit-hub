import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { Search, Shield, UserCheck, MessageSquare } from 'lucide-react';
import { usersAPI } from '@/lib/api';

const UserAvatar = ({ user, className }: { user: any, className?: string }) => {
  const [error, setError] = useState(false);
  const initials = (user.full_name || user.email || '?').split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
  
  const imageUrl = user.profile_image 
    ? `${(import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/api\/?$/, '')}${user.profile_image}`
    : null;

  return (
    <div className={`rounded-full bg-accent/10 flex items-center justify-center text-accent font-semibold overflow-hidden shrink-0 ${className}`}>
      {(imageUrl && !error) ? (
        <img 
          src={imageUrl} 
          alt="" 
          className="w-full h-full object-cover"
          onError={() => setError(true)}
        />
      ) : (
        initials
      )}
    </div>
  );
};

export default function MyBrokers() {
  const { user } = useAuth();
  const [search, setSearch] = useState('');

  const { data: brokers = [], isLoading, error } = useQuery({
    queryKey: ['my-brokers-list'],
    queryFn: async () => {
      try {
        // Fetch users referred by me
        return await usersAPI.getAll({ referred_by_me: true });
      } catch (err) {
        console.error('Error fetching my brokers:', err);
        return [];
      }
    },
    enabled: !!user,
  });

  const filtered = brokers.filter((u: any) => {
    const searchStr = search.toLowerCase();
    return (
      u.full_name?.toLowerCase().includes(searchStr) ||
      u.email?.toLowerCase().includes(searchStr) ||
      u.channel_code?.toLowerCase().includes(searchStr)
    );
  });

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Brokers</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage and track external partners you have recruited</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <div className="stat-card">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">My Network</p>
          <div className="flex items-end justify-between mt-1">
            <h3 className="text-2xl font-bold text-foreground">{brokers.length}</h3>
            <div className="p-2 rounded-lg bg-accent/10 text-accent">
              <UserCheck size={20} />
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="stat-card mb-4">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search my brokers..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:border-accent"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {isLoading ? (
          <div className="col-span-full py-12 text-center text-muted-foreground">Loading your brokers…</div>
        ) : error ? (
          <div className="col-span-full py-12 text-center text-destructive">Error loading brokers list.</div>
        ) : filtered.length === 0 ? (
          <div className="col-span-full stat-card py-12 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <UserCheck size={32} className="text-muted-foreground/40" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">No Brokers Found</h3>
            <p className="text-muted-foreground text-sm max-w-xs mx-auto mt-2">
              You haven't recruited any brokers yet or no results match your search.
            </p>
          </div>
        ) : (
          filtered.map((u: any) => (
            <div key={u.id} className="stat-card group hover:ring-1 hover:ring-accent/30 transition-all">
              <div className="flex items-center gap-4 mb-4">
                <UserAvatar user={u} className="w-12 h-12 text-lg" />
                <div className="min-w-0">
                  <h4 className="font-bold text-foreground truncate">{u.full_name || u.email}</h4>
                  <p className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                    <Shield size={12} className="text-accent" /> Broker
                  </p>
                </div>
              </div>
              
              <div className="space-y-2.5 mb-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Channel Code:</span>
                  <span className="font-bold text-blue-600 mono">{u.channel_code || '---'}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Status:</span>
                  <span className={`font-semibold ${u.is_active ? 'text-green-500' : 'text-red-500'}`}>
                    {u.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Email:</span>
                  <span className="text-foreground truncate ml-4">{u.email}</span>
                </div>
                {u.phone && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Phone:</span>
                    <span className="text-foreground mono">{u.phone}</span>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-border/50 flex gap-2">
                <button className="flex-1 py-1.5 rounded-md bg-accent/5 text-accent hover:bg-accent/10 transition-colors text-[10px] font-bold flex items-center justify-center gap-1.5">
                  <MessageSquare size={12} /> Contact
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
