import { UserRole } from '@/contexts/AuthContext';
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
}

/**
 * Returns the permission set for a given user role.
 * Maps original 'canCreate' to modern 'canCreateLead' and 'canCreateLoan' for UI compatibility.
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
      };
    
    case 'manager':
      return {
        canCreate: false, // Managers cannot create loans/leads
        canCreateLead: false,
        canCreateLoan: false,
        canEdit: true,    // Can edit existing ones
        canView: true,
        canDelete: false,
        canChangeStatus: false, 
        canAddRemarks: true,
        canViewAll: false, 
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
        canCreateLead: true, // Brokers can create leads
        canCreateLoan: false, // Brokers cannot create loans directly
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
    return Number(loan.branch_id) === Number(userId); // Assuming manager's identity check matches
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
    { id: 'manager', label: 'Manager', description: 'Review and approve' },
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
