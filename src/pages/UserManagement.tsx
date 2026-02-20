import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ROLE_LABELS, UserRole } from '@/lib/auth';
import { Users, Search, Shield, Edit } from 'lucide-react';
import { RoleAssignModal } from '@/components/RoleAssignModal';

export default function UserManagement() {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);

  const handleAssignRole = (u: any) => {
    setSelectedUser(u);
    setModalOpen(true);
  };

  const { data: profiles = [], isLoading, refetch } = useQuery({
    queryKey: ['users-management'],
    queryFn: async () => {
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      const { data: rolesData } = await supabase
        .from('user_roles')
        .select('*');

      return (profilesData ?? []).map((p: any) => ({
        ...p,
        role: rolesData?.find((r: any) => r.user_id === p.id)?.role ?? null,
      }));
    },
    enabled: !!user,
  });

  const filtered = profiles.filter((u: any) => {
    const matchSearch = u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === 'all' || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const roleCounts = profiles.reduce((acc: Record<string, number>, u: any) => {
    if (u.role) acc[u.role] = (acc[u.role] || 0) + 1;
    return acc;
  }, {});

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">User Management</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage system users and their roles</p>
        </div>
      </div>

      {/* Role summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        {Object.entries(ROLE_LABELS).map(([role, label]) => (
          <div
            key={role}
            onClick={() => setRoleFilter(roleFilter === role ? 'all' : role)}
            className={`stat-card cursor-pointer text-center ${roleFilter === role ? 'ring-2 ring-accent' : ''}`}
          >
            <p className="text-lg font-bold text-foreground">{roleCounts[role] || 0}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="stat-card mb-4">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search users by name or email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:border-accent"
          />
        </div>
      </div>

      {/* Table */}
      <div className="stat-card">
        {isLoading ? (
          <div className="py-8 text-center text-muted-foreground text-sm">Loading users…</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-3 font-medium text-muted-foreground">User</th>
                  <th className="text-left py-3 px-3 font-medium text-muted-foreground hidden sm:table-cell">Email</th>
                  <th className="text-left py-3 px-3 font-medium text-muted-foreground">Role</th>
                  <th className="text-left py-3 px-3 font-medium text-muted-foreground">Joined</th>
                  {user?.role === 'super_admin' && <th className="py-3 px-3"></th>}
                </tr>
              </thead>
              <tbody>
                {filtered.map((u: any) => (
                  <tr key={u.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center text-accent font-semibold text-xs">
                          {(u.full_name || u.email || '?').split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                        </div>
                        <span className="font-medium text-foreground">{u.full_name || '(No name)'}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-muted-foreground hidden sm:table-cell">{u.email}</td>
                    <td className="py-3 px-3">
                      {u.role ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-accent/10 text-accent text-xs font-medium">
                          <Shield size={10} /> {ROLE_LABELS[u.role as UserRole]}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">No role</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-muted-foreground text-xs">
                      {new Date(u.created_at).toLocaleDateString('en-IN')}
                    </td>
                    {user?.role === 'super_admin' && (
                      <td className="py-3 px-3">
                        <button onClick={() => handleAssignRole(u)} className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
                          <Edit size={14} />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && <p className="text-center text-muted-foreground py-8 text-sm">No users found</p>}
          </div>
        )}
      </div>

      <RoleAssignModal open={modalOpen} onClose={() => setModalOpen(false)} onSuccess={refetch} user={selectedUser} />
    </div>
  );
}
