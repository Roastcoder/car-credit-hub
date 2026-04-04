// Role labels (used across the app)
export type UserRole = 'super_admin' | 'admin' | 'manager' | 'bank' | 'broker' | 'employee' | 'accountant';

export const ROLE_LABELS: Record<UserRole, string> = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  manager: 'Manager',
  bank: 'Bank / NBFC',
  broker: 'Broker',
  employee: 'Employee',
  accountant: 'Accountant',
};

export interface UserPermissions {
  can_view_leads?: boolean;
  can_edit_leads?: boolean;
  can_view_loans?: boolean;
  can_edit_loans?: boolean;
  can_manage_pdd?: boolean;
  can_manage_payments?: boolean;
  can_view_reports?: boolean;
  can_manage_users?: boolean;
  [key: string]: boolean | undefined;
}

