import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { getRolePermissions } from '@/lib/permissions';
import { ArrowLeft, UserPlus, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

export default function AddLead() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const permissions = getRolePermissions(user?.role || 'employee');

  // Check if user can create leads
  if (!permissions.canCreateLead) {
    return (
      <div>
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft size={16} /> Back
        </button>
        
        <div className="stat-card max-w-md mx-auto text-center">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle size={32} className="text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">Access Restricted</h2>
          <p className="text-muted-foreground mb-4">
            {user?.role === 'manager' 
              ? 'Managers can only view and edit existing leads, but cannot create new ones.'
              : 'You do not have permission to create leads.'}
          </p>
          <button
            onClick={() => navigate('/leads-list')}
            className="px-4 py-2 rounded-lg bg-accent text-accent-foreground font-semibold hover:opacity-90 transition-opacity"
          >
            View Existing Leads
          </button>
        </div>
      </div>
    );
  }

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
    mfg_year: '',
    rc_expiry_date: '',
    challan_status: 'No',
    rto_papers: 'No',
  });

  const [rcFront, setRcFront] = useState<File | null>(null);
  const [rcBack, setRcBack] = useState<File | null>(null);
  const [aadharFront, setAadharFront] = useState<File | null>(null);
  const [aadharBack, setAadharBack] = useState<File | null>(null);
  const [panCard, setPanCard] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const { data: branches = [] } = useQuery({
    queryKey: ['branches'],
    queryFn: async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/branches`);
        if (!response.ok) return [];
        return await response.json();
      } catch {
        return [];
      }
    },
  });

  const { data: banks = [] } = useQuery({
    queryKey: ['banks'],
    queryFn: async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/banks`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
            }
        });
        if (!response.ok) return [];
        return await response.json();
      } catch {
        return [];
      }
    },
  });

  const availableBranches = useMemo(() => {
    if (!user?.branch_id) return branches;
    return (branches as any[]).filter((branch: any) => Number(branch.id) === Number(user.branch_id));
  }, [branches, user?.branch_id]);

  useEffect(() => {
    if (availableBranches.length === 1 && !form.our_branch) {
      setForm((prev) => ({ ...prev, our_branch: availableBranches[0].name }));
    }
  }, [availableBranches, form.our_branch]);

  useEffect(() => {
    if (user?.name && !form.sourcing_person_name) {
      setForm(prev => ({ ...prev, sourcing_person_name: user.name }));
    }
  }, [user]);

  const { data: managers = [] } = useQuery({
    queryKey: ['managers-list'],
    queryFn: async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/users?role=manager`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
        });
        if (!response.ok) return [];
        return await response.json();
      } catch {
        return [];
      }
    },
  });

  // Set manager name automatically: Referred By or Branch Manager
  useEffect(() => {
    if (user?.referred_by_name) {
      setForm(prev => ({ ...prev, manager_name: user.referred_by_name }));
    } else if (user?.branch_id && branches.length > 0) {
      const userBranch = (branches as any[]).find(b => Number(b.id) === Number(user.branch_id));
      if (userBranch?.manager_name) {
        setForm(prev => ({ ...prev, manager_name: userBranch.manager_name }));
      } else if (managers.length > 0) {
        // Fallback: Use the first manager in the system if branch has no assigned manager
        setForm(prev => ({ ...prev, manager_name: managers[0].full_name || managers[0].name }));
      }
    }
  }, [user, branches, managers]);

  const createLeadMutation = useMutation({
    mutationFn: async (data: any) => {
      const formData = new FormData();
      
      // Append lead data
      Object.entries(data).forEach(([key, value]) => {
        formData.append(key, String(value));
      });

      // Append files
      if (rcFront) formData.append('rc_front', rcFront);
      if (rcBack) formData.append('rc_back', rcBack);
      if (aadharFront) formData.append('aadhar_front', aadharFront);
      if (aadharBack) formData.append('aadhar_back', aadharBack);
      if (panCard) formData.append('pan_card', panCard);

      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/leads`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: formData
      });
      
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to create lead');
      }
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast.success('Lead created successfully with documents!');
      navigate('/leads-list');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to create lead');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createLeadMutation.mutate(form);
  };

  const inputClass = "w-full px-4 py-2.5 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:border-accent transition-colors";
  const labelClass = "block text-sm font-medium text-foreground mb-1.5";
  const fileInputClass = "w-full text-xs text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-accent/10 file:text-accent hover:file:bg-accent/20 cursor-pointer";

  return (
    <div>
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
        <ArrowLeft size={16} /> Back
      </button>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <UserPlus size={24} /> Add Lead
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Capture customer details and upload mandatory documents</p>
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
            <input 
              className={inputClass} 
              value={form.sourcing_person_name} 
              onChange={e => setForm({...form, sourcing_person_name: e.target.value})} 
              placeholder="Sourcing Name"
              readOnly={user?.role === 'broker'}
            />
          </div>

          <div>
            <label className={labelClass}>Manager Name</label>
            <input 
              className={inputClass} 
              value={form.manager_name} 
              readOnly 
              placeholder="Manager Name" 
            />
          </div>

          <div>
            <label className={labelClass}>Our Branch</label>
            <select
              className={inputClass}
              value={form.our_branch}
              onChange={e => setForm({...form, our_branch: e.target.value})}
              disabled={availableBranches.length === 1}
            >
              <option value="">{availableBranches.length === 1 ? 'Assigned Branch' : 'Select Our Branch'}</option>
              {availableBranches.map((branch: any) => (
                <option key={branch.id} value={branch.name}>{branch.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelClass}>Financier Name</label>
            <input 
              list="financiers-list"
              className={inputClass} 
              value={form.financier_name} 
              onChange={e => setForm({...form, financier_name: e.target.value})} 
              placeholder="Type or Select Financier" 
            />
            <datalist id="financiers-list">
              {(banks as any[]).map((bank: any) => (
                <option key={bank.id} value={bank.name} />
              ))}
            </datalist>
          </div>
          
          {user?.role === 'broker' ? (
            <div className="md:col-span-2 mt-4">
              <h3 className="text-sm font-semibold text-foreground mb-4 border-b border-border pb-2">Documents Upload</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className={labelClass}>RC (Front) *</label>
                  <input type="file" required className={fileInputClass} onChange={e => setRcFront(e.target.files?.[0] || null)} accept="image/*,.pdf" />
                </div>
                <div>
                  <label className={labelClass}>RC (Back) *</label>
                  <input type="file" required className={fileInputClass} onChange={e => setRcBack(e.target.files?.[0] || null)} accept="image/*,.pdf" />
                </div>
                <div>
                  <label className={labelClass}>PAN Card *</label>
                  <input type="file" required className={fileInputClass} onChange={e => setPanCard(e.target.files?.[0] || null)} accept="image/*,.pdf" />
                </div>
                <div>
                  <label className={labelClass}>Aadhar (Front) *</label>
                  <input type="file" required className={fileInputClass} onChange={e => setAadharFront(e.target.files?.[0] || null)} accept="image/*,.pdf" />
                </div>
                <div>
                  <label className={labelClass}>Aadhar (Back) *</label>
                  <input type="file" required className={fileInputClass} onChange={e => setAadharBack(e.target.files?.[0] || null)} accept="image/*,.pdf" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Vehicle Reg./Mfg Year</label>
                    <input type="text" className={inputClass} value={form.mfg_year} onChange={e => setForm({...form, mfg_year: e.target.value})} placeholder="e.g. 2022" />
                  </div>
                  <div>
                    <label className={labelClass}>RC Expiry Date</label>
                    <input type="date" className={inputClass} value={form.rc_expiry_date} onChange={e => setForm({...form, rc_expiry_date: e.target.value})} />
                  </div>
                  <div className="col-span-2 grid grid-cols-2 gap-4 pt-2">
                    <label className="flex items-center gap-2 text-sm font-medium text-foreground cursor-pointer">
                      <input type="checkbox" className="rounded border-border" checked={form.challan_status === 'Yes'} onChange={e => setForm({...form, challan_status: e.target.checked ? 'Yes' : 'No'})} />
                      Challan
                    </label>
                    <label className="flex items-center gap-2 text-sm font-medium text-foreground cursor-pointer">
                      <input type="checkbox" className="rounded border-border" checked={form.rto_papers === 'Yes'} onChange={e => setForm({...form, rto_papers: e.target.checked ? 'Yes' : 'No'})} />
                      RTO Papers
                    </label>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        <div className="flex gap-3 mt-8 pt-6 border-t border-border">
          <button type="submit" disabled={createLeadMutation.isPending || isUploading} className="px-6 py-2.5 rounded-lg bg-accent text-accent-foreground font-semibold hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center gap-2">
            {(createLeadMutation.isPending || isUploading) ? (
                <>
                    <span className="w-4 h-4 border-2 border-accent-foreground/30 border-t-accent-foreground rounded-full animate-spin" />
                    {isUploading ? 'Uploading Documents...' : 'Creating...'}
                </>
            ) : 'Create Lead'}
          </button>
          <button type="button" onClick={() => navigate(-1)} className="px-6 py-2.5 rounded-lg border border-border hover:bg-muted transition-colors">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
