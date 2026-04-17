import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { ROLE_LABELS } from '@/lib/auth';
import { Search, Shield, Edit, KeyRound, Trash2, UserPlus } from 'lucide-react';
import { RoleAssignModal } from '@/components/RoleAssignModal';
import { usersAPI } from '@/lib/api';
import { toast } from 'sonner';

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

export default function BrokerManagement() {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);

  const handleEditBroker = (u: any) => {
    setSelectedUser(u);
    setModalOpen(true);
  };

  const handleDeleteBroker = async (u: any) => {
    if (!window.confirm(`Are you sure you want to delete broker "${u.full_name || u.email}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await usersAPI.delete(u.id);
      toast.success('Broker removed successfully');
      refetch();
    } catch (err: any) {
      toast.error(err.message || 'Failed to remove broker');
    }
  };

  const { data: brokers = [], isLoading, refetch, error } = useQuery({
    queryKey: ['brokers-management'],
    queryFn: async () => {
      try {
        // Fetch all users and filter for brokers
        const allUsers = await usersAPI.getAll();
        return allUsers.filter((u: any) => u.role === 'broker');
      } catch (err) {
        console.error('Error fetching brokers:', err);
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
      u.channel_code?.toLowerCase().includes(searchStr) ||
      u.phone?.toLowerCase().includes(searchStr)
    );
  });

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Broker Management</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage external sales partners, recruitment, and channel codes</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="stat-card">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Total Brokers</p>
          <div className="flex items-end justify-between mt-1">
            <h3 className="text-2xl font-bold text-foreground">{brokers.length}</h3>
            <div className="p-2 rounded-lg bg-accent/10 text-accent">
              <Shield size={20} />
            </div>
          </div>
        </div>
        <div className="stat-card">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Active This Month</p>
          <div className="flex items-end justify-between mt-1">
            <h3 className="text-2xl font-bold text-foreground">{brokers.filter((b: any) => b.is_active).length}</h3>
            <div className="p-2 rounded-lg bg-green-500/10 text-green-500">
              <UserPlus size={20} />
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
            placeholder="Search brokers by name, email, or channel code..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:border-accent"
          />
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="block lg:hidden space-y-3">
        {isLoading ? (
          <div className="py-8 text-center text-muted-foreground text-sm">Loading brokers…</div>
        ) : error ? (
          <div className="py-8 text-center text-destructive text-sm">Error loading brokers.</div>
        ) : filtered.length === 0 ? (
          <p className="text-center text-muted-foreground py-8 text-sm">No brokers found</p>
        ) : (
          filtered.map((u: any) => (
            <div key={u.id} className="stat-card">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <UserAvatar user={u} className="w-10 h-10 text-sm" />
                  <div className="min-w-0">
                    <p className="font-semibold text-foreground truncate">{u.full_name || '(No name)'}</p>
                    <div className="flex flex-col">
                      <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                      {u.phone && <p className="text-[10px] text-accent font-medium mono">{u.phone}</p>}
                    </div>
                  </div>
                </div>
                {user?.role === 'super_admin' && (
                  <button
                    onClick={() => handleEditBroker(u)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-accent/10 text-accent hover:bg-accent/15 transition-colors text-xs font-semibold"
                  >
                    <Edit size={12} />
                    Edit
                  </button>
                )}
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-blue-500/10 text-blue-600 text-[10px] font-bold">
                  Channel: {u.channel_code || '---'}
                </span>
                <span className="text-[10px] text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded border border-border/50">
                  Recruiter: {u.referred_by_name || 'No Referrer'}
                </span>
                <span className="text-xs text-muted-foreground ml-auto">
                  Joined: {new Date(u.created_at).toLocaleDateString('en-IN')}
                </span>
              </div>
              {user?.role === 'super_admin' && (
                <div className="mt-3 pt-3 border-t border-border/50 flex justify-end gap-2 text-xs">
                  <button
                    onClick={() => handleEditBroker(u)}
                    className="flex items-center gap-1 p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
                  >
                    <KeyRound size={14} /> Password
                  </button>
                  <button
                    onClick={() => handleDeleteBroker(u)}
                    className="flex items-center gap-1 p-1.5 rounded-lg hover:bg-red-500/10 text-red-500 transition-colors"
                  >
                    <Trash2 size={14} /> Remove
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden lg:block stat-card">
        {isLoading ? (
          <div className="py-8 text-center text-muted-foreground text-sm">Loading brokers…</div>
        ) : error ? (
          <div className="py-8 text-center text-destructive text-sm">Error loading brokers.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-3 font-medium text-muted-foreground">Broker</th>
                  <th className="text-left py-3 px-3 font-medium text-muted-foreground">Contact</th>
                  <th className="text-left py-3 px-3 font-medium text-muted-foreground">Channel Code</th>
                  <th className="text-left py-3 px-3 font-medium text-muted-foreground">Recruiter</th>
                  <th className="text-left py-3 px-3 font-medium text-muted-foreground">Status</th>
                  <th className="text-left py-3 px-3 font-medium text-muted-foreground">Joined</th>
                  {user?.role === 'super_admin' && <th className="py-3 px-3 text-right font-medium text-muted-foreground">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {filtered.map((u: any) => (
                  <tr key={u.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-3">
                        <UserAvatar user={u} className="w-8 h-8 text-xs" />
                        <span className="font-medium text-foreground">{u.full_name || '(No name)'}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex flex-col">
                        <span className="text-foreground text-xs">{u.email}</span>
                        {u.phone && <span className="text-accent text-[10px] font-medium mono">{u.phone}</span>}
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <span className="text-xs font-bold text-blue-600 mono">{u.channel_code || '---'}</span>
                    </td>
                    <td className="py-3 px-3 text-muted-foreground text-xs">
                      {u.referred_by_name || <span className="text-muted-foreground/30">No Referrer</span>}
                    </td>
                    <td className="py-3 px-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold uppercase ${u.is_active ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                        {u.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-muted-foreground text-xs">
                      {new Date(u.created_at).toLocaleDateString('en-IN')}
                    </td>
                    {user?.role === 'super_admin' && (
                      <td className="py-3 px-3 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleEditBroker(u)}
                            className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground inline-flex items-center"
                            title="Edit Broker"
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            onClick={() => handleEditBroker(u)}
                            className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground inline-flex items-center"
                            title="Reset Password"
                          >
                            <KeyRound size={14} />
                          </button>
                          <button
                            onClick={() => handleDeleteBroker(u)}
                            className="p-1.5 rounded-lg hover:bg-red-500/10 text-red-500 transition-colors inline-flex items-center"
                            title="Remove Broker"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && <p className="text-center text-muted-foreground py-8 text-sm">No brokers found</p>}
          </div>
        )}
      </div>

      <RoleAssignModal open={modalOpen} onClose={() => setModalOpen(false)} onSuccess={refetch} user={selectedUser} />
    </div>
  );
}
