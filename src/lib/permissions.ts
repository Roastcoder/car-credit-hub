import { UserRole } from '@/contexts/AuthContext';

export interface Permission {
  canCreateLead: boolean;
  canCreateLoan: boolean;
  canEdit: boolean;
  canView: boolean;
  canDelete: boolean;
  canChangeStatus: boolean;
  canAddRemarks: boolean;
  canViewAll: boolean;
}

export const getRolePermissions = (role: UserRole): Permission => {
  switch (role) {
    case 'super_admin':
      return {
        canCreateLead: true,
        canCreateLoan: true,
        canEdit: true,
        canView: true,
        canDelete: true,
        canChangeStatus: true,
        canAddRemarks: true,
        canViewAll: true,
      };
    
    case 'admin':
      return {
        canCreateLead: true,
        canCreateLoan: true,
        canEdit: true,
        canView: true,
        canDelete: true,
        canChangeStatus: true,
        canAddRemarks: true,
        canViewAll: true,
      };
    
    case 'manager':
      return {
        canCreateLead: true,
        canCreateLoan: true,
        canEdit: true,
        canView: true,
        canDelete: false,
        canChangeStatus: true,
        canAddRemarks: true,
        canViewAll: true,
      };
    
    case 'employee':
      return {
        canCreateLead: true,
        canCreateLoan: true,
        canEdit: true,
        canView: true,
        canDelete: false,
        canChangeStatus: false,
        canAddRemarks: true,
        canViewAll: false,
      };
    
    case 'bank':
      return {
        canCreateLead: false,
        canCreateLoan: false,
        canEdit: false,
        canView: true,
        canDelete: false,
        canChangeStatus: false,
        canAddRemarks: true,
        canViewAll: false,
      };

    case 'broker':
      return {
        canCreateLead: true,
        canCreateLoan: false,
        canEdit: false,
        canView: true,
        canDelete: false,
        canChangeStatus: false,
        canAddRemarks: true,
        canViewAll: false,
      };
    
    default:
      return {
        canCreateLead: false,
        canCreateLoan: false,
        canEdit: false,
        canView: false,
        canDelete: false,
        canChangeStatus: false,
        canAddRemarks: false,
        canViewAll: false,
      };
  }
}
;

export const canAccessLoan = (userRole: UserRole, userId: number | string, loan: any): boolean => {
  const permissions = getRolePermissions(userRole);
  const uid = String(userId);
  
  if (permissions.canViewAll) return true;
  
  if (userRole === 'employee') {
    return String(loan.created_by) === uid;
  }
  
  if (userRole === 'broker') {
    return String(loan.broker_id) === uid || String(loan.assigned_broker_id) === uid;
  }
  
  if (userRole === 'manager') {
    return String(loan.branch_id) === String((loan as any).user_branch_id); // Fallback if canViewAll is false
  }
  
  return false;
};

export const getWorkflowSteps = (userRole: UserRole) => {
  const steps = [
    { id: 'employee', label: 'Employee', description: 'Create and submit application' },
    { id: 'manager', label: 'Manager', description: 'Review and approve' },
    { id: 'admin', label: 'Admin', description: 'Final processing' },
    { id: 'super_admin', label: 'Super Admin', description: 'System oversight' },
  ];
  
  return steps;
};