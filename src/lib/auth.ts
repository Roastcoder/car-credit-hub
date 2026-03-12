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

// Demo accounts for quick login (these exist in the real auth system)
export const DEMO_ACCOUNTS = [
  { name: 'Rajesh Kumar', email: 'superadmin@meharfinance.com', role: 'super_admin' as UserRole, password: 'Demo@1234' },
  { name: 'Priya Sharma', email: 'admin@meharfinance.com', role: 'admin' as UserRole, password: 'Demo@1234' },
  { name: 'Amit Patel', email: 'manager@meharfinance.com', role: 'manager' as UserRole, password: 'Demo@1234' },
  { name: 'HDFC Bank', email: 'bank@meharfinance.com', role: 'bank' as UserRole, password: 'Demo@1234' },
  { name: 'Vikram Singh', email: 'broker@meharfinance.com', role: 'broker' as UserRole, password: 'Demo@1234' },
  { name: 'Neha Gupta', email: 'employee@meharfinance.com', role: 'employee' as UserRole, password: 'Demo@1234' },
];
