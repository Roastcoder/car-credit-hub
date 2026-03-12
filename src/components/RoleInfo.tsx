import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { getRolePermissions } from '@/lib/permissions';
import { Users, Shield, Eye, Edit, Trash2, Plus, ArrowRight, ArrowLeft, MessageSquare } from 'lucide-react';

interface RoleInfoProps {
  className?: string;
}

export default function RoleInfo({ className = '' }: RoleInfoProps) {
  const { user } = useAuth();
  const [showDetails, setShowDetails] = useState(false);
  
  if (!user) return null;
  
  const permissions = getRolePermissions(user.role);
  
  const roleColors = {
    super_admin: 'bg-purple-100 text-purple-800 border-purple-200',
    admin: 'bg-red-100 text-red-800 border-red-200',
    manager: 'bg-blue-100 text-blue-800 border-blue-200',
    employee: 'bg-green-100 text-green-800 border-green-200',
    bank: 'bg-orange-100 text-orange-800 border-orange-200',
    broker: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  };

  const roleIcons = {
    super_admin: Shield,
    admin: Shield,
    manager: Users,
    employee: Users,
    bank: Users,
    broker: Users,
  };

  const RoleIcon = roleIcons[user.role as keyof typeof roleIcons] || Users;

  return (
    <div className={`bg-card rounded-lg border border-border p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${roleColors[user.role as keyof typeof roleColors] || 'bg-gray-100 text-gray-800'}`}>
            <RoleIcon size={20} />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">{user.name}</h3>
            <p className="text-sm text-muted-foreground capitalize">{user.role.replace('_', ' ')}</p>
          </div>
        </div>
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-xs text-accent hover:text-accent/80 transition-colors"
        >
          {showDetails ? 'Hide' : 'Show'} Permissions
        </button>
      </div>

      {showDetails && (
        <div className="space-y-3 pt-3 border-t border-border">
          <div>
            <h4 className="text-sm font-medium text-foreground mb-2">Permissions</h4>
            <div className="grid grid-cols-2 gap-2">
              <div className={`flex items-center gap-2 text-xs p-2 rounded-lg ${permissions.canCreate ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-500'}`}>
                <Plus size={14} />
                <span>Create</span>
              </div>
              <div className={`flex items-center gap-2 text-xs p-2 rounded-lg ${permissions.canEdit ? 'bg-blue-50 text-blue-700' : 'bg-gray-50 text-gray-500'}`}>
                <Edit size={14} />
                <span>Edit</span>
              </div>
              <div className={`flex items-center gap-2 text-xs p-2 rounded-lg ${permissions.canView ? 'bg-indigo-50 text-indigo-700' : 'bg-gray-50 text-gray-500'}`}>
                <Eye size={14} />
                <span>View</span>
              </div>
              <div className={`flex items-center gap-2 text-xs p-2 rounded-lg ${permissions.canDelete ? 'bg-red-50 text-red-700' : 'bg-gray-50 text-gray-500'}`}>
                <Trash2 size={14} />
                <span>Delete</span>
              </div>
              <div className={`flex items-center gap-2 text-xs p-2 rounded-lg ${permissions.canChangeStatus ? 'bg-orange-50 text-orange-700' : 'bg-gray-50 text-gray-500'}`}>
                <ArrowRight size={14} />
                <span>Forward</span>
              </div>
              <div className={`flex items-center gap-2 text-xs p-2 rounded-lg ${permissions.canAddRemarks ? 'bg-purple-50 text-purple-700' : 'bg-gray-50 text-gray-500'}`}>
                <MessageSquare size={14} />
                <span>Remarks</span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium text-foreground mb-2">Workflow Access</h4>
            <div className="text-xs text-muted-foreground space-y-1">
              {permissions.canViewAll && (
                <p>• Can view all records across branches</p>
              )}
              {!permissions.canViewAll && user.role === 'manager' && (
                <p>• Can view branch-specific records only</p>
              )}
              {!permissions.canViewAll && user.role === 'employee' && (
                <p>• Can view own records only</p>
              )}
              {permissions.canChangeStatus && (
                <p>• Can forward files to next workflow stage</p>
              )}
              {permissions.canChangeStatus && (
                <p>• Can send files back to previous stage</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Workflow Steps Info Component
export function WorkflowStepsInfo({ className = '' }: { className?: string }) {
  const { user } = useAuth();
  
  const workflowSteps = [
    { 
      role: 'employee', 
      label: 'Employee', 
      description: 'Create and submit applications',
      color: 'bg-green-100 text-green-800',
      permissions: ['Create', 'Edit Own', 'Submit']
    },
    { 
      role: 'manager', 
      label: 'Manager', 
      description: 'Review and approve applications',
      color: 'bg-blue-100 text-blue-800',
      permissions: ['Review', 'Edit', 'Add Remarks', 'Forward/Send Back']
    },
    { 
      role: 'admin', 
      label: 'Admin', 
      description: 'Final approval and processing',
      color: 'bg-red-100 text-red-800',
      permissions: ['All Permissions', 'Status Change', 'Delete']
    },
    { 
      role: 'super_admin', 
      label: 'Super Admin', 
      description: 'System oversight and disbursement',
      color: 'bg-purple-100 text-purple-800',
      permissions: ['Full System Access', 'User Management']
    },
  ];

  return (
    <div className={`bg-card rounded-lg border border-border p-4 ${className}`}>
      <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
        <ArrowRight size={18} />
        Workflow Steps
      </h3>
      
      <div className="space-y-3">
        {workflowSteps.map((step, index) => (
          <div 
            key={step.role}
            className={`p-3 rounded-lg border transition-all ${
              user?.role === step.role 
                ? 'border-accent bg-accent/5 ring-2 ring-accent/20' 
                : 'border-border bg-muted/30'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${step.color}`}>
                  {index + 1}
                </span>
                <span className="font-medium text-foreground">{step.label}</span>
                {user?.role === step.role && (
                  <span className="text-xs bg-accent text-accent-foreground px-2 py-0.5 rounded-full">
                    Your Role
                  </span>
                )}
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-2">{step.description}</p>
            <div className="flex flex-wrap gap-1">
              {step.permissions.map((permission) => (
                <span 
                  key={permission}
                  className="text-xs bg-background border border-border px-2 py-0.5 rounded text-muted-foreground"
                >
                  {permission}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}