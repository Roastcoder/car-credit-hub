import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { ROLE_LABELS } from '@/lib/auth';
import { useQuery } from '@tanstack/react-query';
import { usersAPI } from '@/lib/api';
import { Eye, EyeOff } from 'lucide-react';

interface RoleAssignModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  user: any;
}

export function RoleAssignModal({ open, onClose, onSuccess, user }: RoleAssignModalProps) {
  const [role, setRole] = useState(user?.role || 'employee');
  const [branchId, setBranchId] = useState(user?.branch_id || '');
  const [managedBranchIds, setManagedBranchIds] = useState<number[]>([]);
  const [isBranchManager, setIsBranchManager] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [referredBy, setReferredBy] = useState<string>(user?.referred_by || '');
  const [commissionRate, setCommissionRate] = useState(user?.commission_rate || '1.5');
  const [channelCode, setChannelCode] = useState(user?.channel_code || '');
  const [assignedUserId, setAssignedUserId] = useState(user?.assigned_user_id || '');
  const [secondaryUserId, setSecondaryUserId] = useState(user?.secondary_user_id || '');

  const { data: branches = [] } = useQuery({
    queryKey: ['branches'],
    queryFn: async () => {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/branches`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` },
      });
      if (!res.ok) throw new Error('Failed to fetch branches');
      return res.json();
    },
  });
  
  const { data: allUsers = [] } = useQuery({
    queryKey: ['users-list-for-modal'],
    queryFn: async () => {
      return await usersAPI.getAll();
    },
  });

  useEffect(() => {
    if (user) {
      setRole(user.role || 'employee');
      setBranchId(user.branch_id || '');
      setManagedBranchIds(
        Array.isArray(user.managed_branch_ids)
          ? user.managed_branch_ids.map((value: number | string) => Number(value)).filter((value: number) => Number.isInteger(value) && value > 0)
          : (user.branch_id ? [Number(user.branch_id)] : [])
      );
      setNewPassword('');
      setShowPassword(false);
      
      // Check if this user is already the manager of their branch
      const currentBranch = (branches as any[]).find(b => Number(b.id) === Number(user.branch_id));
      setIsBranchManager(currentBranch?.manager_id === user.id);
      setReferredBy(user.referred_by || '');
      setCommissionRate(user.commission_rate || '1.5');
      setChannelCode(user.channel_code || '');
      setAssignedUserId(user.assigned_user_id || '');
      setSecondaryUserId(user.secondary_user_id || '');
    }
  }, [user, branches]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const updateData = { 
        role, 
        branch_id: branchId || null,
        referred_by: referredBy || null,
        managed_branch_ids: managedBranchIds,
        is_branch_manager: isBranchManager,
        commission_rate: role === 'broker' ? commissionRate : null,
        channel_code: role === 'broker' ? channelCode : null,
        assigned_user_id: role === 'broker' ? (assignedUserId || null) : null,
        secondary_user_id: role === 'broker' ? (secondaryUserId || null) : null
      };

      await usersAPI.updateRole(user.id, updateData);

      if (newPassword.trim()) {
        await usersAPI.resetPassword(user.id, newPassword.trim());
      }
      
      toast.success(newPassword.trim() ? 'User and password updated successfully!' : 'User updated successfully!');
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update user');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit User, Role & Password for {user?.full_name || user?.email}</DialogTitle>
          <DialogDescription>
            Update this user's role, primary branch, branch access allocation, and optionally set a new password.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Select Role *</label>
            <select required className="w-full px-3 py-2 rounded-lg border border-border bg-background" value={role} onChange={e => setRole(e.target.value)}>
              {Object.entries(ROLE_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Primary Branch</label>
            <select
              className="w-full px-3 py-2 rounded-lg border border-border bg-background"
              value={branchId}
              onChange={e => {
                const value = e.target.value;
                setBranchId(value);
                const branchNumber = Number(value);
                if (branchNumber > 0) {
                  setManagedBranchIds((prev) => Array.from(new Set([...prev, branchNumber])));
                }
              }}
            >
              <option value="">All Branches (Global Access)</option>
              {branches.map((branch: any) => (
                <option key={branch.id} value={branch.id}>{branch.name} ({branch.code})</option>
              ))}
            </select>
          </div>
          {role === 'manager' && (
            <div>
              <label className="block text-sm font-medium mb-1.5">Manager Branch Access</label>
              <div className="max-h-44 space-y-2 overflow-y-auto rounded-lg border border-border p-3">
                {branches.map((branch: any) => {
                  const branchNumber = Number(branch.id);
                  const checked = managedBranchIds.includes(branchNumber);
                  return (
                    <label key={branch.id} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => {
                          setManagedBranchIds((prev) => {
                            if (e.target.checked) {
                              return Array.from(new Set([...prev, branchNumber]));
                            }
                            return prev.filter((id) => id !== branchNumber);
                          });
                        }}
                        className="w-4 h-4 rounded border-border"
                      />
                      <span className="text-sm text-foreground">{branch.name} ({branch.code})</span>
                    </label>
                  );
                })}
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Use this section for user branch allocation. Managers can be assigned one or more branches here.
              </p>
            </div>
          )}
          {role === 'broker' && (
            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border/50">
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1.5">Referred By (Recruiter)</label>
                <select
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background"
                  value={referredBy}
                  onChange={e => setReferredBy(e.target.value)}
                >
                  <option value="">No Referrer</option>
                  {allUsers
                    .filter((u: any) => u.id !== user?.id && ['super_admin', 'admin', 'manager', 'rbm', 'employee'].includes(u.role))
                    .map((u: any) => (
                      <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                    ))}
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1.5">Channel Code</label>
                <input 
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background font-bold text-blue-600 mono" 
                  value={channelCode} 
                  onChange={e => setChannelCode(e.target.value)} 
                  placeholder="e.g. MEHCH001"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Commission (%)</label>
                <input 
                  type="number"
                  step="0.1"
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background" 
                  value={commissionRate} 
                  onChange={e => setCommissionRate(e.target.value)} 
                />
              </div>
              <div className="col-span-2 pt-2 border-t border-border/30">
                <label className="block text-xs font-bold text-muted-foreground uppercase mb-2">Internal Assignments</label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-medium mb-1">Primary Manager</label>
                    <select
                      className="w-full px-2 py-1.5 text-xs rounded-lg border border-border bg-background"
                      value={assignedUserId}
                      onChange={e => setAssignedUserId(e.target.value)}
                    >
                      <option value="">Unassigned</option>
                      {allUsers
                        .filter((u: any) => ['super_admin', 'admin', 'manager', 'rbm', 'employee'].includes(u.role))
                        .map((u: any) => (
                          <option key={u.id} value={u.id}>{u.name}</option>
                        ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium mb-1">Secondary Manager</label>
                    <select
                      className="w-full px-2 py-1.5 text-xs rounded-lg border border-border bg-background"
                      value={secondaryUserId}
                      onChange={e => setSecondaryUserId(e.target.value)}
                    >
                      <option value="">None</option>
                      {allUsers
                        .filter((u: any) => ['super_admin', 'admin', 'manager', 'rbm', 'employee'].includes(u.role))
                        .map((u: any) => (
                          <option key={u.id} value={u.id}>{u.name}</option>
                        ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}
          {role === 'manager' && branchId && (
            <div className="bg-accent/5 p-3 rounded-lg border border-accent/10">
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={isBranchManager} 
                  onChange={e => setIsBranchManager(e.target.checked)} 
                  className="w-4 h-4 rounded border-border" 
                />
                <div>
                  <span className="text-sm font-semibold text-foreground">Set as Official Branch Manager</span>
                  <p className="text-[10px] text-muted-foreground">This user will be the main contact for this branch.</p>
                </div>
              </label>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium mb-1.5">Set New Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="Leave blank to keep current password"
                className="w-full px-3 py-2 pr-11 rounded-lg border border-border bg-background"
              />
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Only super admin can set a new password. Existing passwords cannot be shown because they are stored securely as hashes.
            </p>
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border border-border text-sm font-medium">Cancel</button>
            <button type="submit" disabled={loading} className="px-4 py-2 rounded-lg bg-accent text-accent-foreground text-sm font-semibold disabled:opacity-60">{loading ? 'Saving...' : 'Save Changes'}</button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
