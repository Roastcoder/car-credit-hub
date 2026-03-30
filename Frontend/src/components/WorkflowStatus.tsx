import { CheckCircle, Clock, XCircle, AlertCircle } from 'lucide-react';
import { WorkflowStatusTrail } from './WorkflowStatusTrail';
import { CompactWorkflowTrail } from './CompactWorkflowTrail';
import { SingleLineWorkflowTrail } from './SingleLineWorkflowTrail';
import { MiniWorkflowTrail } from './MiniWorkflowTrail';

interface WorkflowStatusProps {
  currentStatus: string;
  pddStatus?: string;
  createdBy?: number;
  submittedBy?: number;
  approvedBy?: number;
  className?: string;
  variant?: 'vertical' | 'horizontal' | 'compact' | 'single-line' | 'mini';
}

export default function WorkflowStatus({ 
  currentStatus, 
  pddStatus = 'pending',
  createdBy,
  submittedBy,
  approvedBy,
  className = '',
  variant = 'vertical'
}: WorkflowStatusProps) {
  // Return horizontal trail variants
  if (variant === 'horizontal') {
    return (
      <div className={`bg-card rounded-lg border border-border p-6 ${className}`}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-foreground">Status</h3>
          {pddStatus && pddStatus !== 'pending' && (
            <span className={`text-xs px-2 py-1 rounded-full font-medium ${
              pddStatus === 'approved' ? 'bg-green-100 text-green-700' :
              pddStatus === 'rejected' ? 'bg-red-100 text-red-700' :
              'bg-yellow-100 text-yellow-700'
            }`}>
              PDD: {pddStatus.replace('_', ' ')}
            </span>
          )}
        </div>
        <WorkflowStatusTrail currentStatus={currentStatus} />
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={`flex items-center justify-between ${className}`}>
        <span className="text-sm font-medium text-foreground">Status:</span>
        <CompactWorkflowTrail currentStatus={currentStatus} />
      </div>
    );
  }

  if (variant === 'single-line') {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        <span className="text-sm font-medium text-foreground">Progress:</span>
        <SingleLineWorkflowTrail currentStatus={currentStatus} showLabels={true} />
      </div>
    );
  }

  if (variant === 'mini') {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <MiniWorkflowTrail currentStatus={currentStatus} />
        <span className="text-xs text-muted-foreground capitalize">
          {currentStatus.replace('_', ' ')}
        </span>
      </div>
    );
  }

  // Original vertical layout
  const steps = [
    {
      id: 'submitted',
      label: 'Submitted',
      description: 'Application created by employee',
      completed: ['submitted', 'manager_review', 'admin_approved', 'disbursed'].includes(currentStatus),
      current: currentStatus === 'submitted',
      icon: createdBy ? CheckCircle : Clock,
    },
    {
      id: 'manager_review',
      label: 'Admin Review',
      description: 'Admin is reviewing application',
      completed: ['admin_approved', 'disbursed'].includes(currentStatus),
      current: currentStatus === 'manager_review' || currentStatus === 'under_review',
      icon: submittedBy ? CheckCircle : Clock,
    },
    {
      id: 'admin_approved',
      label: 'Approved',
      description: 'Ready for disbursement',
      completed: ['disbursed'].includes(currentStatus),
      current: currentStatus === 'admin_approved' || currentStatus === 'approved' || currentStatus === 'manager_approved',
      icon: CheckCircle,
    },
    {
      id: 'disbursed',
      label: 'Disbursed',
      description: 'Final disbursement by Admin',
      completed: currentStatus === 'disbursed',
      current: currentStatus === 'disbursed',
      icon: currentStatus === 'disbursed' ? CheckCircle : Clock,
    },
  ];

  const rejectedStep = {
    id: 'rejected',
    label: 'Rejected',
    description: 'Application rejected',
    completed: false,
    current: currentStatus === 'rejected',
    icon: XCircle,
  };

  const displaySteps = currentStatus === 'rejected' ? [rejectedStep] : steps;

  return (
    <div className={`bg-card rounded-lg border border-border p-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-foreground">Status</h3>
        {pddStatus && pddStatus !== 'pending' && (
          <span className={`text-xs px-2 py-1 rounded-full font-medium ${
            pddStatus === 'approved' ? 'bg-green-100 text-green-700' :
            pddStatus === 'rejected' ? 'bg-red-100 text-red-700' :
            'bg-yellow-100 text-yellow-700'
          }`}>
            PDD: {pddStatus.replace('_', ' ')}
          </span>
        )}
      </div>
      
      <div className="space-y-3">
        {displaySteps.map((step, index) => {
          const Icon = step.icon;
          const isLast = index === displaySteps.length - 1;
          
          return (
            <div key={step.id} className="relative">
              <div className="flex items-start gap-3">
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                  step.completed 
                    ? 'bg-green-50 border-green-200 text-green-600' 
                    : step.current
                    ? 'bg-blue-50 border-blue-200 text-blue-600'
                    : step.id === 'rejected'
                    ? 'bg-red-50 border-red-200 text-red-600'
                    : 'bg-muted border-border text-muted-foreground'
                }`}>
                  <Icon size={16} />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={`text-sm font-medium ${
                      step.completed || step.current ? 'text-foreground' : 'text-muted-foreground'
                    }`}>
                      {step.label}
                    </p>
                    {step.current && (
                      <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-medium">
                        Current
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {step.description}
                  </p>
                </div>
              </div>
              
              {!isLast && step.id !== 'rejected' && (
                <div className={`absolute left-4 top-8 w-0.5 h-6 ${
                  step.completed ? 'bg-green-200' : 'bg-border'
                }`} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}