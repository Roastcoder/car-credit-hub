import { X } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface PDDEditModalProps {
  loan: any;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function PDDEditModal({ loan, isOpen, onClose, onSuccess }: PDDEditModalProps) {
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
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/loans/${loan.id}/pdd`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify(formData)
      });
      if (response.ok) {
        onSuccess();
        onClose();
      }
    } catch (error) {
      console.error('Failed to update PDD:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div>
            <h2 className="text-lg font-semibold text-foreground">{isEmployee ? 'Edit and Submit PDD Details' : 'Edit PDD Details'}</h2>
            <p className="text-xs text-muted-foreground">{loan.loan_number} • {loan.applicant_name}</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4">
          <div className="space-y-6">
            {/* Payment & Finance */}
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-3">Payment & Finance Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Payment Received Date</label>
                  <input type="date" value={formData.payment_received_date} onChange={(e) => setFormData({...formData, payment_received_date: e.target.value})} className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Financier in M-Parivahan</label>
                  <input type="text" value={formData.financier_m_parivahan} onChange={(e) => setFormData({...formData, financier_m_parivahan: e.target.value})} className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Balance Payment Status</label>
                  <input type="text" value={formData.balance_payment_status} onChange={(e) => setFormData({...formData, balance_payment_status: e.target.value})} className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">PDD Update at Finance Co.</label>
                  <input type="text" value={formData.pdd_update_finance_company} onChange={(e) => setFormData({...formData, pdd_update_finance_company: e.target.value})} className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm" />
                </div>
              </div>
            </div>

            {/* FC Details */}
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-3">FC (Form C) Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">FC Deposited By</label>
                  <input type="text" value={formData.fc_deposited_by} onChange={(e) => setFormData({...formData, fc_deposited_by: e.target.value})} className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">FC Deposit Date</label>
                  <input type="date" value={formData.fc_deposit_date} onChange={(e) => setFormData({...formData, fc_deposit_date: e.target.value})} className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">FC Receipt</label>
                  <input type="text" value={formData.fc_receipt} onChange={(e) => setFormData({...formData, fc_receipt: e.target.value})} className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Zero Statement</label>
                  <input type="text" value={formData.zero_statement} onChange={(e) => setFormData({...formData, zero_statement: e.target.value})} className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Current Status of FC</label>
                  <input type="text" value={formData.current_fc_status} onChange={(e) => setFormData({...formData, current_fc_status: e.target.value})} className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Prev. Financier Account Status</label>
                  <input type="text" value={formData.prev_financier_account_status} onChange={(e) => setFormData({...formData, prev_financier_account_status: e.target.value})} className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm" />
                </div>
              </div>
            </div>

            {/* NOC Details */}
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-3">NOC Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">NOC Status</label>
                  <input type="text" value={formData.noc_status} onChange={(e) => setFormData({...formData, noc_status: e.target.value})} className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Who Checked NOC Status</label>
                  <input type="text" value={formData.noc_checked_by} onChange={(e) => setFormData({...formData, noc_checked_by: e.target.value})} className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Previous DTO NOC</label>
                  <input type="text" value={formData.previous_dto_noc} onChange={(e) => setFormData({...formData, previous_dto_noc: e.target.value})} className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm" />
                </div>
              </div>
            </div>

            {/* RTO Details */}
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-3">RTO Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">RTO Paper Details</label>
                  <input type="text" value={formData.rto_paper_details} onChange={(e) => setFormData({...formData, rto_paper_details: e.target.value})} className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Pending RTO Documents</label>
                  <input type="text" value={formData.pending_rto_documents} onChange={(e) => setFormData({...formData, pending_rto_documents: e.target.value})} className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Where Are RTO Docs</label>
                  <input type="text" value={formData.rto_docs_location} onChange={(e) => setFormData({...formData, rto_docs_location: e.target.value})} className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">RTO Work Description</label>
                  <input type="text" value={formData.rto_work_description} onChange={(e) => setFormData({...formData, rto_work_description: e.target.value})} className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">RTO Work Status</label>
                  <input type="text" value={formData.rto_work_status} onChange={(e) => setFormData({...formData, rto_work_status: e.target.value})} className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">DTO Location</label>
                  <input type="text" value={formData.dto_location} onChange={(e) => setFormData({...formData, dto_location: e.target.value})} className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">RTO Agent Name</label>
                  <input type="text" value={formData.rto_agent_name} onChange={(e) => setFormData({...formData, rto_agent_name: e.target.value})} className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">RTO Agent Mobile</label>
                  <input type="text" value={formData.rto_agent_mobile} onChange={(e) => setFormData({...formData, rto_agent_mobile: e.target.value})} className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">RTO Mail</label>
                  <input type="text" value={formData.rto_mail} onChange={(e) => setFormData({...formData, rto_mail: e.target.value})} className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm" />
                </div>
              </div>
            </div>

            {/* Vehicle Checks */}
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-3">Vehicle Checks</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Pollution</label>
                  <input type="text" value={formData.pollution_status} onChange={(e) => setFormData({...formData, pollution_status: e.target.value})} className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Insurance</label>
                  <input type="text" value={formData.insurance_status} onChange={(e) => setFormData({...formData, insurance_status: e.target.value})} className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Vehicle Check</label>
                  <input type="text" value={formData.vehicle_check_status} onChange={(e) => setFormData({...formData, vehicle_check_status: e.target.value})} className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Insurance Endorsement</label>
                  <input type="text" value={formData.insurance_endorsement} onChange={(e) => setFormData({...formData, insurance_endorsement: e.target.value})} className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Challan</label>
                  <input type="text" value={formData.challan_status} onChange={(e) => setFormData({...formData, challan_status: e.target.value})} className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Police Case</label>
                  <input type="text" value={formData.police_case_status} onChange={(e) => setFormData({...formData, police_case_status: e.target.value})} className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm" />
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-3">Timeline</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Commitment Date</label>
                  <input type="date" value={formData.commitment_date} onChange={(e) => setFormData({...formData, commitment_date: e.target.value})} className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Delay Days</label>
                  <input type="number" value={formData.delay_days} onChange={(e) => setFormData({...formData, delay_days: e.target.value})} className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm" />
                </div>
              </div>
            </div>
          </div>
        </form>

        <div className="flex items-center justify-end gap-3 p-4 border-t border-border">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground">
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={isSubmitting} className="px-4 py-2 bg-accent text-accent-foreground rounded-lg text-sm font-medium hover:bg-accent/90 disabled:opacity-50">
            {isSubmitting ? (isEmployee ? 'Submitting...' : 'Saving...') : (isEmployee ? 'Submit for Approval' : 'Save Changes')}
          </button>
        </div>
      </div>
    </div>
  );
}
