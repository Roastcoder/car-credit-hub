import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Building2, UserCircle, Edit, Trash2, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';

export default function BranchManagement() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editingBranch, setEditingBranch] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    manager_id: '',
    status: 'active',
  });

  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';

  const { data: branches = [], isLoading: isLoadingBranches } = useQuery({
    queryKey: ['branches'],
    queryFn: async () => {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/branches`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` },
      });
      if (!res.ok) throw new Error('Failed to fetch branches');
      return res.json();
    },
  });

  // Fetch only users with manager role for the dropdown
  const { data: managers = [] } = useQuery({
    queryKey: ['users', 'manager'],
    queryFn: async () => {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/users?role=manager`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` },
      });
      if (!res.ok) throw new Error('Failed to fetch managers');
      return res.json();
    },
  });

  const saveBranch = useMutation({
    mutationFn: async (data: any) => {
      const method = editingBranch ? 'PUT' : 'POST';
      const url = editingBranch 
        ? `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/branches/${editingBranch.id}`
        : `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/branches`;
      
      const payload = {
        name: data.name,
        code: data.code,
        manager_id: data.manager_id ? Number(data.manager_id) : null,
        status: data.status,
      };

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to save branch');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches'] });
      toast.success(editingBranch ? 'Branch updated' : 'Branch created');
      setShowModal(false);
      resetForm();
    },
    onError: (error: any) => toast.error(error.message || 'Failed to save branch'),
  });

  const deleteBranch = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/branches/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` },
      });
      if (!res.ok) throw new Error('Failed to delete branch');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches'] });
      toast.success('Branch deleted');
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      manager_id: '',
      status: 'active',
    });
    setEditingBranch(null);
  };

  const handleEdit = (branch: any) => {
    setEditingBranch(branch);
    setFormData({
      name: branch.name,
      code: branch.code,
      manager_id: branch.manager_id || '',
      status: branch.status || 'active',
    });
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveBranch.mutate(formData);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Branch Management</h1>
          <p className="text-sm text-muted-foreground mt-1">{branches.length} branches</p>
          <p className="text-xs text-muted-foreground mt-1">
            Use this page to set the official manager for each branch. For user branch allocation or multiple branch access, use User Management.
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={() => { resetForm(); setShowModal(true); }}
            className="flex items-center gap-2 bg-accent text-accent-foreground font-semibold py-2.5 px-4 rounded-xl hover:opacity-90 transition-opacity text-sm"
          >
            <Plus size={16} /> Add Branch
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {branches.map((branch: any) => (
          <div key={branch.id} className="stat-card">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                  <Building2 size={20} className="text-accent" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground leading-none">{branch.name}</h3>
                  <p className="text-xs text-muted-foreground mt-1">Code: {branch.code}</p>
                </div>
              </div>
              <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded-full ${branch.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                {branch.status === 'active' ? 'Active' : 'Inactive'}
              </span>
            </div>

            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border/50">
                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                  <UserCircle size={18} />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tight">Official Manager</p>
                  <p className="text-sm font-semibold text-foreground">{branch.manager_name || 'No Manager Assigned'}</p>
                </div>
              </div>
            </div>

            {isAdmin && (
              <div className="flex gap-2 mt-5">
                <button
                  onClick={() => handleEdit(branch)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-accent/5 hover:bg-accent/10 text-accent text-sm font-semibold transition-colors"
                >
                  <Edit size={14} /> Update
                </button>
                <button
                  onClick={() => {
                    if (window.confirm('Are you sure you want to delete this branch?')) {
                      deleteBranch.mutate(branch.id);
                    }
                  }}
                  className="flex items-center justify-center py-2 px-3 rounded-lg bg-destructive/5 hover:bg-destructive/10 text-destructive transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            )}
          </div>
        ))}
        {branches.length === 0 && !isLoadingBranches && (
          <div className="col-span-full py-12 text-center bg-muted/30 rounded-2xl border-2 border-dashed border-border">
            <Building2 size={40} className="mx-auto text-muted-foreground mb-3 opacity-20" />
            <p className="text-muted-foreground font-medium">No branches configured yet.</p>
          </div>
        )}
      </div>

      <Dialog 
        open={showModal} 
        onOpenChange={(open) => !open && setShowModal(false)}
      >
        <DialogContent className="sm:max-w-md p-0 overflow-hidden border-none shadow-2xl rounded-2xl">
          <div className="p-8 space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center">
                <Building2 size={20} className="text-accent-foreground" />
              </div>
              <DialogHeader className="p-0 text-left">
                <DialogTitle className="text-xl font-bold text-foreground leading-none">
                  {editingBranch ? 'Update Branch' : 'Create New Branch'}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-1">
                  Set branch details and choose the official manager for this branch.
                </DialogDescription>
              </DialogHeader>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">Branch Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Jaipur HQ"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none transition-all text-sm font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">Branch Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. JPR-01"
                    value={formData.code}
                    onChange={e => setFormData({ ...formData, code: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none transition-all text-sm font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">Official Branch Manager</label>
                  <div className="relative">
                    <select
                      value={formData.manager_id}
                      onChange={e => setFormData({ ...formData, manager_id: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground appearance-none focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none transition-all text-sm font-medium"
                    >
                      <option value="">No Manager Assigned</option>
                      {managers.map((m: any) => (
                        <option key={m.id} value={m.id}>{m.full_name} ({m.email})</option>
                      ))}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
                      <UserCircle size={16} />
                    </div>
                  </div>
                  <p className="text-[10px] text-accent font-medium mt-2 flex items-center gap-1">
                    <MapPin size={10} /> This sets the official branch manager.
                  </p>
                </div>

                <div className="flex items-center gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, status: formData.status === 'active' ? 'inactive' : 'active' })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${formData.status === 'active' ? 'bg-accent' : 'bg-muted'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formData.status === 'active' ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                  <label className="text-xs font-bold text-foreground">Branch is {formData.status === 'active' ? 'Active' : 'Inactive'}</label>
                </div>
              </div>

              <DialogFooter className="flex-row items-center gap-3 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); resetForm(); }}
                  className="px-6 py-3 rounded-xl border border-border hover:bg-muted font-bold text-sm transition-colors flex-1"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saveBranch.isPending}
                  className="flex-[2] bg-accent text-accent-foreground font-bold py-3 px-4 rounded-xl hover:opacity-90 transition-all disabled:opacity-50 shadow-lg shadow-accent/20"
                >
                  {saveBranch.isPending ? 'Saving...' : editingBranch ? 'Update Details' : 'Create Branch'}
                </button>
              </DialogFooter>
            </form>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
