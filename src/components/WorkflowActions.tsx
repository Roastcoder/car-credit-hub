import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { WorkflowService } from '@/lib/workflow';
import type { LoanStatus } from '@/lib/types';
import { loansAPI } from '@/lib/api';
import { toast } from 'sonner';
import { CheckCircle, XCircle, ArrowLeft, MessageSquare, Send } from 'lucide-react';

interface WorkflowActionsProps {
  loanId: string;
  currentStatus: LoanStatus;
  onSuccess?: () => void;
}

export function WorkflowActions({ loanId, currentStatus, onSuccess }: WorkflowActionsProps) {
  const { user } = useAuth();
  const [showRemarksModal, setShowRemarksModal] = useState<string | null>(null);
  const [remarks, setRemarks] = useState('');

  const workflowMutation = useMutation({
    mutationFn: async ({ action, remarks }: { action: string; remarks?: string }) => {
      if (!user) throw new Error('User not authenticated');
      
      // Use the new workflow API endpoint
      const response = await loansAPI.performWorkflowAction(loanId, action, remarks);
      return response;
    },
    onSuccess: (result) => {
      const actionLabels: Record<string, string> = {
        'send_forward': 'forwarded',
        'send_back': 'sent back',
        'send_to_manager': 'sent to manager',
        'send_to_admin': 'sent to admin',
        'send_to_super_admin': 'sent to super admin',
        'approve': 'approved',
        'disburse': 'disbursed',
        'send_back_employee': 'sent back to employee',
        'send_back_manager': 'sent back to manager',
        'send_back_admin': 'sent back to admin',
        'reject': 'rejected'
      };
      
      toast.success(`Loan ${actionLabels[result.action] || 'updated'} successfully`);
      onSuccess?.();
      setShowRemarksModal(null);
      setRemarks('');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to perform action');
    }
  });

  if (!user) return null;

  const availableActions = WorkflowService.getAvailableActions(user.role).filter(actionConfig => 
    WorkflowService.canPerformAction(user.role, currentStatus, actionConfig.action)
  );
  
  if (availableActions.length === 0) return null;

  const handleAction = (action: string) => {
    const actionConfig = availableActions.find(a => a.action === action);
    if (actionConfig?.requiresRemarks) {
      setShowRemarksModal(action);
    } else {
      workflowMutation.mutate({ action });
    }
  };

  const handleRemarksSubmit = () => {
    if (showRemarksModal) {
      workflowMutation.mutate({ 
        action: showRemarksModal, 
        remarks: remarks.trim() || undefined 
      });
    }
  };

  return (
    <>
      <div className="flex items-center gap-2">
        {availableActions.map((actionConfig) => {
          const isApprove = actionConfig.type === 'forward' || actionConfig.type === 'approve';
          const isSendBack = actionConfig.type === 'back';
          
          return (
            <button
              key={actionConfig.action}
              onClick={() => handleAction(actionConfig.action)}
              disabled={workflowMutation.isPending}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 ${
                isApprove
                  ? 'bg-green-500/10 text-green-500 border border-green-500/50 hover:bg-green-500/20'
                  : isSendBack
                  ? 'bg-orange-500/10 text-orange-500 border border-orange-500/50 hover:bg-orange-500/20'
                  : 'bg-blue-500/10 text-blue-500 border border-blue-500/50 hover:bg-blue-500/20'
              }`}
            >
              {isApprove ? (
                <CheckCircle size={14} />
              ) : isSendBack ? (
                <ArrowLeft size={14} />
              ) : (
                <Send size={14} />
              )}
              {actionConfig.label}
            </button>
          );
        })}
      </div>

      {/* Remarks Modal */}
      {showRemarksModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-card border border-border rounded-xl shadow-2xl max-w-md w-full p-6 animate-in zoom-in-95 duration-200">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-orange-500/10 flex items-center justify-center">
                <MessageSquare size={24} className="text-orange-500" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Send Back Application
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Please provide remarks for sending back this application:
                </p>
                <textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Enter remarks (optional)..."
                  className="w-full p-3 rounded-lg border border-border bg-card text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent resize-none"
                  rows={4}
                />
              </div>
            </div>

            <div className="flex items-center gap-3 mt-6">
              <button
                onClick={() => {
                  setShowRemarksModal(null);
                  setRemarks('');
                }}
                disabled={workflowMutation.isPending}
                className="flex-1 px-4 py-2.5 rounded-lg border border-border bg-card text-sm font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleRemarksSubmit}
                disabled={workflowMutation.isPending}
                className="flex-1 px-4 py-2.5 rounded-lg bg-orange-500 text-sm font-medium text-white hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {workflowMutation.isPending ? 'Sending...' : 'Send Back'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}