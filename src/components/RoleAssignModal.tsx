import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ROLE_LABELS } from '@/lib/auth';

interface RoleAssignModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  user: any;
}

export function RoleAssignModal({ open, onClose, onSuccess, user }: RoleAssignModalProps) {
  const [role, setRole] = useState(user?.role || 'employee');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await supabase.from('users').update({ role }).eq('id', user.id);
      toast.success('User role updated successfully!');
      onSuccess();
      onClose();
    } catch (error) {
      toast.error('Failed to update user role');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Assign Role to {user?.name}</DialogTitle>
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
          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border border-border text-sm font-medium">Cancel</button>
            <button type="submit" disabled={loading} className="px-4 py-2 rounded-lg bg-accent text-accent-foreground text-sm font-semibold disabled:opacity-60">{loading ? 'Saving...' : 'Assign Role'}</button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
