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
  const [isBranchManager, setIsBranchManager] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

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

  useEffect(() => {
    if (user) {
      setRole(user.role || 'employee');
      setBranchId(user.branch_id || '');
      setNewPassword('');
      setShowPassword(false);
      
      // Check if this user is already the manager of their branch
      const currentBranch = (branches as any[]).find(b => Number(b.id) === Number(user.branch_id));
      setIsBranchManager(currentBranch?.manager_id === user.id);
    }
  }, [user, branches]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/users/${user.id}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify({ 
          role, 
          branch_id: branchId || null,
          is_branch_manager: isBranchManager 
        }),
      }).then(async (res) => {
        if (!res.ok) {
          const error = await res.json().catch(() => ({ error: 'Failed to update user' }));
          throw new Error(error.error || 'Failed to update user');
        }
      });

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
            Update this user's role, branch, and optionally set a new password.
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
            <label className="block text-sm font-medium mb-1.5">Select Branch</label>
            <select className="w-full px-3 py-2 rounded-lg border border-border bg-background" value={branchId} onChange={e => setBranchId(e.target.value)}>
              <option value="">All Branches (Global Access)</option>
              {branches.map((branch: any) => (
                <option key={branch.id} value={branch.id}>{branch.name} ({branch.code})</option>
              ))}
            </select>
          </div>
          {branchId && (
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
