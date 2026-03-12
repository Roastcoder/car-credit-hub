import { Check, Clock, User, Shield, CreditCard } from 'lucide-react';
import { cn } from '@/lib/utils';

const WORKFLOW_STEPS = [
  { status: 'submitted', label: 'Submitted', icon: <User size={14} /> },
  { status: 'under_review', label: 'Under Review', icon: <Clock size={14} /> },
  { status: 'approved', label: 'Approved', icon: <Shield size={14} /> },
  { status: 'disbursed', label: 'Disbursed', icon: <CreditCard size={14} /> }
];

interface CompactWorkflowTrailProps {
  currentStatus: string;
  className?: string;
}

export function CompactWorkflowTrail({ currentStatus, className }: CompactWorkflowTrailProps) {
  const currentStepIndex = WORKFLOW_STEPS.findIndex(step => step.status === currentStatus);

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {WORKFLOW_STEPS.map((step, index) => {
        const isCompleted = index < currentStepIndex;
        const isCurrent = index === currentStepIndex;
        const isPending = index > currentStepIndex;

        return (
          <div key={step.status} className="flex items-center">
            {/* Step Circle */}
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-all",
              {
                'bg-green-500 text-white': isCompleted,
                'bg-blue-500 text-white ring-2 ring-blue-200': isCurrent,
                'bg-gray-200 text-gray-500': isPending
              }
            )}>
              {isCompleted ? (
                <Check size={14} />
              ) : (
                step.icon
              )}
            </div>

            {/* Connector Line */}
            {index < WORKFLOW_STEPS.length - 1 && (
              <div className={cn(
                "w-8 h-0.5 mx-1 transition-all",
                {
                  'bg-green-500': index < currentStepIndex,
                  'bg-gray-300': index >= currentStepIndex
                }
              )} />
            )}
          </div>
        );
      })}
    </div>
  );
}