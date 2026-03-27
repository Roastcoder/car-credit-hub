import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface RemarksModalProps {
  open: boolean;
  onClose: () => void;
  loanId: string;
  currentRemarks?: string;
  onSuccess: () => void;
}

export function RemarksModal({ open, onClose, loanId, currentRemarks = '', onSuccess }: RemarksModalProps) {
  const { user } = useAuth();
  const [remarks, setRemarks] = useState(currentRemarks);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!remarks.trim()) {
      toast.error('Please enter remarks');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/loans/${loanId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify({
          remark: remarks,
          updated_by: user?.id,
        }),
      });

      if (!response.ok) throw new Error('Failed to update remarks');

      toast.success('Remarks updated successfully');
      onSuccess();
      onClose();
    } catch (error) {
      toast.error('Failed to update remarks');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Remarks</DialogTitle>
          <DialogDescription>
            Add comments or notes about this loan application.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Remarks</label>
            <textarea
              required
              rows={4}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Enter your remarks here..."
            />
          </div>
          
          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 rounded-lg bg-accent text-accent-foreground text-sm font-semibold disabled:opacity-60 hover:opacity-90 transition-opacity"
            >
              {loading ? 'Saving...' : 'Save Remarks'}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}