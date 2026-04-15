import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface PDDFormProps {
  loan: any;
  onCancel: () => void;
  onSuccess: () => void;
}

export default function PDDForm({ loan, onCancel, onSuccess }: PDDFormProps) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    payment_received_date: loan.payment_received_date?.split('T')[0] || '',
    financier_m_parivahan: loan.financier_m_parivahan || '',
    balance_payment_status: loan.balance_payment_status || '',
    pdd_update_finance_company: loan.pdd_update_finance_company || '',
    fc_deposited_by: loan.fc_deposited_by || '',
    fc_deposit_date: loan.fc_deposit_date?.split('T')[0] || '',
    fc_receipt: loan.fc_receipt || '',
    zero_statement: loan.zero_statement || '',
    current_fc_status: loan.current_fc_status || '',
    prev_financier_account_status: loan.prev_financier_account_status || '',
    noc_status: loan.noc_status || '',
    noc_checked_by: loan.noc_checked_by || '',
    previous_dto_noc: loan.previous_dto_noc || '',
    rto_paper_details: loan.rto_paper_details || '',
    pending_rto_documents: loan.pending_rto_documents || '',
    rto_docs_location: loan.rto_docs_location || '',
    rto_work_description: loan.rto_work_description || '',
    rto_work_status: loan.rto_work_status || '',
    dto_location: loan.dto_location || '',
    rto_agent_name: loan.rto_agent_name || '',
    rto_agent_mobile: loan.rto_agent_mobile || '',
    rto_mail: loan.rto_mail || '',
    pollution_status: loan.pollution_status || '',
    insurance_status: loan.insurance_status || '',
    vehicle_check_status: loan.vehicle_check_status || '',
    insurance_endorsement: loan.insurance_endorsement || '',
    challan_status: loan.challan_status || '',
    police_case_status: loan.police_case_status || '',
    commitment_date: loan.commitment_date?.split('T')[0] || '',
    delay_days: loan.delay_days || '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEmployee = user?.role === 'employee';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/loans/${loan.id}/pdd`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify(formData)
      });
      if (response.ok) {
        toast.success('PDD details updated successfully');
        onSuccess();
      } else {
        const error = await response.json().catch(() => ({}));
        toast.error(error.error || 'Failed to update PDD details');
      }
    } catch (error) {
      console.error('Failed to update PDD:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-muted/30 p-4 sm:p-6 rounded-2xl border border-accent/20 animate-in fade-in duration-300">
      <div className="flex items-center justify-between border-b border-border pb-4 mb-4">
        <h3 className="font-bold text-lg text-blue-900 dark:text-blue-100">
          {isEmployee ? 'Submit PDD Details' : 'Edit PDD Details'}
        </h3>
        <div className="flex gap-2">
            <button type="button" onClick={onCancel} className="px-4 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground bg-background border border-border rounded-lg transition-colors">
                Cancel
            </button>
            <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-accent text-accent-foreground rounded-lg text-xs font-bold hover:bg-accent/90 disabled:opacity-50 shadow-md">
                {isSubmitting ? 'Saving...' : (isEmployee ? 'Submit Details' : 'Save Changes')}
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {/* Payment & Finance */}
        <div className="space-y-4">
          <h4 className="text-[10px] font-black uppercase tracking-widest text-blue-500">Payment & Finance</h4>
          <div className="space-y-3">
            <div>
              <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1">Payment Received Date</label>
              <input type="date" value={formData.payment_received_date} onChange={(e) => setFormData({...formData, payment_received_date: e.target.value})} className="form-input-pdd" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1">Financier in M-Parivahan</label>
              <input type="text" value={formData.financier_m_parivahan} onChange={(e) => setFormData({...formData, financier_m_parivahan: e.target.value})} className="form-input-pdd" placeholder="Enter financier name" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1">Balance Status</label>
              <input type="text" value={formData.balance_payment_status} onChange={(e) => setFormData({...formData, balance_payment_status: e.target.value})} className="form-input-pdd" placeholder="Enter status" />
            </div>
          </div>
        </div>

        {/* FC Details */}
        <div className="space-y-4">
          <h4 className="text-[10px] font-black uppercase tracking-widest text-indigo-500">FC Details</h4>
          <div className="space-y-3">
            <div>
              <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1">FC Deposited By</label>
              <input type="text" value={formData.fc_deposited_by} onChange={(e) => setFormData({...formData, fc_deposited_by: e.target.value})} className="form-input-pdd" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1">FC Deposit Date</label>
              <input type="date" value={formData.fc_deposit_date} onChange={(e) => setFormData({...formData, fc_deposit_date: e.target.value})} className="form-input-pdd" />
            </div>
            <div>
                <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1">Current FC Status</label>
                <input type="text" value={formData.current_fc_status} onChange={(e) => setFormData({...formData, current_fc_status: e.target.value})} className="form-input-pdd" />
            </div>
          </div>
        </div>

        {/* RTO & Paper Details */}
        <div className="space-y-4">
          <h4 className="text-[10px] font-black uppercase tracking-widest text-emerald-500">RTO & Papers</h4>
          <div className="space-y-3">
            <div>
              <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1">RTO Paper Details</label>
              <input type="text" value={formData.rto_paper_details} onChange={(e) => setFormData({...formData, rto_paper_details: e.target.value})} className="form-input-pdd" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1">Work Description</label>
              <input type="text" value={formData.rto_work_description} onChange={(e) => setFormData({...formData, rto_work_description: e.target.value})} className="form-input-pdd" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1">RTO Agent Name</label>
              <input type="text" value={formData.rto_agent_name} onChange={(e) => setFormData({...formData, rto_agent_name: e.target.value})} className="form-input-pdd" />
            </div>
          </div>
        </div>

        {/* Vehicle Checks */}
        <div className="space-y-4">
          <h4 className="text-[10px] font-black uppercase tracking-widest text-amber-500">Vehicle Checks</h4>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1">Pollution</label>
              <input type="text" value={formData.pollution_status} onChange={(e) => setFormData({...formData, pollution_status: e.target.value})} className="form-input-pdd" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1">Insurance</label>
              <input type="text" value={formData.insurance_status} onChange={(e) => setFormData({...formData, insurance_status: e.target.value})} className="form-input-pdd" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1">Vehicle Check</label>
              <input type="text" value={formData.vehicle_check_status} onChange={(e) => setFormData({...formData, vehicle_check_status: e.target.value})} className="form-input-pdd" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1">Challan</label>
              <input type="text" value={formData.challan_status} onChange={(e) => setFormData({...formData, challan_status: e.target.value})} className="form-input-pdd" />
            </div>
          </div>
        </div>

        {/* NOC & Timeline */}
        <div className="space-y-4">
          <h4 className="text-[10px] font-black uppercase tracking-widest text-purple-500">NOC & Timeline</h4>
          <div className="space-y-3">
            <div>
              <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1">NOC Status</label>
              <input type="text" value={formData.noc_status} onChange={(e) => setFormData({...formData, noc_status: e.target.value})} className="form-input-pdd" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1">Commitment Date</label>
              <input type="date" value={formData.commitment_date} onChange={(e) => setFormData({...formData, commitment_date: e.target.value})} className="form-input-pdd" />
            </div>
          </div>
        </div>
      </div>

      <div className="pt-6 border-t border-border flex justify-end gap-3">
          <button type="button" onClick={onCancel} className="px-6 py-2.5 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors">
              Cancel
          </button>
          <button type="submit" disabled={isSubmitting} className="px-8 py-2.5 bg-accent text-accent-foreground rounded-xl text-sm font-black hover:bg-accent/90 disabled:opacity-50 shadow-lg shadow-accent/20 transition-all">
              {isSubmitting ? 'Saving Changes...' : (isEmployee ? 'Submit PDD for Approval' : 'Save Changes')}
          </button>
      </div>

      <style>{`
        .form-input-pdd {
            width: 100%;
            padding: 0.6rem 1rem;
            background: var(--background);
            border: 1px solid var(--border);
            border-radius: 0.75rem;
            font-size: 0.875rem;
            transition: all 0.2s;
            color: var(--foreground);
        }
        .form-input-pdd:focus {
            outline: none;
            border-color: var(--accent);
            box-shadow: 0 0 0 3px rgba(var(--accent-rgb), 0.1);
        }
      `}</style>
    </form>
  );
}
