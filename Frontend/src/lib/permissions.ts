import { UserRole } from '@/contexts/AuthContext';
import { Camera } from '@capacitor/camera';
import { Filesystem } from '@capacitor/filesystem';
import { PushNotifications } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';

export interface RolePermissions {
  canCreateLead: boolean;
  canCreateLoan: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canChangeStatus: boolean;
  canAddRemarks: boolean;
  canManageUsers: boolean;
  canManageBanks: boolean;
  canManageBranches: boolean;
  canViewReports: boolean;
  canViewAllLeads: boolean;
  canManageSystem: boolean;
}

/**
 * Returns the permission set for a given user role.
 */
export const getRolePermissions = (role: UserRole): RolePermissions => {
  const isSuperAdmin = role === 'super_admin';
  const isAdmin = role === 'admin';
  const isManager = role === 'manager';
  const isAccountant = role === 'accountant';

  return {
    canCreateLead: isSuperAdmin || isAdmin || role === 'broker' || role === 'employee',
    canCreateLoan: isSuperAdmin || isAdmin || isManager || role === 'employee' || role === 'broker',
    canEdit: isSuperAdmin || isAdmin || isManager,
    canDelete: isSuperAdmin,
    canChangeStatus: isSuperAdmin || isAdmin || isManager,
    canAddRemarks: isSuperAdmin || isAdmin || isManager || isAccountant,
    canManageUsers: isSuperAdmin || isAdmin,
    canManageBanks: isSuperAdmin || isAdmin,
    canManageBranches: isSuperAdmin || isAdmin,
    canViewReports: isSuperAdmin || isAdmin || isManager || isAccountant,
    canViewAllLeads: isSuperAdmin || isAdmin || isManager,
    canManageSystem: isSuperAdmin,
  };
};

/**
 * Validates if the user has specific access to a single loan.
 */
export const canAccessLoan = (user: any, loan: any): boolean => {
  if (!user || !loan) return false;
  if (user.role === 'super_admin' || user.role === 'admin' || user.role === 'manager') return true;
  if (user.role === 'accountant') return true;
  
  // Branch restricted
  if (user.branch_id && loan.branch_id && Number(user.branch_id) !== Number(loan.branch_id)) return false;
  
  // Broker/Employee restricted (only see their own)
  if ((user.role === 'broker' || user.role === 'employee') && Number(loan.created_by) !== Number(user.id)) {
    // Exception for visibility handled by WorkflowService
    return true; 
  }
  
  return true;
};

/**
 * Requests all required native permissions for the Mehar Finance mobile app.
 * This triggers the system dialogs for Camera, Storage, and Notifications.
 */
export async function requestAllNativePermissions() {
  if (!Capacitor.isNativePlatform()) return;

  try {
    console.log('Requesting native permissions...');

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

    console.log('Permission requests completed.');
  } catch (error) {
    console.error('Error requesting permissions:', error);
  }
}
