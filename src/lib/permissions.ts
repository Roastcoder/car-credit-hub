import { UserRole } from '@/contexts/AuthContext';

export interface Permission {
  canCreate: boolean;
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
        canCreate: true,
        canEdit: true,
        canView: true,
        canDelete: true,
        canChangeStatus: true,
        canAddRemarks: true,
        canViewAll: true,
      };
    
    case 'admin':
      return {
        canCreate: true,
        canEdit: true,
        canView: true,
        canDelete: true,
        canChangeStatus: true,
        canAddRemarks: true,
        canViewAll: true,
      };
    
    case 'manager':
      return {
        canCreate: false, // Manager cannot create loans/leads
        canEdit: true,    // Can edit existing ones
        canView: true,
        canDelete: false,
        canChangeStatus: false, // Cannot change file status
        canAddRemarks: true,
        canViewAll: false, // Only branch-specific
      };
    
    case 'employee':
      return {
        canCreate: true,
        canEdit: true,
        canView: true,
        canDelete: false,
        canChangeStatus: false,
        canAddRemarks: false,
        canViewAll: false, // Only own records
      };
    
    case 'bank':
    case 'broker':
      return {
        canCreate: false,
        canEdit: false,
        canView: true,
        canDelete: false,
        canChangeStatus: false,
        canAddRemarks: false,
        canViewAll: false,
      };
    
    default:
      return {
        canCreate: false,
        canEdit: false,
        canView: false,
        canDelete: false,
        canChangeStatus: false,
        canAddRemarks: false,
        canViewAll: false,
      };
  }
};

export const canAccessLoan = (userRole: UserRole, userId: number, loan: any): boolean => {
  const permissions = getRolePermissions(userRole);
  
  if (permissions.canViewAll) return true;
  
  if (userRole === 'employee') {
    return loan.created_by === userId;
  }
  
  if (userRole === 'manager') {
    return loan.branch_id === userId; // Assuming manager's branch_id matches
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