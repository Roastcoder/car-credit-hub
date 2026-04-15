import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { permissionsAPI } from '@/lib/api';
import { ROLE_LABELS, UserRole, UserPermissions } from '@/lib/auth';
import { Shield, Search, Check, X, Loader2, Save, Undo } from 'lucide-react';
import { toast } from 'sonner';

const PERMISSION_KEYS: { key: keyof UserPermissions; label: string; description: string; group: string }[] = [
  // Leads
  { key: 'can_view_leads',      label: 'View Leads',          description: 'Access leads list',                group: 'Leads' },
  { key: 'can_create_lead',     label: 'Create Lead',         description: 'Add new leads',                    group: 'Leads' },
  { key: 'can_edit_leads',      label: 'Edit Leads',          description: 'Modify lead details',              group: 'Leads' },
  // Loans
  { key: 'can_view_loans',      label: 'View Loans',          description: 'Access loans list',                group: 'Loans' },
  { key: 'can_create_loan',     label: 'Create Loan',         description: 'Add new loan applications',        group: 'Loans' },
  { key: 'can_edit_loans',      label: 'Edit Loans',          description: 'Modify loan details',              group: 'Loans' },
  // PDD & Payments
  { key: 'can_manage_pdd',      label: 'Manage PDD',          description: 'PDD tracking & verification',      group: 'Operations' },
  { key: 'can_manage_payments', label: 'Manage Payments',     description: 'Payment applications & vouchers',  group: 'Operations' },
  // Reports & Dashboard
  { key: 'can_view_reports',    label: 'View Reports',        description: 'Financial & sales reports',        group: 'Reports' },
  { key: 'can_view_dashboard',  label: 'View Dashboard',      description: 'Access dashboard & KPIs',          group: 'Reports' },
  // Admin
  { key: 'can_view_users',      label: 'View Users',          description: 'Access user management',           group: 'Admin' },
  { key: 'can_view_branches',   label: 'View Branches',       description: 'Access branch management',         group: 'Admin' },
  { key: 'can_view_banks',      label: 'View Banks',          description: 'Access bank management',           group: 'Admin' },
  { key: 'can_view_brokers',    label: 'View Brokers',        description: 'Access broker management',         group: 'Admin' },
  { key: 'can_view_commissions',label: 'View Commissions',    description: 'Access commission data',           group: 'Admin' },
];

const GROUPS = ['Leads', 'Loans', 'Operations', 'Reports', 'Admin'];

export default function PermissionManagement() {
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [editingPermissions, setEditingPermissions] = useState<Record<number, UserPermissions>>({});

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['admin-permissions'],
    queryFn: permissionsAPI.getAllUsers,
    enabled: currentUser?.role === 'super_admin',
  });

  const updateMutation = useMutation({
    mutationFn: ({ userId, permissions }: { userId: number; permissions: UserPermissions }) => 
      permissionsAPI.update(userId, permissions),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-permissions'] });
      toast.success('Permissions updated successfully');
      setEditingPermissions({});
    },
    onError: (error: any) => {
      toast.error('Failed to update permissions: ' + error.message);
    }
  });

  const handleToggle = (userId: number, key: keyof UserPermissions, currentState: boolean | undefined) => {
    const user = users.find((u: any) => u.id === userId);
    if (!user) return;

    // Use current editing state or fall back to user's database permissions
    const currentPerms = editingPermissions[userId] || user.permissions || {};
    
    const nextPerms = {
      ...currentPerms,
      [key]: !currentState
    };

    setEditingPermissions(prev => ({
      ...prev,
      [userId]: nextPerms
    }));
  };

  const handleSave = (userId: number) => {
    if (editingPermissions[userId]) {
      updateMutation.mutate({ 
        userId, 
        permissions: editingPermissions[userId] 
      });
    }
  };

  const handleReset = (userId: number) => {
    setEditingPermissions(prev => {
      const next = { ...prev };
      delete next[userId];
      return next;
    });
  };

  const filteredUsers = users.filter((u: any) => 
    u.name?.toLowerCase().includes(search.toLowerCase()) || 
    u.role?.toLowerCase().includes(search.toLowerCase())
  );

  if (currentUser?.role !== 'super_admin') {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4">
        <Shield size={48} className="text-destructive mb-4" />
        <h1 className="text-xl font-bold">Access Denied</h1>
        <p className="text-muted-foreground text-center mt-2 max-w-xs">
          Only Super Admins can manage granular permissions.
        </p>
      </div>
    );
  }

  return (
    <div className="pb-20">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Permission Control</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Manually toggle specific capabilities for Managers, RBMs and Admins.
        </p>
      </div>

      {/* Search Bar */}
      <div className="stat-card mb-6">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search managers or admins..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-background/50 text-foreground text-sm focus:outline-none focus:border-accent transition-all"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-accent" size={32} />
        </div>
      ) : (
        <div className="space-y-4">
          {filteredUsers.length === 0 ? (
            <p className="text-center text-muted-foreground py-10 stat-card">No eligible users found.</p>
          ) : (
            filteredUsers.map((user: any) => {
              const hasChanges = !!editingPermissions[user.id];
              const displayPerms = editingPermissions[user.id] || user.permissions || {};

              return (
                <div key={user.id} className={`stat-card transition-all ${hasChanges ? 'ring-1 ring-accent/50 bg-accent/5' : ''}`}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center text-accent font-bold text-sm">
                        {user.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-bold text-foreground leading-none">{user.name}</h3>
                        <p className="text-xs text-muted-foreground mt-1 uppercase tracking-wider">
                          {ROLE_LABELS[user.role as UserRole]}
                        </p>
                      </div>
                    </div>

                    {hasChanges && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleReset(user.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted text-muted-foreground hover:text-foreground text-xs font-medium transition-all"
                        >
                          <Undo size={14} /> Reset
                        </button>
                        <button
                          onClick={() => handleSave(user.id)}
                          disabled={updateMutation.isPending}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent text-accent-foreground hover:bg-accent/90 text-xs font-medium transition-all shadow-sm shadow-accent/20"
                        >
                          {updateMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                          Save Changes
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    {GROUPS.map(group => {
                      const groupKeys = PERMISSION_KEYS.filter(p => p.group === group);
                      return (
                        <div key={group}>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">{group}</p>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                            {groupKeys.map(({ key, label, description }) => {
                              const isGranted = !!displayPerms[key];
                              return (
                                <div
                                  key={key}
                                  onClick={() => handleToggle(user.id, key, isGranted)}
                                  className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer select-none ${
                                    isGranted
                                      ? 'bg-accent/10 border-accent/20 text-accent'
                                      : 'bg-muted/30 border-transparent text-muted-foreground'
                                  }`}
                                >
                                  <div className="min-w-0 pr-2">
                                    <p className="text-xs font-bold leading-tight truncate">{label}</p>
                                    <p className="text-[10px] opacity-70 leading-tight mt-0.5 truncate">{description}</p>
                                  </div>
                                  <div className={`w-5 h-5 rounded-md flex-shrink-0 flex items-center justify-center transition-all ${
                                    isGranted ? 'bg-accent text-accent-foreground' : 'bg-muted border border-border'
                                  }`}>
                                    {isGranted ? <Check size={12} strokeWidth={4} /> : <X size={12} className="opacity-30" />}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
