import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { getRolePermissions } from '@/lib/permissions';
import { toast } from 'sonner';
import { ArrowRight, ArrowLeft, Users, MessageSquare } from 'lucide-react';

interface WorkflowActionsProps {
  loanId: string;
  currentStatus: string;
  onSuccess: () => void;
}

const WORKFLOW_STEPS = [
  { status: 'submitted', label: 'Submitted', role: 'employee', nextRole: 'manager' },
  { status: 'under_review', label: 'Under Review', role: 'manager', nextRole: 'admin' },
  { status: 'approved', label: 'Approved', role: 'admin', nextRole: 'super_admin' },
  { status: 'disbursed', label: 'Disbursed', role: 'super_admin', nextRole: null },
];

export function WorkflowActions({ loanId, currentStatus, onSuccess }: WorkflowActionsProps) {
  const { user } = useAuth();
  const permissions = getRolePermissions(user?.role || 'employee');
  const [showForwardModal, setShowForwardModal] = useState(false);
  const [showSendBackModal, setShowSendBackModal] = useState(false);
  const [remarks, setRemarks] = useState('');
  const [loading, setLoading] = useState(false);

  const currentStep = WORKFLOW_STEPS.find(step => step.status === currentStatus);
  const currentStepIndex = WORKFLOW_STEPS.findIndex(step => step.status === currentStatus);
  
  const canForward = permissions.canChangeStatus && currentStepIndex < WORKFLOW_STEPS.length - 1;
  const canSendBack = permissions.canChangeStatus && currentStepIndex > 0;

  const handleForward = async () => {
    if (!currentStep || currentStepIndex >= WORKFLOW_STEPS.length - 1) return;
    
    const nextStep = WORKFLOW_STEPS[currentStepIndex + 1];
    setLoading(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/loans/${loanId}/workflow/forward`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify({
          from_status: currentStatus,
          to_status: nextStep.status,
          remarks: remarks.trim() || null,
          forwarded_by: user?.id,
          forwarded_to_role: nextStep.role,
        }),
      });

      if (!response.ok) throw new Error('Failed to forward file');

      toast.success(`File forwarded to ${nextStep.role}`);
      onSuccess();
      setShowForwardModal(false);
      setRemarks('');
    } catch (error) {
      toast.error('Failed to forward file');
    } finally {
      setLoading(false);
    }
  };

  const handleSendBack = async () => {
    if (currentStepIndex <= 0) return;
    
    const previousStep = WORKFLOW_STEPS[currentStepIndex - 1];
    setLoading(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/loans/${loanId}/workflow/sendback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify({
          from_status: currentStatus,
          to_status: previousStep.status,
          remarks: remarks.trim() || 'Sent back for review',
          sent_back_by: user?.id,
          sent_back_to_role: previousStep.role,
        }),
      });

      if (!response.ok) throw new Error('Failed to send back file');

      toast.success(`File sent back to ${previousStep.role}`);
      onSuccess();
      setShowSendBackModal(false);
      setRemarks('');
    } catch (error) {
      toast.error('Failed to send back file');
    } finally {
      setLoading(false);
    }
  };

  if (!permissions.canChangeStatus) return null;

  return (
    <>
      <div className="flex items-center gap-2">
        {canSendBack && (
          <button
            onClick={() => setShowSendBackModal(true)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-orange-500/50 bg-orange-500/10 text-orange-600 hover:bg-orange-500/20 transition-colors text-sm font-medium"
          >
            <ArrowLeft size={16} />
            Send Back
          </button>
        )}
        
        {canForward && (
          <button
            onClick={() => setShowForwardModal(true)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-500 text-white hover:bg-green-600 transition-colors text-sm font-medium"
          >
            <ArrowRight size={16} />
            Forward
          </button>
        )}
      </div>

      {/* Forward Modal */}
      <Dialog open={showForwardModal} onOpenChange={setShowForwardModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowRight size={20} className="text-green-500" />
              Forward File
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-green-50 border border-green-200">
              <div className="flex items-center gap-2 mb-2">
                <Users size={16} className="text-green-600" />
                <span className="text-sm font-medium text-green-800">Forwarding To</span>
              </div>
              <p className="text-sm text-green-700">
                {currentStepIndex < WORKFLOW_STEPS.length - 1 
                  ? `${WORKFLOW_STEPS[currentStepIndex + 1].role.toUpperCase()} - ${WORKFLOW_STEPS[currentStepIndex + 1].label}`
                  : 'Final Stage'
                }
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Remarks (Optional)</label>
              <textarea
                rows={3}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Add any comments for the next reviewer..."
              />
            </div>
            
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setShowForwardModal(false)}
                className="px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleForward}
                disabled={loading}
                className="px-4 py-2 rounded-lg bg-green-500 text-white text-sm font-semibold disabled:opacity-60 hover:bg-green-600 transition-colors"
              >
                {loading ? 'Forwarding...' : 'Forward File'}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Send Back Modal */}
      <Dialog open={showSendBackModal} onOpenChange={setShowSendBackModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowLeft size={20} className="text-orange-500" />
              Send Back File
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-orange-50 border border-orange-200">
              <div className="flex items-center gap-2 mb-2">
                <Users size={16} className="text-orange-600" />
                <span className="text-sm font-medium text-orange-800">Sending Back To</span>
              </div>
              <p className="text-sm text-orange-700">
                {currentStepIndex > 0 
                  ? `${WORKFLOW_STEPS[currentStepIndex - 1].role.toUpperCase()} - ${WORKFLOW_STEPS[currentStepIndex - 1].label}`
                  : 'Previous Stage'
                }
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Reason for Sending Back *</label>
              <textarea
                required
                rows={3}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Please provide reason for sending back..."
              />
            </div>
            
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setShowSendBackModal(false)}
                className="px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSendBack}
                disabled={loading || !remarks.trim()}
                className="px-4 py-2 rounded-lg bg-orange-500 text-white text-sm font-semibold disabled:opacity-60 hover:bg-orange-600 transition-colors"
              >
                {loading ? 'Sending Back...' : 'Send Back'}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}