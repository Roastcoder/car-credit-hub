export type UserRole = 'super_admin' | 'admin' | 'manager' | 'bank' | 'broker' | 'employee';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
}

export const ROLE_LABELS: Record<UserRole, string> = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  manager: 'Manager',
  bank: 'Bank / NBFC',
  broker: 'Broker',
  employee: 'Employee',
};

export const DEMO_USERS: User[] = [
  { id: '1', name: 'Rajesh Kumar', email: 'superadmin@carloan.com', role: 'super_admin' },
  { id: '2', name: 'Priya Sharma', email: 'admin@carloan.com', role: 'admin' },
  { id: '3', name: 'Amit Patel', email: 'manager@carloan.com', role: 'manager' },
  { id: '4', name: 'HDFC Bank', email: 'hdfc@carloan.com', role: 'bank' },
  { id: '5', name: 'Vikram Singh', email: 'broker@carloan.com', role: 'broker' },
  { id: '6', name: 'Neha Gupta', email: 'employee@carloan.com', role: 'employee' },
];

export function login(email: string): User | null {
  const user = DEMO_USERS.find(u => u.email === email);
  if (user) {
    localStorage.setItem('currentUser', JSON.stringify(user));
  }
  return user || null;
}

export function logout() {
  localStorage.removeItem('currentUser');
}

export function getCurrentUser(): User | null {
  const stored = localStorage.getItem('currentUser');
  return stored ? JSON.parse(stored) : null;
}
