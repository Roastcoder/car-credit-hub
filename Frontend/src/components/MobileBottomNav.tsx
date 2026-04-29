import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/lib/auth';
import { getUserPermissions, Permission } from '@/lib/permissions';
import {
  LayoutDashboard, FileText, Car, Users, UserPlus,
  BarChart3, MoreHorizontal, Building2, UserCheck,
  MapPin, CreditCard, Send, X, ClipboardCheck,
  TrendingUp, Receipt, Plus, ChevronRight, Activity, Shield, ShieldCheck, MessageSquare
} from 'lucide-react';
import { useState, useMemo } from 'react';

interface NavSubItem {
  label: string;
  path: string;
  icon: React.ReactNode;
}

interface NavItem {
  label: string;
  path?: string;
  icon: React.ReactNode;
  roles: UserRole[];
  children?: (NavSubItem & { roles?: UserRole[] })[];
  permission?: keyof Permission;
}

const ALL_NAV_ITEMS: NavItem[] = [
  { label: 'Chat', path: '/chat', icon: <MessageSquare size={20} />, roles: ['super_admin', 'admin', 'manager', 'rbm', 'pdd_manager', 'bank', 'broker', 'employee', 'accountant'] },
  { label: 'Home', path: '/dashboard', icon: <LayoutDashboard size={20} />, roles: ['super_admin', 'admin', 'manager', 'rbm', 'pdd_manager', 'bank', 'broker', 'employee'] },
  { label: 'PDD Tracking', path: '/pdd-tracking', icon: <ClipboardCheck size={20} />, roles: ['super_admin', 'admin', 'manager', 'pdd_manager', 'employee'], permission: 'canManagePdd' },
  {
    label: 'Leads',
    icon: <UserPlus size={20} />,
    roles: ['super_admin', 'admin', 'manager', 'rbm', 'broker', 'employee'],
    permission: 'canView',
    children: [
      { label: 'Leads List', path: '/leads-list', icon: <FileText size={18} /> },
      { label: 'Create Lead', path: '/add-lead', icon: <Plus size={18} /> },
      { label: 'Broker Leads', path: '/broker-leads', icon: <UserCheck size={18} /> },
    ]
  },
  {
    label: 'Loans',
    icon: <FileText size={20} />,
    roles: ['super_admin', 'admin', 'manager', 'rbm', 'bank', 'broker', 'employee'],
    permission: 'canView',
    children: [
      { label: 'Loans List', path: '/loans', icon: <FileText size={18} /> },
      { label: 'New Loan', path: '/loans/new', icon: <Plus size={18} /> },
      { label: 'PDD Tracking', path: '/pdd-tracking', icon: <ClipboardCheck size={18} /> },
    ]
  },
  {
    label: 'Payments',
    icon: <Activity size={20} />,
    roles: ['super_admin', 'admin', 'manager', 'rbm', 'employee', 'accountant'],
    permission: 'canManagePayments',
    children: [
      { label: 'Application List', path: '/payments', icon: <FileText size={18} /> },
      { label: 'New Application', path: '/payments/new', icon: <Plus size={18} />, roles: ['super_admin', 'admin', 'employee', 'accountant'] },
    ]
  },
  { label: 'Reports', path: '/reports', icon: <BarChart3 size={20} />, roles: ['super_admin', 'admin', 'manager', 'rbm', 'pdd_manager'], permission: 'canViewReports' },
  { label: 'Commission', path: '/commission', icon: <CreditCard size={20} />, roles: ['super_admin', 'admin', 'broker'] },
  { label: 'Users', path: '/users', icon: <Users size={20} />, roles: ['super_admin', 'admin', 'manager'] },
  { label: 'Banks / NBFC', path: '/banks', icon: <Building2 size={20} />, roles: ['super_admin', 'admin'] },
  { label: 'Brokers', path: '/brokers', icon: <UserCheck size={20} />, roles: ['super_admin', 'admin'] },
  { label: 'Branches', path: '/branches', icon: <MapPin size={20} />, roles: ['super_admin', 'admin', 'manager'] },
  { label: 'Send Notification', path: '/broadcast', icon: <Send size={20} />, roles: ['super_admin', 'admin'] },
  { label: 'Credit Reports', path: '/credit-reports', icon: <ShieldCheck size={20} />, roles: ['super_admin'] },
  { label: 'Permissions', path: '/permissions', icon: <Shield size={20} />, roles: ['super_admin'] },
  { label: 'Account Home', path: '/account', icon: <LayoutDashboard size={20} />, roles: ['accountant'] },
  { label: 'Receivables', path: '/account/receivables', icon: <TrendingUp size={20} />, roles: ['accountant'], permission: 'canManagePayments' },
  { label: 'Payables', path: '/account/payables', icon: <Receipt size={20} />, roles: ['accountant'], permission: 'canManagePayments' },
  { label: 'Vouchers', path: '/account/vouchers', icon: <FileText size={20} />, roles: ['accountant'], permission: 'canManagePayments' },
];

export default function MobileBottomNav() {
  const { user } = useAuth();
  const location = useLocation();
  const [showMore, setShowMore] = useState(false);
  const [activeSubMenu, setActiveSubMenu] = useState<string | null>(null);

  if (!user) return null;
  const permissions = getUserPermissions(user);

  const filteredNav = ALL_NAV_ITEMS.map(item => {
    // If item has children, filter them by role
    if (item.children) {
      const allowedChildren = item.children.filter(child => 
        !child.roles || (user.role && child.roles.includes(user.role as UserRole))
      );
      
      // If only one child remains, and it's the main view, make it a direct link
      if (allowedChildren.length === 1) {
        return { ...item, path: allowedChildren[0].path, children: undefined };
      }
      
      // Return a copy of the item with filtered children
      return { ...item, children: allowedChildren.length > 0 ? allowedChildren : undefined };
    }
    return item;
  }).filter(item => {
    // Check role for the main item
    const hasRole = !user.role || item.roles.includes(user.role);
    if (!hasRole) return false;

    // Check permission if specified
    if (item.permission) {
      return !!permissions[item.permission];
    }

    return true;
  });

  const primaryNavItems = useMemo(() => {
    let labels: string[] = [];
    if (user.role === 'super_admin' || user.role === 'admin') {
      labels = ['Home', 'Leads', 'Loans', 'Apps'];
    } else if (user.role === 'manager' || user.role === 'rbm') {
      labels = ['Home', 'Leads', 'Loans', 'Pay..'];
    } else if (user.role === 'broker') {
      labels = ['Home', 'Leads', 'Loans', 'Commission'];
    } else if (user.role === 'accountant') {
      labels = ['Account Home', 'Receivables', 'Payables', 'Vouchers'];
    } else if (user.role === 'pdd_manager') {
      labels = ['Home', 'PDD Tracking', 'Reports', 'Chat'];
    } else if (user.role === 'bank') {
      labels = ['Home', 'Loans', 'Chat'];
    } else {
      labels = ['Home', 'Leads', 'Loans', 'Apps'];
    }

    // Map the labels to preserve order and keep only valid ones
    return labels
      .map(label => filteredNav.find(item => item.label === label))
      .filter((item): item is NavItem => item !== undefined);
  }, [user.role, filteredNav]);

  const moreNav = filteredNav.filter(item => !primaryNavItems.find(p => p.label === item.label));

  const isNavActive = (item: NavItem) => {
    if (item.path) return location.pathname === item.path;
    if (item.children) {
      return item.children.some(child => location.pathname === child.path);
    }
    return false;
  };

  return (
    <>
      {/* Bottom Bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border z-40 safe-area-bottom shadow-lg transition-all duration-200">
        <div className="flex items-center justify-around px-2 py-2">
          {primaryNavItems.map(item => {
            const active = isNavActive(item);
            const hasChildren = !!item.children;

            if (hasChildren) {
              return (
                <button
                  key={item.label}
                  onClick={() => setActiveSubMenu(activeSubMenu === item.label ? null : item.label)}
                  className={`flex flex-col items-center gap-1 px-3 py-2 rounded-2xl transition-all duration-200 min-w-0 flex-1 relative ${active || activeSubMenu === item.label
                    ? 'text-accent'
                    : 'text-muted-foreground hover:text-foreground'
                    }`}
                >
                  <div className={`p-1.5 rounded-xl transition-colors ${active || activeSubMenu === item.label ? 'bg-accent/10' : ''}`}>
                    {item.icon}
                  </div>
                  <span className="text-[10px] font-bold tracking-tight">{item.label}</span>
                  {active && !activeSubMenu && <div className="absolute -bottom-1 w-1 h-1 bg-accent rounded-full" />}
                </button>
              );
            }

            return (
              <Link
                key={item.label}
                to={item.path!}
                className={`flex flex-col items-center gap-1 px-3 py-2 rounded-2xl transition-all duration-200 min-w-0 flex-1 relative ${active
                  ? 'text-accent'
                  : 'text-muted-foreground hover:text-foreground'
                  }`}
              >
                <div className={`p-1.5 rounded-xl transition-colors ${active ? 'bg-accent/10' : ''}`}>
                  {item.icon}
                </div>
                <span className="text-[10px] font-bold tracking-tight">{item.label}</span>
                {active && <div className="absolute -bottom-1 w-1 h-1 bg-accent rounded-full" />}
              </Link>
            );
          })}

          {moreNav.length > 0 && (
            <button
              onClick={() => setShowMore(true)}
              className="flex flex-col items-center gap-1 px-3 py-2 rounded-2xl transition-all duration-300 min-w-0 flex-1 text-muted-foreground hover:text-foreground active:scale-95"
            >
              <div className="p-1.5 rounded-xl">
                <MoreHorizontal size={20} />
              </div>
              <span className="text-[10px] font-bold tracking-tight">More</span>
            </button>
          )}
        </div>
      </nav>

      {/* Sub Menu / Bottom Sheet */}
      {activeSubMenu && (
        <>
          <div
            className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-40 lg:hidden animate-in fade-in duration-200"
            onClick={() => setActiveSubMenu(null)}
          />
          <div className="fixed bottom-20 left-4 right-4 z-50 lg:hidden animate-in slide-in-from-bottom-4 duration-200">
            <div className="bg-card rounded-[2rem] border border-border shadow-2xl overflow-hidden">
              <div className="p-2 space-y-1">
                <div className="px-5 py-3 flex items-center justify-between border-b border-border/50">
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                    {primaryNavItems.find(i => i.label === activeSubMenu)?.icon}
                    {activeSubMenu}
                  </h3>
                  <button
                    onClick={() => setActiveSubMenu(null)}
                    className="p-1.5 rounded-full hover:bg-muted/50 transition-colors"
                  >
                    <X size={16} className="text-muted-foreground" />
                  </button>
                </div>
                <div className="grid grid-cols-1 gap-1 p-2">
                  {primaryNavItems.find(i => i.label === activeSubMenu)?.children?.map(child => {
                    const active = location.pathname === child.path;
                    return (
                      <Link
                        key={child.path}
                        to={child.path}
                        onClick={() => setActiveSubMenu(null)}
                        className={`flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all ${active
                          ? 'bg-accent text-accent-foreground shadow-md font-bold'
                          : 'text-foreground hover:bg-muted/50'
                          }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className={`p-1.5 rounded-lg ${active ? 'bg-white/20 text-white' : 'bg-accent/10 text-accent'}`}>
                            {child.icon}
                          </span>
                          <span className="text-sm">{child.label}</span>
                        </div>
                        {active ? <div className="w-1.5 h-1.5 rounded-full bg-white shadow-sm" /> : <ChevronRight size={14} className="text-muted-foreground/50" />}
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* More Menu Popup */}
      {showMore && (
        <>
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 lg:hidden" onClick={() => setShowMore(false)} />
          <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden animate-in slide-in-from-bottom duration-200">
            <div className="bg-card rounded-t-[2.5rem] border-t border-border shadow-2xl max-h-[75vh] overflow-y-auto">
              <div className="sticky top-0 bg-card border-b border-border px-6 py-5 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-foreground">More Options</h3>
                  <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">Navigation</p>
                </div>
                <button
                  onClick={() => setShowMore(false)}
                  className="p-2.5 rounded-full hover:bg-muted transition-colors shadow-sm"
                >
                  <X size={20} className="text-muted-foreground" />
                </button>
              </div>
              <div className="p-4 grid grid-cols-1 gap-2">
                {moreNav.map(item => {
                  const active = isNavActive(item);
                  const hasChildren = !!item.children;

                  return (
                    <div key={item.label} className="space-y-1">
                      {hasChildren ? (
                        <>
                          <div className="px-4 py-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-2">{item.label}</div>
                          {item.children.map(child => {
                            const childActive = location.pathname === child.path;
                            return (
                              <Link
                                key={child.path}
                                to={child.path}
                                onClick={() => setShowMore(false)}
                                className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all ${childActive
                                  ? 'bg-accent text-accent-foreground shadow-lg'
                                  : 'text-foreground hover:bg-muted/50'
                                  }`}
                              >
                                <span className={childActive ? 'scale-110' : 'text-accent'}>{child.icon}</span>
                                <span className="text-sm font-semibold">{child.label}</span>
                                {childActive && <div className="ml-auto w-2 h-2 bg-accent-foreground rounded-full" />}
                              </Link>
                            );
                          })}
                        </>
                      ) : (
                        <Link
                          to={item.path!}
                          onClick={() => setShowMore(false)}
                          className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all ${active
                            ? 'bg-accent text-accent-foreground shadow-lg'
                            : 'text-foreground hover:bg-muted/50'
                            }`}
                        >
                          <span className={active ? 'scale-110' : 'text-accent'}>{item.icon}</span>
                          <span className="text-sm font-semibold">{item.label}</span>
                          {active && <div className="ml-auto w-2 h-2 bg-accent-foreground rounded-full" />}
                        </Link>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="h-8" />
            </div>
          </div>
        </>
      )}
    </>
  );
}
