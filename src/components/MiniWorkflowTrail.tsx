import { Check, Clock, User, Shield, CreditCard, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

const WORKFLOW_STEPS = [
  { status: 'submitted', icon: <User size={10} />, label: 'Sub' },
  { status: 'manager_review', icon: <Clock size={10} />, label: 'Rev' },
  { status: 'manager_approved', icon: <Users size={10} />, label: 'MAp' },
  { status: 'admin_approved', icon: <Shield size={10} />, label: 'AAp' },
  { status: 'disbursed', icon: <CreditCard size={10} />, label: 'Dis' }
];

interface MiniWorkflowTrailProps {
  currentStatus: string;
  className?: string;
}

export function MiniWorkflowTrail({ currentStatus, className }: MiniWorkflowTrailProps) {
  const currentStepIndex = WORKFLOW_STEPS.findIndex(step => step.status === currentStatus);

  return (
    <div className={cn("flex items-center gap-0.5", className)}>
      {WORKFLOW_STEPS.map((step, index) => {
        const isCompleted = index < currentStepIndex;
        const isCurrent = index === currentStepIndex;
        const isPending = index > currentStepIndex;

        return (
          <div
            key={step.status}
            className={cn(
              "w-5 h-5 rounded-full flex items-center justify-center text-xs transition-all",
              {
                'bg-green-500 text-white': isCompleted,
                'bg-blue-500 text-white ring-1 ring-blue-300': isCurrent,
                'bg-gray-200 text-gray-500': isPending
              }
            )}
            title={`${step.label} - ${step.status.replace('_', ' ')}`}
          >
            {isCompleted ? (
              <Check size={8} />
            ) : (
              step.icon
            )}
          </div>
        );
      })}
    </div>
  );
}