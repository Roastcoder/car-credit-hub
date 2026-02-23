import { ReactNode, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth, UserRole } from '@/contexts/AuthContext';
import { ROLE_LABELS } from '@/lib/auth';
import {
  LayoutDashboard, FileText, Users, Building2, UserCheck, BarChart3,
  LogOut, Menu, X, Car, Bell, CreditCard, Shield, ChevronLeft, ChevronRight, MapPin, UserPlus
} from 'lucide-react';
import logo from '@/assets/logo.png';
import MobileBottomNav from './MobileBottomNav';
import NotificationBell from './NotificationBell';


interface NavItem {
  label: string;
  path: string;
  icon: ReactNode;
  roles: UserRole[];
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={18} />, roles: ['super_admin', 'admin', 'manager', 'bank', 'broker', 'employee'] },
  { label: 'Leads', path: '/leads-list', icon: <UserPlus size={18} />, roles: ['super_admin', 'admin', 'manager', 'broker', 'employee'] },
  { label: 'Loan Applications', path: '/loans', icon: <FileText size={18} />, roles: ['super_admin', 'admin', 'manager', 'bank', 'broker', 'employee'] },
  { label: 'Create Loan', path: '/loans/new', icon: <Car size={18} />, roles: ['super_admin', 'admin', 'manager', 'broker', 'employee'] },
  { label: 'Users', path: '/users', icon: <Users size={18} />, roles: ['super_admin', 'admin', 'manager'] },
  { label: 'Banks / NBFC', path: '/banks', icon: <Building2 size={18} />, roles: ['super_admin', 'admin'] },
  { label: 'Branches', path: '/branches', icon: <MapPin size={18} />, roles: ['super_admin', 'admin', 'manager'] },
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
  const [collapsed, setCollapsed] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  if (!user) return null;

  const filteredNav = NAV_ITEMS.filter(item => !user.role || item.roles.includes(user.role));

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const initials = user.full_name
    ? user.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : user.email.slice(0, 2).toUpperCase();

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-foreground/40 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 ${collapsed ? 'w-16' : 'w-64'} bg-sidebar flex flex-col transition-all duration-200 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        {/* Logo */}
        <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3 px-4'} h-16 border-b border-sidebar-border`}>
          <img src={logo} alt="Mehar Finance" className={`${collapsed ? 'h-8 w-8' : 'h-10'} w-auto object-contain bg-white rounded p-1`} />
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-sidebar-foreground truncate">Mehar Finance</p>
              <p className="text-[10px] text-sidebar-muted">Car Loan Portal</p>
            </div>
          )}
          <button className="lg:hidden ml-auto text-sidebar-foreground" onClick={() => setSidebarOpen(false)}>
            <X size={20} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
          {filteredNav.map(item => {
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                title={collapsed ? item.label : undefined}
                className={`sidebar-link ${collapsed ? 'justify-center px-0' : ''} ${active ? 'sidebar-link-active' : 'sidebar-link-inactive'}`}
              >
                {item.icon}
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Collapse toggle (desktop only) */}
        <div className="hidden lg:flex justify-center py-2 border-t border-sidebar-border">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-lg text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        {/* User */}
        <div className={`px-2 pb-4 border-t border-sidebar-border pt-4 ${collapsed ? 'flex flex-col items-center' : ''}`}>
          {!collapsed && (
            <div className="flex items-center gap-3 px-3 mb-3">
              <div className="w-9 h-9 rounded-full bg-sidebar-accent flex items-center justify-center text-sidebar-primary font-semibold text-sm shrink-0">
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-sidebar-foreground truncate">{user.full_name || user.email}</p>
                <p className="text-xs text-sidebar-muted">{user.role ? ROLE_LABELS[user.role] : 'No role'}</p>
              </div>
            </div>
          )}
          {collapsed ? (
            <button onClick={handleLogout} title="Logout" className="p-2 rounded-lg text-destructive hover:bg-destructive/10 transition-colors">
              <LogOut size={18} />
            </button>
          ) : (
            <button onClick={handleLogout} className="sidebar-link sidebar-link-inactive w-full text-destructive hover:text-destructive hover:bg-destructive/10">
              <LogOut size={18} />
              Logout
            </button>
          )}
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="h-16 border-b border-border bg-card flex items-center px-4 lg:px-6 gap-4 shrink-0">
          {/* Mobile: Logo */}
          <div className="lg:hidden flex items-center gap-2">
            <img src={logo} alt="Mehar Finance" className="h-8 w-auto object-contain bg-white rounded p-0.5" />
          </div>
          
          {/* Desktop: Menu button */}
          <button className="hidden lg:block text-foreground" onClick={() => setSidebarOpen(true)}>
            <Menu size={22} />
          </button>
          
          {/* Page title / User greeting */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground truncate lg:text-base">
              Hi, {user.full_name?.split(' ')[0] || user.email}
            </p>
            <p className="text-[10px] lg:text-xs text-muted-foreground truncate">
              {user.role ? ROLE_LABELS[user.role] : 'User'}
            </p>
          </div>
          
          
          {/* Notification Bell */}
          <NotificationBell />
          
          {/* Mobile: Profile Dropdown */}
          <div className="lg:hidden relative">
            <button 
              onClick={() => setProfileOpen(!profileOpen)}
              className="w-9 h-9 rounded-full bg-accent flex items-center justify-center text-accent-foreground font-semibold text-sm"
            >
              {initials}
            </button>
            {profileOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)} />
                <div className="absolute right-0 top-12 w-56 bg-card border border-border rounded-lg shadow-lg z-50 overflow-hidden">
                  <div className="p-3 border-b border-border">
                    <p className="text-sm font-medium text-foreground truncate">{user.full_name || user.email}</p>
                    <p className="text-xs text-muted-foreground">{user.role ? ROLE_LABELS[user.role] : 'No role'}</p>
                  </div>
                  <button 
                    onClick={() => { handleLogout(); setProfileOpen(false); }}
                    className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    <LogOut size={16} />
                    Logout
                  </button>
                </div>
              </>
            )}
          </div>
        </header>

        {/* Page */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6 pb-20 lg:pb-6">
          <div className="animate-fade-in">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
    </div>
  );
}
