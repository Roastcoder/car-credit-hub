import { Link, useLocation } from 'react-router-dom';
import { useAuth, UserRole } from '@/contexts/AuthContext';
import { LayoutDashboard, FileText, Car, Users, UserPlus, BarChart3, MoreHorizontal, Building2, UserCheck, MapPin, CreditCard, Send, X, ClipboardCheck, TrendingUp, Receipt } from 'lucide-react';
import { useState } from 'react';

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  roles: UserRole[];
}

const ALL_NAV_ITEMS: NavItem[] = [
  { label: 'Home', path: '/dashboard', icon: <LayoutDashboard size={20} />, roles: ['super_admin', 'admin', 'manager', 'bank', 'broker', 'employee', 'accountant'] },
  { label: 'Leads', path: '/leads-list', icon: <UserPlus size={20} />, roles: ['super_admin', 'admin', 'manager', 'broker', 'employee'] },
  { label: 'Loans', path: '/loans', icon: <FileText size={20} />, roles: ['super_admin', 'admin', 'manager', 'bank', 'broker', 'employee', 'accountant'] },
  { label: 'New', path: '/loans/new', icon: <Car size={20} />, roles: ['super_admin', 'admin', 'manager', 'broker', 'employee'] },
  { label: 'PDD Tracking', path: '/pdd-tracking', icon: <ClipboardCheck size={20} />, roles: ['super_admin', 'admin', 'manager', 'employee'] },
  { label: 'Reports', path: '/reports', icon: <BarChart3 size={20} />, roles: ['super_admin', 'admin', 'manager'] },
  { label: 'Commission', path: '/commission', icon: <CreditCard size={20} />, roles: ['super_admin', 'admin', 'broker'] },
  { label: 'Users', path: '/users', icon: <Users size={20} />, roles: ['super_admin', 'admin', 'manager'] },
  { label: 'Banks / NBFC', path: '/banks', icon: <Building2 size={20} />, roles: ['super_admin', 'admin'] },
  { label: 'Brokers', path: '/brokers', icon: <UserCheck size={20} />, roles: ['super_admin', 'admin'] },
  { label: 'Branches', path: '/branches', icon: <MapPin size={20} />, roles: ['super_admin', 'admin', 'manager'] },
  { label: 'Send Notification', path: '/broadcast', icon: <Send size={20} />, roles: ['super_admin', 'admin'] },
  { label: 'Receivables', path: '/account/receivables', icon: <TrendingUp size={20} />, roles: ['super_admin', 'admin', 'accountant'] },
  { label: 'Payables', path: '/account/payables', icon: <Receipt size={20} />, roles: ['super_admin', 'admin', 'accountant'] },
];

export default function MobileBottomNav() {
  const { user } = useAuth();
  const location = useLocation();
  const [showMore, setShowMore] = useState(false);

  if (!user) return null;

  const filteredNav = ALL_NAV_ITEMS.filter(item => !user.role || item.roles.includes(user.role));
  
  // Define primary nav items based on role
  let primaryNavPaths: string[] = [];
  
  if (user.role === 'super_admin' || user.role === 'admin') {
    primaryNavPaths = ['/dashboard', '/loans', '/users', '/reports'];
  } else if (user.role === 'manager') {
    primaryNavPaths = ['/dashboard', '/leads-list', '/loans', '/reports'];
  } else if (user.role === 'broker') {
    primaryNavPaths = ['/dashboard', '/leads-list', '/loans', '/commission'];
  } else if (user.role === 'bank') {
    primaryNavPaths = ['/dashboard', '/loans', '/loans/new'];
  } else if (user.role === 'accountant') {
    primaryNavPaths = ['/dashboard', '/account/receivables', '/account/payables'];
  } else {
    // employee and others
    primaryNavPaths = ['/dashboard', '/leads-list', '/loans', '/loans/new'];
  }

  // Ensure moreNav only contains items NOT present in the primaryNav
  const primaryNav = filteredNav.filter(item => primaryNavPaths.includes(item.path));
  
  // Create an array of the actual rendered primary paths to make sure we filter correctly
  const renderedPrimaryPaths = primaryNav.map(item => item.path);
  const moreNav = filteredNav.filter(item => !renderedPrimaryPaths.includes(item.path));

  return (
    <>
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 glass-panel border-t border-border z-40 safe-area-bottom">
        <div className="flex items-center justify-around px-1 py-2">
          {primaryNav.map(item => {
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors min-w-0 flex-1 ${active
                  ? 'text-accent'
                  : 'text-muted-foreground hover:text-foreground'
                  }`}
              >
                <span className={active ? 'scale-110' : ''}>{item.icon}</span>
                <span className="text-[10px] font-medium text-center">{item.label}</span>
              </Link>
            );
          })}
          {moreNav.length > 0 && (
            <button
              onClick={() => setShowMore(true)}
              className="flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors min-w-0 flex-1 text-muted-foreground hover:text-foreground"
            >
              <MoreHorizontal size={20} />
              <span className="text-[10px] font-medium text-center">More</span>
            </button>
          )}
        </div>
      </nav>

      {/* More Menu Popup */}
      {showMore && (
        <>
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 lg:hidden" onClick={() => setShowMore(false)} />
          <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden animate-in slide-in-from-bottom duration-300">
            <div className="glass-panel rounded-t-[2.5rem] border-t border-white/20 dark:border-white/10 shadow-2xl max-h-[70vh] overflow-y-auto backdrop-blur-lg">
              <div className="sticky top-0 glass-panel border-b border-border px-6 py-4 flex items-center justify-between">
                <h3 className="text-lg font-bold text-foreground">More Options</h3>
                <button
                  onClick={() => setShowMore(false)}
                  className="p-2 rounded-full hover:bg-muted transition-colors"
                >
                  <X size={20} className="text-muted-foreground" />
                </button>
              </div>
              <div className="p-4 space-y-2">
                {moreNav.map(item => {
                  const active = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setShowMore(false)}
                      className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all ${
                        active
                          ? 'bg-accent text-accent-foreground shadow-md'
                          : 'text-foreground active:bg-muted'
                      }`}
                    >
                      <span className={active ? 'scale-110' : ''}>{item.icon}</span>
                      <span className="text-sm font-medium">{item.label}</span>
                      {active && <div className="ml-auto w-2 h-2 bg-accent-foreground rounded-full" />}
                    </Link>
                  );
                })}
              </div>
              <div className="h-4" />
            </div>
          </div>
        </>
      )}
    </>
  );
}
