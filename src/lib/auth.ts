// Role labels (used across the app)
export type UserRole = 'super_admin' | 'admin' | 'manager' | 'bank' | 'broker' | 'employee';

export const ROLE_LABELS: Record<UserRole, string> = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  manager: 'Manager',
  bank: 'Bank / NBFC',
  broker: 'Broker',
  employee: 'Employee',
};

