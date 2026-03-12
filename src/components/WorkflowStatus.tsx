import { CheckCircle, Clock, XCircle, AlertCircle } from 'lucide-react';
import { WorkflowStatusTrail } from './WorkflowStatusTrail';
import { CompactWorkflowTrail } from './CompactWorkflowTrail';

interface WorkflowStatusProps {
  currentStatus: string;
  pddStatus?: string;
  createdBy?: number;
  submittedBy?: number;
  approvedBy?: number;
  className?: string;
  variant?: 'vertical' | 'horizontal' | 'compact';
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
          <h3 className="text-lg font-semibold text-foreground">Workflow Status</h3>
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

  // Original vertical layout
  const steps = [
    {
      id: 'submitted',
      label: 'Submitted',
      description: 'Application created by employee',
      completed: ['submitted', 'under_review', 'approved', 'disbursed'].includes(currentStatus),
      current: currentStatus === 'submitted',
      icon: createdBy ? CheckCircle : Clock,
    },
    {
      id: 'under_review',
      label: 'Under Review',
      description: 'Being reviewed by manager',
      completed: ['under_review', 'approved', 'disbursed'].includes(currentStatus),
      current: currentStatus === 'under_review',
      icon: submittedBy ? CheckCircle : Clock,
    },
    {
      id: 'approved',
      label: 'Approved',
      description: 'Approved by admin',
      completed: ['approved', 'disbursed'].includes(currentStatus),
      current: currentStatus === 'approved',
      icon: approvedBy ? CheckCircle : Clock,
    },
    {
      id: 'disbursed',
      label: 'Disbursed',
      description: 'Final disbursement',
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
        <h3 className="text-sm font-semibold text-foreground">Workflow Status</h3>
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
                    ? 'bg-green-500 border-green-500 text-white' 
                    : step.current
                    ? 'bg-blue-500 border-blue-500 text-white'
                    : step.id === 'rejected'
                    ? 'bg-red-500 border-red-500 text-white'
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
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
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
                  step.completed ? 'bg-green-500' : 'bg-border'
                }`} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}