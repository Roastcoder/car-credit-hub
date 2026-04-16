import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import { usersAPI } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

interface BrokerFormModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  broker?: any;
}

export function BrokerFormModal({ open, onClose, onSuccess, broker }: BrokerFormModalProps) {
  const [form, setForm] = useState({
    name: broker?.name || '',
    email: broker?.email || '',
    phone: broker?.phone || '',
    area: broker?.area || '',
    dsa_code: broker?.dsa_code || '',
    commission_rate: broker?.commission_rate || '1.5',
    is_active: broker?.is_active ?? true,
    assigned_user_id: broker?.assigned_user_id || '',
    secondary_user_id: broker?.secondary_user_id || '',
    referred_by: broker?.referred_by || '',
  });
  const [loading, setLoading] = useState(false);
  const { user: currentUser } = useAuth();
  const isAdmin = currentUser?.role === 'super_admin' || currentUser?.role === 'admin';

  const { data: users = [] } = useQuery({
    queryKey: ['users-for-assignment'],
    queryFn: () => usersAPI.getAll(),
    enabled: isAdmin,
  });

  useEffect(() => {
    if (open) {
      setForm({
        name: broker?.name || '',
        email: broker?.email || '',
        phone: broker?.phone || '',
        area: broker?.area || '',
        dsa_code: broker?.dsa_code || '',
        commission_rate: broker?.commission_rate || '1.5',
        is_active: broker?.is_active ?? true,
        assigned_user_id: broker?.assigned_user_id || '',
        secondary_user_id: broker?.secondary_user_id || '',
        referred_by: broker?.referred_by || '',
      });
    }
  }, [open, broker]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = {
        ...form,
        role: 'broker',
        assigned_user_id: form.assigned_user_id || null,
        secondary_user_id: form.secondary_user_id || null,
        referred_by: form.referred_by || null,
        status: form.is_active ? 'active' : 'inactive'
      };

      if (broker) {
        // Update existing broker using updateRole endpoint
        await usersAPI.updateRole(broker.id, data);
        toast.success('Broker updated successfully!');
      } else {
        // Create new broker as a user with a default password
        await usersAPI.create({
          ...data,
          password: 'Mehar@123' // Initial password for new brokers
        });
        toast.success('Broker added successfully!');
      }
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save broker');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{broker ? 'Edit Broker' : 'Add Broker'}</DialogTitle>
          <DialogDescription>
            {broker ? 'Update the broker information below.' : 'Enter the details for the new broker.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Broker Name *</label>
            <input required className="w-full px-3 py-2 rounded-lg border border-border bg-background" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Email *</label>
            <input required type="email" className="w-full px-3 py-2 rounded-lg border border-border bg-background" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Phone</label>
            <input className="w-full px-3 py-2 rounded-lg border border-border bg-background" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Area</label>
            <input className="w-full px-3 py-2 rounded-lg border border-border bg-background" value={form.area} onChange={e => setForm({...form, area: e.target.value})} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">DSA Code</label>
            <input className="w-full px-3 py-2 rounded-lg border border-border bg-background" value={form.dsa_code} onChange={e => setForm({...form, dsa_code: e.target.value})} placeholder="e.g. DSA001" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Commission Rate (%) *</label>
            <input required type="number" step="0.1" className="w-full px-3 py-2 rounded-lg border border-border bg-background" value={form.commission_rate} onChange={e => setForm({...form, commission_rate: e.target.value})} />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="broker_active" checked={form.is_active} onChange={e => setForm({...form, is_active: e.target.checked})} />
            <label htmlFor="broker_active" className="text-sm font-medium">Active</label>
          </div>

          {isAdmin && (
            <div className="grid grid-cols-1 gap-4 pt-2 border-t border-border/50">
              <div>
                <label className="block text-sm font-medium mb-1.5">Primary Assignment</label>
                <select 
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background" 
                  value={form.assigned_user_id} 
                  onChange={e => setForm({...form, assigned_user_id: e.target.value})}
                >
                  <option value="">No Assignment</option>
                  {users
                    .filter((u: any) => ['super_admin', 'admin', 'manager', 'employee', 'rbm'].includes(u.role))
                    .map((u: any) => (
                      <option key={u.id} value={u.id}>{u.full_name} ({u.role})</option>
                    ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Secondary Assignment (Optional)</label>
                <select 
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background" 
                  value={form.secondary_user_id} 
                  onChange={e => setForm({...form, secondary_user_id: e.target.value})}
                >
                  <option value="">No Secondary Assignment</option>
                  {users
                    .filter((u: any) => ['super_admin', 'admin', 'manager', 'employee', 'rbm'].includes(u.role))
                    .map((u: any) => (
                      <option key={u.id} value={u.id}>{u.full_name} ({u.role})</option>
                    ))}
                </select>
                <p className="mt-1 text-[10px] text-muted-foreground">Up to two users can be assigned to one broker.</p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Referred By (Recruiter)</label>
                <select 
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background" 
                  value={form.referred_by} 
                  onChange={e => setForm({...form, referred_by: e.target.value})}
                >
                  <option value="">No Referrer</option>
                  {users
                    .filter((u: any) => ['super_admin', 'admin', 'manager', 'employee', 'rbm'].includes(u.role))
                    .map((u: any) => (
                      <option key={u.id} value={u.id}>{u.full_name} ({u.role})</option>
                    ))}
                </select>
                <p className="mt-1 text-[10px] text-muted-foreground">The person who referred/recruited this broker.</p>
              </div>
            </div>
          )}
          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border border-border text-sm font-medium">Cancel</button>
            <button type="submit" disabled={loading} className="px-4 py-2 rounded-lg bg-accent text-accent-foreground text-sm font-semibold disabled:opacity-60">{loading ? 'Saving...' : 'Save'}</button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
