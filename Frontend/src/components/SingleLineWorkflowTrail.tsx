import { Check, Clock, User, Shield, CreditCard, ArrowRight, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WorkflowStep {
  status: string;
  label: string;
  description: string;
  icon: React.ReactNode;
}

const WORKFLOW_STEPS: WorkflowStep[] = [
  {
    status: 'submitted',
    label: 'Submitted',
    description: 'Application created by employee',
    icon: <User size={14} />
  },
  {
    status: 'manager_review',
    label: 'Under Review',
    description: 'Being reviewed by manager',
    icon: <Clock size={14} />
  },
  {
    status: 'manager_approved',
    label: 'Manager Approved',
    description: 'Approved by manager',
    icon: <Users size={14} />
  },
  {
    status: 'admin_approved',
    label: 'Admin Approved',
    description: 'Approved by admin',
    icon: <Shield size={14} />
  },
  {
    status: 'disbursed',
    label: 'Disbursed',
    description: 'Final disbursement',
    icon: <CreditCard size={14} />
  }
];

interface SingleLineWorkflowTrailProps {
  currentStatus: string;
  className?: string;
  showLabels?: boolean;
  showDescriptions?: boolean;
}

export function SingleLineWorkflowTrail({ 
  currentStatus, 
  className,
  showLabels = true,
  showDescriptions = false
}: SingleLineWorkflowTrailProps) {
  const getStatusIndex = (status: string) => {
    switch (status) {
      case 'submitted': return 0;
      case 'under_review':
      case 'manager_review': return 1;
      case 'manager_approved': return 2;
      case 'approved':
      case 'admin_approved': return 3;
      case 'disbursed': return 4;
      default: return -1;
    }
  };

  const currentStepIndex = getStatusIndex(currentStatus);

  const getStepState = (stepIndex: number) => {
    if (stepIndex < currentStepIndex) return 'completed';
    if (stepIndex === currentStepIndex) return 'current';
    return 'pending';
  };

  return (
    <div className={cn("flex items-center flex-nowrap gap-1 min-w-max", className)}>
      {WORKFLOW_STEPS.map((step, index) => {
        const state = getStepState(index);
        const isLast = index === WORKFLOW_STEPS.length - 1;
        
        return (
          <div key={step.status} className={cn("flex items-center", !isLast && "flex-1")}>
            {/* Step */}
            <div className="flex items-center gap-2 min-w-fit">
              {/* Circle */}
              <div className={cn(
                "w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-medium transition-all",
                {
                  'bg-green-500 text-white': state === 'completed',
                  'bg-blue-500 text-white ring-2 ring-blue-200': state === 'current',
                  'bg-gray-200 text-gray-500': state === 'pending'
                }
              )}>
                {state === 'completed' ? (
                  <Check size={12} />
                ) : (
                  step.icon
                )}
              </div>

              {/* Label and Description */}
              {(showLabels || showDescriptions) && (
                <div className="flex flex-col min-w-0">
                  {showLabels && (
                    <span className={cn(
                      "text-[10px] font-bold uppercase tracking-tight whitespace-nowrap",
                      {
                        'text-green-600': state === 'completed',
                        'text-blue-600': state === 'current',
                        'text-gray-400': state === 'pending'
                      }
                    )}>
                      {step.label}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Arrow Connector */}
            {!isLast && (
              <div className="flex-1 mx-2 flex items-center justify-center">
                <ArrowRight 
                  size={12} 
                  className={cn(
                    "transition-colors",
                    {
                      'text-green-500': index < currentStepIndex,
                      'text-gray-200': index >= currentStepIndex
                    }
                  )}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}