import { ReactNode, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { ROLE_LABELS, UserRole } from '@/lib/auth';
import {
  LayoutDashboard, FileText, Users, Building2, UserCheck, BarChart3,
  Settings, LogOut, Menu, X, Car, Bell, ChevronDown, CreditCard, Shield
} from 'lucide-react';
import logo from '@/assets/logo.png';

interface NavItem {
  label: string;
  path: string;
  icon: ReactNode;
  roles: UserRole[];
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={18} />, roles: ['super_admin', 'admin', 'manager', 'bank', 'broker', 'employee'] },
  { label: 'Loan Applications', path: '/loans', icon: <FileText size={18} />, roles: ['super_admin', 'admin', 'manager', 'bank', 'broker', 'employee'] },
  { label: 'Create Loan', path: '/loans/new', icon: <Car size={18} />, roles: ['super_admin', 'admin', 'manager', 'broker', 'employee'] },
  { label: 'Users', path: '/users', icon: <Users size={18} />, roles: ['super_admin', 'admin', 'manager'] },
  { label: 'Banks / NBFC', path: '/banks', icon: <Building2 size={18} />, roles: ['super_admin', 'admin'] },
  { label: 'Brokers', path: '/brokers', icon: <UserCheck size={18} />, roles: ['super_admin', 'admin'] },
  { label: 'Commission', path: '/commission', icon: <CreditCard size={18} />, roles: ['super_admin', 'admin', 'broker'] },
  { label: 'Reports', path: '/reports', icon: <BarChart3 size={18} />, roles: ['super_admin', 'admin', 'manager'] },
  { label: 'PDD Tracking', path: '/pdd', icon: <Shield size={18} />, roles: ['super_admin', 'admin', 'manager', 'broker', 'employee'] },
];

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!user) return null;

  const filteredNav = NAV_ITEMS.filter(item => item.roles.includes(user.role));

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-foreground/40 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-sidebar flex flex-col transition-transform duration-200 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 h-16 border-b border-sidebar-border">
          <img src={logo} alt="Mehar Finance" className="h-10 w-auto object-contain" />
          <button className="lg:hidden ml-auto text-sidebar-foreground" onClick={() => setSidebarOpen(false)}>
            <X size={20} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {filteredNav.map(item => {
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`sidebar-link ${active ? 'sidebar-link-active' : 'sidebar-link-inactive'}`}
              >
                {item.icon}
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* User */}
        <div className="px-3 pb-4 border-t border-sidebar-border pt-4">
          <div className="flex items-center gap-3 px-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-sidebar-accent flex items-center justify-center text-sidebar-primary font-semibold text-sm">
              {user.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">{user.name}</p>
              <p className="text-xs text-sidebar-muted">{ROLE_LABELS[user.role]}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="sidebar-link sidebar-link-inactive w-full text-destructive hover:text-destructive hover:bg-destructive/10">
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="h-16 border-b border-border bg-card flex items-center px-4 lg:px-6 gap-4 shrink-0">
          <button className="lg:hidden text-foreground" onClick={() => setSidebarOpen(true)}>
            <Menu size={22} />
          </button>
          <div className="flex-1" />
          <button className="relative p-2 rounded-lg hover:bg-muted transition-colors">
            <Bell size={20} className="text-muted-foreground" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-accent" />
          </button>
        </header>

        {/* Page */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <div className="animate-fade-in">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
