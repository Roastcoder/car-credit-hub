import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ROLE_LABELS } from '@/lib/auth';
import { useQuery } from '@tanstack/react-query';

interface RoleAssignModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  user: any;
}

export function RoleAssignModal({ open, onClose, onSuccess, user }: RoleAssignModalProps) {
  const [role, setRole] = useState(user?.role || 'employee');
  const [branchId, setBranchId] = useState(user?.branch_id || '');
  const [loading, setLoading] = useState(false);

  const { data: branches = [] } = useQuery({
    queryKey: ['branches'],
    queryFn: async () => {
      const { data } = await supabase.from('branches' as any).select('*').eq('is_active', true).order('name');
      return (data ?? []) as any[];
    },
  });

  useEffect(() => {
    if (user) {
      setRole(user.role || 'employee');
      setBranchId(user.branch_id || '');
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Update profile with branch_id
      await supabase.from('profiles').update({ branch_id: branchId || null } as any).eq('id', user.id);
      
      // Update or insert role
      const { data: existingRole } = await supabase.from('user_roles').select('*').eq('user_id', user.id).single();
      
      if (existingRole) {
        await supabase.from('user_roles').update({ role }).eq('user_id', user.id);
      } else {
        await supabase.from('user_roles').insert({ user_id: user.id, role });
      }
      
      toast.success('User updated successfully!');
      onSuccess();
      onClose();
    } catch (error) {
      toast.error('Failed to update user');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Assign Role & Branch to {user?.full_name || user?.email}</DialogTitle>
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
              <option value="">No Branch</option>
              {branches.map((branch: any) => (
                <option key={branch.id} value={branch.id}>{branch.name} ({branch.code})</option>
              ))}
            </select>
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
