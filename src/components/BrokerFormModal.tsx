import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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
    commission_rate: broker?.commission_rate || '1.5',
    is_active: broker?.is_active ?? true,
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (broker) {
        await supabase.from('brokers').update(form).eq('id', broker.id);
        toast.success('Broker updated successfully!');
      } else {
        await supabase.from('brokers').insert([form]);
        toast.success('Broker added successfully!');
      }
      onSuccess();
      onClose();
    } catch (error) {
      toast.error('Failed to save broker');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{broker ? 'Edit Broker' : 'Add Broker'}</DialogTitle>
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
            <label className="block text-sm font-medium mb-1.5">Commission Rate (%) *</label>
            <input required type="number" step="0.1" className="w-full px-3 py-2 rounded-lg border border-border bg-background" value={form.commission_rate} onChange={e => setForm({...form, commission_rate: e.target.value})} />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="broker_active" checked={form.is_active} onChange={e => setForm({...form, is_active: e.target.checked})} />
            <label htmlFor="broker_active" className="text-sm font-medium">Active</label>
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border border-border text-sm font-medium">Cancel</button>
            <button type="submit" disabled={loading} className="px-4 py-2 rounded-lg bg-accent text-accent-foreground text-sm font-semibold disabled:opacity-60">{loading ? 'Saving...' : 'Save'}</button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
