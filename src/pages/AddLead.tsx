import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, UserPlus } from 'lucide-react';
import { toast } from 'sonner';

export default function AddLead() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [form, setForm] = useState({
    customer_name: '',
    address: '',
    tehsil: '',
    district: '',
    pin_code: '',
    phone_no: '',
    pan_number: '',
    aadhar_number: '',
    vehicle_no: '',
    loan_amount_required: '',
    irr_requested: '',
    sourcing_person_name: '',
    manager_name: '',
    our_branch: '',
    financier_name: '',
  });

  const { data: branches = [] } = useQuery({
    queryKey: ['branches'],
    queryFn: async () => {
      const { data } = await supabase.from('branches').select('*').eq('is_active', true).order('name');
      return data ?? [];
    },
  });

  const createLead = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase.from('leads').insert([{
        ...data,
        created_by: user?.id,
        branch_id: user?.branch_id,
      }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast.success('Lead created successfully!');
      navigate('/leads-list');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to create lead');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createLead.mutate(form);
  };

  const inputClass = "w-full px-4 py-2.5 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:border-accent transition-colors";
  const labelClass = "block text-sm font-medium text-foreground mb-1.5";

  return (
    <div>
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
        <ArrowLeft size={16} /> Back
      </button>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <UserPlus size={24} /> Add Lead
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Capture customer details for quick loan application</p>
      </div>

      <form onSubmit={handleSubmit} className="stat-card max-w-4xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Customer Name *</label>
            <input required className={inputClass} value={form.customer_name} onChange={e => setForm({...form, customer_name: e.target.value})} placeholder="Enter Customer Name" />
          </div>

          <div>
            <label className={labelClass}>Phone No *</label>
            <input required type="tel" maxLength={10} className={inputClass} value={form.phone_no} onChange={e => setForm({...form, phone_no: e.target.value})} placeholder="Enter Phone Number" />
          </div>

          <div className="md:col-span-2">
            <label className={labelClass}>Address</label>
            <input className={inputClass} value={form.address} onChange={e => setForm({...form, address: e.target.value})} placeholder="Enter Address" />
          </div>

          <div>
            <label className={labelClass}>Tehsil</label>
            <input className={inputClass} value={form.tehsil} onChange={e => setForm({...form, tehsil: e.target.value})} placeholder="Enter Tehsil" />
          </div>

          <div>
            <label className={labelClass}>District</label>
            <input className={inputClass} value={form.district} onChange={e => setForm({...form, district: e.target.value})} placeholder="Enter District" />
          </div>

          <div>
            <label className={labelClass}>Pin Code</label>
            <input className={inputClass} maxLength={6} value={form.pin_code} onChange={e => setForm({...form, pin_code: e.target.value})} placeholder="Enter Pin Code" />
          </div>

          <div>
            <label className={labelClass}>Pan Number</label>
            <input className={inputClass} maxLength={10} value={form.pan_number} onChange={e => setForm({...form, pan_number: e.target.value.toUpperCase()})} placeholder="Enter Pan Number" />
          </div>

          <div>
            <label className={labelClass}>Aadhar Number</label>
            <input className={inputClass} maxLength={12} value={form.aadhar_number} onChange={e => setForm({...form, aadhar_number: e.target.value})} placeholder="Enter Aadhar Number" />
          </div>

          <div>
            <label className={labelClass}>Vehicle No</label>
            <input className={inputClass} value={form.vehicle_no} onChange={e => setForm({...form, vehicle_no: e.target.value.toUpperCase()})} placeholder="Enter Vehicle Number" />
          </div>

          <div>
            <label className={labelClass}>Loan Amount Required</label>
            <input type="number" className={inputClass} value={form.loan_amount_required} onChange={e => setForm({...form, loan_amount_required: e.target.value})} placeholder="Loan Amount" />
          </div>

          <div>
            <label className={labelClass}>IRR Requested (%)</label>
            <input type="number" step="0.01" className={inputClass} value={form.irr_requested} onChange={e => setForm({...form, irr_requested: e.target.value})} placeholder="IRR Requested" />
          </div>

          <div>
            <label className={labelClass}>Sourcing Person Name</label>
            <input className={inputClass} value={form.sourcing_person_name} onChange={e => setForm({...form, sourcing_person_name: e.target.value})} placeholder="Sourcing Name" />
          </div>

          <div>
            <label className={labelClass}>Manager Name</label>
            <input className={inputClass} value={form.manager_name} onChange={e => setForm({...form, manager_name: e.target.value})} placeholder="Select Manager Name" />
          </div>

          <div>
            <label className={labelClass}>Our Branch</label>
            <select className={inputClass} value={form.our_branch} onChange={e => setForm({...form, our_branch: e.target.value})}>
              <option value="">Select Our Branch</option>
              {branches.map((branch: any) => (
                <option key={branch.id} value={branch.name}>{branch.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelClass}>Financier Name</label>
            <input className={inputClass} value={form.financier_name} onChange={e => setForm({...form, financier_name: e.target.value})} placeholder="Financier Name" />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button type="submit" disabled={createLead.isPending} className="px-6 py-2.5 rounded-lg bg-accent text-accent-foreground font-semibold hover:opacity-90 transition-opacity disabled:opacity-60">
            {createLead.isPending ? 'Creating...' : 'Create Lead'}
          </button>
          <button type="button" onClick={() => navigate(-1)} className="px-6 py-2.5 rounded-lg border border-border hover:bg-muted transition-colors">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
