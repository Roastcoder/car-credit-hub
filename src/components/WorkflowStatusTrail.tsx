import { Check, Clock, User, Users, Shield, CreditCard } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WorkflowStep {
  status: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  role: string;
}

const WORKFLOW_STEPS: WorkflowStep[] = [
  {
    status: 'submitted',
    label: 'Submitted',
    description: 'Application created by employee',
    icon: <User size={16} />,
    role: 'Employee'
  },
  {
    status: 'under_review',
    label: 'Under Review',
    description: 'Being reviewed by manager',
    icon: <Clock size={16} />,
    role: 'Manager'
  },
  {
    status: 'approved',
    label: 'Approved',
    description: 'Approved by admin',
    icon: <Shield size={16} />,
    role: 'Admin'
  },
  {
    status: 'disbursed',
    label: 'Disbursed',
    description: 'Final disbursement',
    icon: <CreditCard size={16} />,
    role: 'Super Admin'
  }
];

interface WorkflowStatusTrailProps {
  currentStatus: string;
  className?: string;
}

export function WorkflowStatusTrail({ currentStatus, className }: WorkflowStatusTrailProps) {
  const currentStepIndex = WORKFLOW_STEPS.findIndex(step => step.status === currentStatus);

  const getStepState = (stepIndex: number) => {
    if (stepIndex < currentStepIndex) return 'completed';
    if (stepIndex === currentStepIndex) return 'current';
    return 'pending';
  };

  return (
    <div className={cn("w-full", className)}>
      <div className="flex items-center justify-between relative">
        {/* Progress Line */}
        <div className="absolute top-6 left-0 right-0 h-0.5 bg-gray-200 dark:bg-gray-700 -z-10">
          <div 
            className="h-full bg-blue-500 transition-all duration-500 ease-in-out"
            style={{ 
              width: currentStepIndex >= 0 ? `${(currentStepIndex / (WORKFLOW_STEPS.length - 1)) * 100}%` : '0%' 
            }}
          />
        </div>

        {WORKFLOW_STEPS.map((step, index) => {
          const state = getStepState(index);
          
          return (
            <div key={step.status} className="flex flex-col items-center relative">
              {/* Step Circle */}
              <div className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-300",
                {
                  'bg-blue-500 border-blue-500 text-white': state === 'completed',
                  'bg-blue-100 border-blue-500 text-blue-600 ring-4 ring-blue-100': state === 'current',
                  'bg-gray-100 border-gray-300 text-gray-400': state === 'pending'
                }
              )}>
                {state === 'completed' ? (
                  <Check size={20} className="text-white" />
                ) : (
                  step.icon
                )}
              </div>

              {/* Step Content */}
              <div className="mt-3 text-center max-w-[120px]">
                <div className={cn(
                  "text-sm font-semibold mb-1",
                  {
                    'text-blue-600': state === 'completed' || state === 'current',
                    'text-gray-500': state === 'pending'
                  }
                )}>
                  {step.label}
                </div>
                <div className={cn(
                  "text-xs leading-tight",
                  {
                    'text-blue-500': state === 'completed' || state === 'current',
                    'text-gray-400': state === 'pending'
                  }
                )}>
                  {step.description}
                </div>
                <div className={cn(
                  "text-xs font-medium mt-1 px-2 py-0.5 rounded-full inline-block",
                  {
                    'bg-blue-100 text-blue-700': state === 'completed' || state === 'current',
                    'bg-gray-100 text-gray-500': state === 'pending'
                  }
                )}>
                  {step.role}
                </div>
              </div>

              {/* Current Step Indicator */}
              {state === 'current' && (
                <div className="absolute -top-2 -right-2">
                  <div className="w-4 h-4 bg-orange-500 rounded-full animate-pulse" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}