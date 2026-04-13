import { AppUser } from '@/contexts/AuthContext';
import { UserRole } from '@/lib/auth';
import { Camera } from '@capacitor/camera';
import { Filesystem } from '@capacitor/filesystem';
import { PushNotifications } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';

export interface Permission {
  canCreate: boolean;
  canCreateLead: boolean;
  canCreateLoan: boolean;
  canEdit: boolean;
  canView: boolean;
  canDelete: boolean;
  canChangeStatus: boolean;
  canAddRemarks: boolean;
  canViewAll: boolean;
  // Dynamic flags
  canManagePdd?: boolean;
  canManagePayments?: boolean;
  canViewReports?: boolean;
}

/**
 * Returns the permission set for a given user role.
 * This provides the base "blueprint" for each role.
 */
export const getRolePermissions = (role: UserRole | string | null | undefined): Permission => {
  const normalizedRole = (role || '').toLowerCase();

  switch (normalizedRole) {
    case 'super_admin':
      return {
        canCreate: true,
        canCreateLead: true,
        canCreateLoan: true,
        canEdit: true,
        canView: true,
        canDelete: true,
        canChangeStatus: true,
        canAddRemarks: true,
        canViewAll: true,
        canManagePdd: true,
        canManagePayments: true,
        canViewReports: true,
      };

    case 'admin':
      return {
        canCreate: true,
        canCreateLead: true,
        canCreateLoan: true,
        canEdit: true,
        canView: true,
        canDelete: true,
        canChangeStatus: true,
        canAddRemarks: true,
        canViewAll: true,
        canManagePdd: true,
        canManagePayments: true,
        canViewReports: true,
      };

    case 'manager':
      return {
        canCreate: false,
        canCreateLead: false,
        canCreateLoan: false,
        canEdit: true,
        canView: true,
        canDelete: false,
        canChangeStatus: false,
        canAddRemarks: true,
        canViewAll: false,
        canManagePdd: false,
        canManagePayments: false,
        canViewReports: true,
      };

    case 'rbm':
      return {
        canCreate: false,
        canCreateLead: false,
        canCreateLoan: false,
        canEdit: true,
        canView: true,
        canDelete: false,
        canChangeStatus: false,
        canAddRemarks: true,
        canViewAll: true,
        canManagePdd: false,
        canManagePayments: true,
        canViewReports: true,
      };

    case 'pdd_manager':
      return {
        canCreate: false,
        canCreateLead: false,
        canCreateLoan: false,
        canEdit: true,
        canView: true,
        canDelete: false,
        canChangeStatus: false,
        canAddRemarks: true,
        canViewAll: true,
        canManagePdd: true,
        canManagePayments: false,
        canViewReports: true,
      };

    case 'employee':
      return {
        canCreate: true,
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
    case 'broker':
      return {
        canCreate: false,
        canCreateLead: true,
        canCreateLoan: false,
        canEdit: true,
        canView: true,
        canDelete: false,
        canChangeStatus: false,
        canAddRemarks: true,
        canViewAll: false,
      };

    case 'sales':
      return {
        canCreate: true,
        canCreateLead: true,
        canCreateLoan: false,
        canEdit: true,
        canView: true,
        canDelete: false,
        canChangeStatus: false,
        canAddRemarks: true,
        canViewAll: false,
      };

    case 'accountant':
      return {
        canCreate: false,
        canCreateLead: false,
        canCreateLoan: false,
        canEdit: false,
        canView: true,
        canDelete: false,
        canChangeStatus: false,
        canAddRemarks: true,
        canViewAll: false,
        canManagePayments: true,
      };

    default:
      return {
        canCreate: false,
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
};

/**
 * Merges role-based permissions with individual user overrides.
 */
export const getUserPermissions = (user: AppUser | null | undefined): Permission => {
  if (!user) return getRolePermissions(null);

  const base = getRolePermissions(user.role);

  // If no granular permissions, return base
  if (!user.permissions) return base;

  const overrides = user.permissions;

  return {
    ...base,
    // Override base with granular settings if they exist
    ...(overrides.can_view_leads !== undefined && { canView: overrides.can_view_leads }),
    ...(overrides.can_create_lead !== undefined && { canCreateLead: overrides.can_create_lead }),
    ...(overrides.can_view_loans !== undefined && { canView: overrides.can_view_loans }),
    ...(overrides.can_edit_loans !== undefined && { canEdit: overrides.can_edit_loans }),
    ...(overrides.can_manage_pdd !== undefined && { canManagePdd: overrides.can_manage_pdd }),
    ...(overrides.can_manage_payments !== undefined && { canManagePayments: overrides.can_manage_payments }),
    ...(overrides.can_view_reports !== undefined && { canViewReports: overrides.can_view_reports }),
  };
};

/**
 * Validates if the user has specific access to a single loan.
 */
export const canAccessLoan = (userRole: string, userId: number | string, loan: any): boolean => {
  const normalizedRole = (userRole || '').toLowerCase();
  const permissions = getRolePermissions(normalizedRole);

  if (permissions.canViewAll) return true;

  if (normalizedRole === 'employee') {
    return Number(loan.created_by) === Number(userId);
  }

  if (normalizedRole === 'manager') {
    return Number(loan.branch_id) === Number(userId) || Number(loan.created_by_branch_id) === Number(userId);
  }

  if (normalizedRole === 'rbm' || normalizedRole === 'pdd_manager') {
    return true; // Regional roles can view all applicable loans
  }

  return false;
};

/**
 * Returns the steps for the loan workflow.
 */
export const getWorkflowSteps = (userRole: string) => {
  const normalizedRole = (userRole || '').toLowerCase();
  const steps = [
    { id: 'employee', label: 'Employee', description: 'Create and submit application' },
    { id: 'manager', label: 'Branch Manager', description: 'Review and add remarks' },
    { id: 'rbm', label: 'RBM', description: 'Regional approval and payments' },
    { id: 'pdd_manager', label: 'PDD Manager', description: 'PDD verification' },
    { id: 'admin', label: 'Admin', description: 'Final processing' },
    { id: 'super_admin', label: 'Super Admin', description: 'System oversight' },
  ];

  return steps;
};

/**
 * Requests all required native permissions for the Mehar Finance mobile app.
 * This triggers the system dialogs for Camera, Storage, and Notifications.
 */
export async function requestAllNativePermissions() {
  if (!Capacitor.isNativePlatform()) return;

  try {

    // 1. Notification Permissions (Crucial for Android 13+)
    const pushStatus = await PushNotifications.checkPermissions();
    if (pushStatus.receive !== 'granted') {
      await PushNotifications.requestPermissions();
    }

    // 2. Camera Permissions
    const cameraStatus = await Camera.checkPermissions();
    if (cameraStatus.camera !== 'granted') {
      await Camera.requestPermissions();
    }

    // 3. Filesystem / Storage (Standard checks)
    const fsStatus = await Filesystem.checkPermissions();
    if (fsStatus.publicStorage !== 'granted') {
      await Filesystem.requestPermissions();
    }

  } catch (error) {
    console.error('Error requesting permissions:', error);
  }
}
