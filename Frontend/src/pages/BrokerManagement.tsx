import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { formatCurrency } from '@/lib/utils';
import { UserCheck, Search, Plus, FileText, IndianRupee, Edit, Trash2, MapPin, Phone, Mail, Percent, User } from 'lucide-react';
import { BrokerFormModal } from '@/components/BrokerFormModal';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const UserAvatar = ({ user, className }: { user: any, className?: string }) => {
  const [error, setError] = useState(false);
  const initials = (user.name || '?').split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
  
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
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editBroker, setEditBroker] = useState<any>(null);
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isAdmin = user?.role === 'super_admin' || user?.role === 'admin';

  const { data: brokers = [], isLoading, refetch } = useQuery({
    queryKey: ['brokers'],
    queryFn: async () => {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/brokers`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` },
      });
      if (!res.ok) throw new Error('Failed to fetch brokers');
      const data = await res.json();
      return Array.isArray(data) ? data : (data.data || []);
    },
  });

  const { data: loans = [] } = useQuery({
    queryKey: ['loans-for-brokers'],
    queryFn: async () => {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/loans`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` },
      });
      if (!res.ok) throw new Error('Failed to fetch loans');
      const data = await res.json();
      return Array.isArray(data) ? data : (data.data || []);
    },
  });

  const deleteBrokerMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/brokers/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` },
      });
      if (!res.ok) throw new Error('Failed to delete broker');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brokers'] });
      toast.success('Broker deleted successfully');
    },
    onError: () => toast.error('Failed to delete broker'),
  });

  const handleAddBroker = () => {
    setEditBroker(null);
    setModalOpen(true);
  };

  const handleEditBroker = (broker: any) => {
    setEditBroker(broker);
    setModalOpen(true);
  };

  const handleDeleteBroker = (broker: any) => {
    if (window.confirm(`Are you sure you want to delete broker "${broker.name}"? This action cannot be undone.`)) {
      deleteBrokerMutation.mutate(broker.id);
    }
  };

  const filtered = (brokers as any[])
    .filter(b =>
      b.name.toLowerCase().includes(search.toLowerCase()) ||
      (b.area || '').toLowerCase().includes(search.toLowerCase()) ||
      (b.dsa_code || '').toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      const numA = parseInt(a.dsa_code?.replace(/^\D+/g, '')) || 0;
      const numB = parseInt(b.dsa_code?.replace(/^\D+/g, '')) || 0;
      return numA - numB;
    });

  const formatDSACode = (code: string) => {
    if (!code || !code.startsWith('MEH')) return code || '—';
    const number = code.replace(/^\D+/g, '');
    const prefixMatch = code.match(/^MEH([A-Z]+)/);
    const initials = prefixMatch ? prefixMatch[1] : '';
    return `MEH${initials}${number}`;
  };

  const totalPending = (loans as any[])
    .filter(l => l.status !== 'disbursed')
    .reduce((s, l) => s + Number(l.loan_amount) * 0.015, 0);

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Broker Management</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage external sales partners</p>
        </div>
        <button onClick={handleAddBroker} className="flex items-center gap-2 bg-accent text-accent-foreground font-semibold py-2.5 px-4 rounded-xl hover:opacity-90 transition-opacity text-sm">
          <Plus size={16} /> Add Broker
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="stat-card flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center"><UserCheck size={20} className="text-accent" /></div>
          <div><p className="text-2xl font-bold text-foreground">{brokers.length}</p><p className="text-xs text-muted-foreground">Active Brokers</p></div>
        </div>
        <div className="stat-card flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center"><FileText size={20} className="text-accent" /></div>
          <div><p className="text-2xl font-bold text-foreground">{loans.length}</p><p className="text-xs text-muted-foreground">Total Cases</p></div>
        </div>
        <div className="stat-card flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center"><IndianRupee size={20} className="text-accent" /></div>
          <div><p className="text-2xl font-bold text-foreground">{formatCurrency(totalPending)}</p><p className="text-xs text-muted-foreground">Pending Payouts</p></div>
        </div>
      </div>

      <div className="stat-card mb-4">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input type="text" placeholder="Search brokers..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:border-accent" />
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden space-y-3">
        {isLoading ? (
          <div className="py-8 text-center text-muted-foreground text-sm">Loading brokers…</div>
        ) : filtered.length === 0 ? (
          <p className="text-center text-muted-foreground py-8 text-sm">No brokers found</p>
        ) : (
          filtered.map((b: any) => (
            <div key={b.id} className="stat-card">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-foreground">{b.name}</h3>
                  <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mt-0.5">
                    <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 font-bold">{b.dsa_code || 'DSA-TBD'}</span>
                    <span>•</span>
                    <span className="font-medium text-accent truncate max-w-[120px]">
                      {b.assigned_user_name || 'Unassigned'}
                      {b.secondary_user_name ? ` & ${b.secondary_user_name}` : ''}
                    </span>
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${(b.is_active === true || b.is_active === 'true' || b.is_active === 1) ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {(b.is_active === true || b.is_active === 'true' || b.is_active === 1) ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                    <Mail size={12} /> <span className="truncate">{b.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                    <Phone size={12} /> <span>{b.phone}</span>
                  </div>
                </div>
                <div className="space-y-2 text-right">
                  <div className="flex items-center justify-end gap-2 text-[11px] text-muted-foreground">
                    <Percent size={12} /> <span className="font-bold text-foreground">{b.commission_rate}% Rate</span>
                  </div>
                  <div className="flex items-center justify-end gap-2 text-[11px] text-muted-foreground">
                    <User size={12} className="text-blue-500" /> <span className="text-foreground">Ref: {b.referred_by_name || 'None'}</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleEditBroker(b)} className="flex-1 py-2 rounded-lg border border-border text-xs font-bold hover:bg-muted transition-colors">Edit Details</button>
                {isAdmin && (
                  <button onClick={() => handleDeleteBroker(b)} className="px-3 py-2 rounded-lg border border-border text-red-500 hover:bg-red-50 transition-colors">
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop Table View */}
      <div className="stat-card hidden lg:block">
        {isLoading ? (
          <div className="py-8 text-center text-muted-foreground text-sm">Loading brokers…</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Broker Info</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Assignment</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">DSA Code</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Area</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider text-center">Commission</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider text-center">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((b: any) => (
                  <tr key={b.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <UserAvatar user={b} className="w-8 h-8 text-xs" />
                        <div>
                          <p className="font-medium text-foreground">{b.name}</p>
                          <p className="text-xs text-muted-foreground">{b.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground" title="Primary Assignment">
                          <UserCheck size={14} className="text-accent" />
                          <span className="font-medium text-foreground">{b.assigned_user_name || 'Unassigned'}</span>
                        </div>
                        {b.secondary_user_name && (
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground" title="Secondary Assignment">
                            <UserCheck size={14} className="text-indigo-500" />
                            <span className="font-medium text-foreground">{b.secondary_user_name}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mt-0.5" title="Referred By">
                          <User size={12} className="text-blue-500" />
                          <span>Ref: {b.referred_by_name || 'None'}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-accent font-medium mono text-xs">{formatDSACode(b.dsa_code)}</td>
                    <td className="px-6 py-4 text-muted-foreground">{b.area || '—'}</td>
                    <td className="px-6 py-4 font-medium text-accent text-center">{b.commission_rate}%</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${(b.is_active === true || b.is_active === 'true' || b.is_active === 1) ? 'bg-emerald-100 text-emerald-700' : 'bg-muted text-muted-foreground'}`}>
                        {(b.is_active === true || b.is_active === 'true' || b.is_active === 1) ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => handleEditBroker(b)} className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
                          <Edit size={14} />
                        </button>
                        {isAdmin && (
                          <button onClick={() => handleDeleteBroker(b)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors">
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && <p className="text-center text-muted-foreground py-8 text-sm">No brokers found</p>}
          </div>
        )}
      </div>

      <BrokerFormModal open={modalOpen} onClose={() => setModalOpen(false)} onSuccess={refetch} broker={editBroker} />
    </div>
  );
}
