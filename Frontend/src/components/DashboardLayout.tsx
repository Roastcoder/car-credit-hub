import { ReactNode, useState, ElementType, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole, ROLE_LABELS } from '@/lib/auth';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard, FileText, Users, Building2, UserCheck, BarChart3,
  LogOut, X, Car, CreditCard, ChevronLeft, ChevronRight, MapPin, UserPlus, Send, ClipboardCheck, Wallet,
  Activity, Receipt, Shield, User, Menu, ShieldCheck, Settings, Layers, List,
  AlertTriangle, CheckCircle2
} from 'lucide-react';
import logo from '@/assets/logo.png';
import MobileBottomNav from './MobileBottomNav';
import NotificationBell from './NotificationBell';
import ProfileCompletionModal from './ProfileCompletionModal';
import { toast } from 'sonner';

interface NavItem {
  title: string;
  path: string;
  icon: ElementType;
  shortLabel?: string;
  roles: UserRole[];
  children?: {
    title: string;
    path: string;
    icon: ElementType;
    shortLabel?: string;
  }[];
}

const NAV_ITEMS: NavItem[] = [
  {
    title: 'Dashboard',
    path: '/dashboard',
    icon: LayoutDashboard,
    shortLabel: 'DB',
    roles: ['super_admin', 'admin', 'manager', 'rbm', 'pdd_manager', 'bank', 'broker', 'employee']
  },
  {
    title: 'Leads',
    path: '/leads-list',
    icon: UserPlus,
    shortLabel: 'LD',
    roles: ['super_admin', 'admin', 'manager', 'rbm', 'employee'],
    children: [
      { title: 'Create Lead', path: '/add-lead', icon: UserPlus, shortLabel: 'CL' },
      { title: 'Branch Leads', path: '/leads-list', icon: MapPin, shortLabel: 'BL' },
      { title: 'Broker Leads', path: '/broker-leads', icon: UserCheck, shortLabel: 'BR' },
    ],
  },
  {
    title: 'Lead Map',
    path: '/leads-list',
    icon: UserPlus,
    shortLabel: 'LM',
    roles: ['broker'],
    children: [
      { title: 'Create Lead', path: '/add-lead', icon: UserPlus, shortLabel: 'CL' },
      { title: 'Lead List', path: '/leads-list', icon: FileText, shortLabel: 'LL' },
      { title: 'Broker List', path: '/broker-leads', icon: UserCheck, shortLabel: 'BR' },
    ],
  },
  { title: 'Loan Applications', path: '/loans', icon: FileText, shortLabel: 'LN', roles: ['super_admin', 'admin', 'manager', 'rbm', 'bank', 'broker', 'employee'] },
  { title: 'Create Loan', path: '/loans/new', icon: Car, shortLabel: 'NL', roles: ['super_admin', 'admin', 'manager', 'employee'] },
  { title: 'PDD Tracking', path: '/pdd-tracking', icon: ClipboardCheck, shortLabel: 'PD', roles: ['super_admin', 'admin', 'manager', 'pdd_manager', 'employee'] },
  { title: 'Payments', path: '/payments', icon: Wallet, shortLabel: 'PY', roles: ['super_admin', 'admin', 'manager', 'rbm', 'employee'] },
  { title: 'Reports', path: '/reports', icon: BarChart3, shortLabel: 'RP', roles: ['super_admin', 'admin', 'manager', 'rbm'] },
  { title: 'Commission', path: '/commission', icon: CreditCard, shortLabel: 'CM', roles: ['super_admin', 'admin', 'broker'] },
  { title: 'Users', path: '/users', icon: Users, shortLabel: 'US', roles: ['super_admin', 'admin', 'manager'] },
  { title: 'Permission Control', path: '/permissions', icon: Shield, shortLabel: 'PC', roles: ['super_admin'] },
  { title: 'Banks / NBFC', path: '/banks', icon: Building2, shortLabel: 'BK', roles: ['super_admin', 'admin'] },
  { title: 'Brokers', path: '/brokers', icon: UserCheck, shortLabel: 'BR', roles: ['super_admin', 'admin'] },
  { title: 'My Brokers', path: '/my-brokers', icon: UserCheck, shortLabel: 'MB', roles: ['employee'] },
  { title: 'Branches', path: '/branches', icon: MapPin, shortLabel: 'BN', roles: ['super_admin', 'admin', 'manager'] },
  { title: 'Send Notification', path: '/broadcast', icon: Send, shortLabel: 'NT', roles: ['super_admin', 'admin'] },
  { title: 'Credit Reports', path: '/credit-reports', icon: ShieldCheck, shortLabel: 'CR', roles: ['super_admin'] },
  {
    title: 'Subvention Settings',
    path: '/settings/subvention',
    icon: Settings,
    shortLabel: 'ST',
    roles: ['super_admin'],
    children: [
      { title: 'Subvention Grid', path: '/settings/subvention', icon: Layers, shortLabel: 'SG' },
      { title: 'Loan Schemes', path: '/settings/schemes', icon: List, shortLabel: 'LS' },
      { title: 'Vehicle Models', path: '/settings/vehicle-models', icon: Car, shortLabel: 'VM' },
    ],
  },
];

const PDD_MANAGER_NAV_ITEMS: NavItem[] = [
  {
    title: 'Dashboard',
    path: '/dashboard',
    icon: LayoutDashboard,
    shortLabel: 'DB',
    roles: ['pdd_manager']
  },
  {
    title: 'PDD Management',
    path: '/pdd-tracking',
    icon: ClipboardCheck,
    shortLabel: 'PM',
    roles: ['pdd_manager'],
    children: [
      { title: 'PDD Pending', path: '/pdd-tracking?tab=pending', icon: AlertTriangle, shortLabel: 'PP' },
      { title: 'PDD Completed', path: '/pdd-tracking?tab=completed', icon: CheckCircle2, shortLabel: 'PC' },
    ],
  },
  { title: 'Reports', path: '/reports', icon: BarChart3, shortLabel: 'RP', roles: ['pdd_manager'] },
];

const ACCOUNT_NAV_ITEMS: NavItem[] = [
  { title: 'Overview', path: '/account', icon: Activity, shortLabel: 'OV', roles: ['accountant', 'admin', 'super_admin'] },
  { title: 'Payment Requests', path: '/payments', icon: CreditCard, shortLabel: 'PR', roles: ['accountant', 'admin', 'super_admin'] },
  { title: 'Payment Vouchers', path: '/account/vouchers', icon: Receipt, shortLabel: 'PV', roles: ['accountant', 'admin', 'super_admin'] },
];

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [imageError, setImageError] = useState(false);

  if (!user) return null;

  useEffect(() => {
    setSidebarOpen(false);
    setProfileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (window.innerWidth >= 1024) return;

    document.body.style.overflow = sidebarOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [sidebarOpen]);

  const getNavItems = () => {
    if (user.role === 'accountant') return ACCOUNT_NAV_ITEMS;
    if (user.role === 'pdd_manager') return PDD_MANAGER_NAV_ITEMS;
    return NAV_ITEMS;
  };

  const filteredNav = getNavItems().filter(item => !user.role || item.roles.includes(user.role));

  const isPathActive = (itemPath: string) => {
    // Exact match
    if (location.pathname + location.search === itemPath) return true;
    if (location.pathname === itemPath && !itemPath.includes('?')) return true;
    
    if (itemPath === '/account') return location.pathname === '/account';
    if (itemPath === '/loans' && location.pathname === '/loans/new') return false;
    
    // Handle parameterized paths (like /pdd-tracking?tab=pending)
    if (itemPath.includes('?')) {
      const [basePath, search] = itemPath.split('?');
      return location.pathname === basePath && location.search === `?${search}`;
    }

    return location.pathname.startsWith(`${itemPath}/`);
  };

  const getFallbackShortLabel = (title: string) => {
    const compact = title.replace(/[^A-Za-z0-9 ]/g, '').trim();
    if (!compact) return 'NA';

    const words = compact.split(/\s+/).filter(Boolean);
    if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
    return words.slice(0, 2).map((word) => word[0]).join('').toUpperCase();
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const initials = user.name
    ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : user.email ? user.email.slice(0, 2).toUpperCase() : 'U';

  return (
    <div className="flex h-[100dvh] overflow-hidden">
      <ProfileCompletionModal />

      {/* Sidebar - Desktop Only */}
      <aside className={`hidden lg:flex static inset-y-0 left-0 z-50 ${collapsed ? 'w-16' : 'w-64'} bg-card border-r border-border flex-col transition-all duration-200 shadow-xl m-3 mr-1.5 rounded-[1.5rem] h-[calc(100vh-1.5rem)]`}>
        {/* Logo */}
        <div className={`flex items-center ${collapsed ? 'justify-center py-6' : 'gap-4 px-6'} h-24 border-b border-white/20 dark:border-white/5`}>
          <div className="glass-card rounded-2xl p-2 shadow-sm">
            <img src={logo} alt="Mehar Finance" className={`${collapsed ? 'h-8 w-8' : 'h-10 w-10'} object-contain`} />
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-base font-bold text-blue-950 dark:text-white truncate tracking-tight">Mehar Finance</p>
              <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Portal</p>
            </div>
          )}
          <button className="lg:hidden ml-auto text-blue-500 hover:text-blue-950 dark:text-blue-400 dark:hover:text-white transition-colors" onClick={() => setSidebarOpen(false)}>
            <X size={20} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1 relative z-10">
          {filteredNav.map(item => {
            const activeChild = item.children?.find((child) => location.pathname === child.path);
            const hasActiveChild = !!activeChild;
            const isActive = isPathActive(item.path) || hasActiveChild;
            const IconComponent = activeChild?.icon || item.icon;
            const collapsedTitle = activeChild?.title || item.title;

            return (
              <div key={item.path} className="space-y-1">
                <Link
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  title={collapsed ? collapsedTitle : undefined}
                  className={`group relative flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-semibold transition-all duration-200
                    ${collapsed ? 'justify-center px-0 py-3 mx-1' : ''}
                    ${isActive
                      ? 'bg-accent text-accent-foreground shadow-md'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50 border border-transparent'
                    }`}
                >
                  <span className={`${isActive ? 'text-white drop-shadow-sm' : 'text-blue-400 group-hover:text-blue-600 dark:group-hover:text-blue-400'} transition-colors duration-300`}>
                    <IconComponent size={collapsed ? 20 : 18} />
                  </span>
                  {!collapsed && <span className="truncate tracking-wide">{item.title}</span>}
                  {!collapsed && isActive && (
                    <div className="ml-auto w-1.5 h-1.5 bg-white rounded-full shadow-sm" />
                  )}
                  {/* Tooltip on collapsed */}
                  {collapsed && (
                    <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-gray-900 dark:bg-gray-800 text-white text-xs font-semibold rounded-lg shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity duration-150">
                      {collapsedTitle}
                      <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900 dark:border-r-gray-800" />
                    </div>
                  )}
                </Link>

                {!collapsed && item.children && isActive && (
                  <div className="ml-11 flex flex-col gap-0.5 border-l border-blue-200 dark:border-blue-800/50 mt-1 mb-2">
                    {item.children.map((child) => {
                      const isChildActive = location.pathname === child.path;
                      return (
                        <Link
                          key={child.path}
                          to={child.path}
                          onClick={() => setSidebarOpen(false)}
                          className={cn(
                            "group/sub flex items-center gap-3 py-2.5 px-4 text-[13px] font-semibold transition-all relative",
                            isChildActive
                              ? "text-blue-700 dark:text-blue-300"
                              : "text-blue-500/70 hover:text-blue-950 dark:hover:text-white"
                          )}
                        >
                          <div className={cn(
                            "absolute left-0 top-1/2 -translate-y-1/2 w-3 h-[1px]",
                            isChildActive ? "bg-blue-600 dark:bg-blue-400" : "bg-blue-200 dark:bg-blue-800/50"
                          )} />
                          <div className={cn(
                            "w-1.5 h-1.5 rounded-full transition-all duration-300",
                            isChildActive
                              ? "bg-blue-600 dark:bg-blue-400 scale-125 shadow-[0_0_8px_rgba(37,99,235,0.5)]"
                              : "bg-blue-300 dark:bg-blue-800 group-hover/sub:bg-blue-500"
                          )} />
                          <span className="truncate tracking-wide">{child.title}</span>
                          {isChildActive && (
                            <div className="ml-auto w-1 h-3 bg-blue-600 dark:bg-blue-400 rounded-full animate-in fade-in slide-in-from-right-1" />
                          )}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Collapse toggle (desktop only) */}
        <div className="hidden lg:flex justify-center py-4 border-t border-white/20 dark:border-white/5">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-2.5 rounded-xl text-blue-400 hover:text-blue-950 dark:hover:text-white hover:bg-white/40 dark:hover:bg-white/5 transition-all duration-300 border border-transparent hover:border-white/20 dark:hover:border-white/10"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        {/* User (Mobile only - hidden on desktop) */}
        <div className={`lg:hidden px-4 pb-6 pt-6 border-t border-white/20 dark:border-white/5 ${collapsed ? 'flex flex-col items-center' : ''}`}>
          {!collapsed && (
            <div className="flex items-center gap-4 px-4 py-3 mb-4 rounded-2xl glass-card shadow-sm border border-white/40 dark:border-white/10">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-inner border border-white/20 overflow-hidden">
                {(user.profile_image && !imageError) ? (
                  <img
                    src={`${(import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/api\/?$/, '')}${user.profile_image}`}
                    alt=""
                    className="w-full h-full object-cover"
                    onError={() => setImageError(true)}
                  />
                ) : (
                  initials
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-blue-950 dark:text-white truncate">{user.name || 'User'}</p>
                <p className="text-xs font-medium text-blue-500 dark:text-blue-400">{user.role ? ROLE_LABELS[user.role] : 'No role'}</p>
              </div>
            </div>
          )}
          {collapsed ? (
            <button onClick={handleLogout} title="Logout" className="p-3 rounded-2xl text-red-500 hover:text-red-700 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-300 border border-transparent hover:border-red-200 dark:hover:border-red-800/30">
              <LogOut size={20} />
            </button>
          ) : (
            <button onClick={handleLogout} className="flex items-center justify-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold text-red-600 dark:text-red-400 hover:text-white hover:bg-gradient-to-r hover:from-red-500 hover:to-rose-600 transition-all duration-300 w-full border border-red-200 dark:border-red-900/50 hover:border-transparent hover:shadow-lg hover:shadow-red-500/20">
              <LogOut size={18} />
              Logout
            </button>
          )}
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="h-14 lg:h-14 lg:mt-3 lg:mx-3 bg-card border border-border lg:rounded-2xl sm:lg:rounded-[1.5rem] flex items-center px-4 lg:px-5 gap-3 lg:gap-4 shrink-0 shadow-sm z-40 lg:mb-1.5 transition-all duration-200">
          {/* Logo - Mobile always, Desktop only for accountants */}
          <div className={`${user.role === 'accountant' ? 'flex' : 'lg:hidden'} items-center gap-2`}>
            <img src={logo} alt="Mehar Finance" className="h-8 w-auto object-contain" />
          </div>

          {/* Page title / User greeting */}
          <div className="hidden lg:flex flex-1 min-w-0 items-center ml-2 border-l border-white/50 dark:border-white/10 pl-4 h-8">
            <div>
              <p className="text-base font-bold text-blue-950 dark:text-white truncate lg:text-lg tracking-tight drop-shadow-sm">
                Hi, <span className="text-blue-600 dark:text-blue-400">{user.name?.split(' ')[0] || user.email?.split('@')[0] || 'User'}</span>
              </p>
              <p className="text-xs lg:text-sm text-blue-700 dark:text-blue-400 font-medium truncate tracking-wide">
                {user.role ? ROLE_LABELS[user.role] : 'User'}
              </p>
            </div>
          </div>
          <div className="flex-1 lg:hidden"></div>


          <button
            onClick={() => {
              navigator.clipboard.writeText(user.channel_code!);
              toast.success('Unique ID copied!', {
                icon: <ClipboardCheck size={16} className="text-blue-500" />,
                duration: 2000
              });
            }}
            className="flex flex-col items-center justify-center px-4 py-1.5 bg-accent hover:opacity-90 rounded-2xl shadow-sm border border-border transition-all active:scale-95 group relative overflow-hidden"
            title="Click to copy Unique ID"
          >
            <span className="text-[9px] font-bold text-accent-foreground/90 uppercase tracking-[0.2em] leading-none mb-0.5">Unique ID</span>
            <span className="text-sm font-black text-accent-foreground leading-none">{user.channel_code}</span>
          </button>

          {/* Notification Bell */}
          <div className="relative z-50">
            <NotificationBell />
          </div>

          {/* Profile Dropdown */}
          <div className="block relative">
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-md border border-white/20 hover:shadow-lg transition-all overflow-hidden"
            >
              {(user.profile_image && !imageError) ? (
                <img
                  src={`${(import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/api\/?$/, '')}${user.profile_image}`}
                  alt=""
                  className="w-full h-full object-cover"
                  onError={() => setImageError(true)}
                />
              ) : (
                initials
              )}
            </button>
            {profileOpen && (
              <>
                <div className="fixed inset-0 z-40 bg-black/5" onClick={() => setProfileOpen(false)} />
                <div className="absolute right-0 top-14 w-60 bg-white dark:bg-slate-900 border border-blue-100 dark:border-blue-800/50 rounded-2xl shadow-2xl z-50 overflow-hidden transform origin-top-right transition-all">
                  <div className="p-4 border-b border-white/10">
                    <p className="text-sm font-bold text-blue-950 dark:text-white truncate">{user.name || 'User'}</p>
                    <p className="text-xs font-semibold text-blue-600 dark:text-blue-400">{user.role ? ROLE_LABELS[user.role] : 'No role'}</p>
                  </div>
                  <div className="p-2 space-y-1">
                    <button
                      onClick={() => { navigate('/profile'); setProfileOpen(false); }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-blue-900 dark:text-blue-100 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-all border border-transparent hover:border-blue-100 dark:hover:border-blue-800"
                    >
                      <User size={18} className="text-blue-500" />
                      View Profile
                    </button>
                    <button
                      onClick={() => { handleLogout(); setProfileOpen(false); }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-700 dark:hover:text-red-300 rounded-xl transition-all"
                    >
                      <LogOut size={18} />
                      Logout
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </header>

        {/* Page */}
        <main className="flex-1 overflow-y-auto px-0 py-3 pb-20 lg:p-4 sm:lg:p-5 scroll-smooth antialiased transform-gpu overscroll-behavior-y-contain" style={{ WebkitOverflowScrolling: 'touch' }}>
          <div className="animate-fade-in-slow min-h-full will-change-transform">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
    </div>
  );
}
