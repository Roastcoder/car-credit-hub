import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { DEMO_ACCOUNTS, ROLE_LABELS } from '@/lib/auth';
import { ArrowRight, Mail, Lock, ChevronDown, ChevronUp, Shield, BarChart3, Users, Zap, Download } from 'lucide-react';
import logo from '@/assets/logo.png';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showDemoUsers, setShowDemoUsers] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  React.useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) { setError('Please enter your email'); return; }
    if (!password) { setError('Please enter your password'); return; }
    setLoading(true);
    setError('');
    const { error: err } = await login(email, password);
    setLoading(false);
    if (err) {
      setError('Invalid email or password. Use the demo accounts below.');
    } else {
      navigate('/dashboard');
    }
  };

  const handleDemoSelect = (demoEmail: string, demoPassword: string) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setError('');
    setShowDemoUsers(false);
  };

  return (
    <div className="min-h-screen bg-primary flex">
      {/* Left branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12">
        <div className="flex items-center gap-4">
          <div className="bg-white rounded-xl p-3 shadow-lg">
            <img src={logo} alt="Mehar Finance" className="h-14 w-auto object-contain" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-primary-foreground">Mehar Finance</h2>
            <p className="text-primary-foreground/60 text-sm">Car Loan Solutions</p>
          </div>
        </div>
        <div>
          <h1 className="text-5xl font-bold text-primary-foreground leading-tight mb-6">
            Car Loan Sales<br />& Management Portal
          </h1>
          <div className="space-y-4 max-w-md">
            {[
              { icon: <Shield size={20} />, title: 'Secure Role-Based Access', desc: 'Multi-level permissions for admins, managers, brokers, and employees' },
              { icon: <BarChart3 size={20} />, title: 'Real-Time Analytics', desc: 'Track loan applications, commissions, and performance metrics' },
              { icon: <Users size={20} />, title: 'Multi-Party Management', desc: 'Manage banks, NBFCs, brokers, and customers in one place' },
              { icon: <Zap size={20} />, title: 'Streamlined Workflow', desc: 'From application to disbursement with document tracking' },
            ].map(f => (
              <div key={f.title} className="flex items-start gap-3">
                <div className="bg-primary-foreground/10 rounded-lg p-2 mt-1">{React.cloneElement(f.icon, { className: 'text-primary-foreground' })}</div>
                <div>
                  <h3 className="text-primary-foreground font-semibold mb-1">{f.title}</h3>
                  <p className="text-primary-foreground/60 text-sm">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <p className="text-primary-foreground/30 text-sm">© 2025 Mehar Finance. All rights reserved.</p>
      </div>

      {/* Right login */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-md bg-card rounded-2xl shadow-2xl p-6 sm:p-8">
          {/* Mobile logo */}
          <div className="lg:hidden flex flex-col items-center mb-6 sm:mb-8">
            <div className="bg-white rounded-xl p-2.5 sm:p-3 shadow-lg mb-2 sm:mb-3">
              <img src={logo} alt="Mehar Finance" className="h-10 sm:h-12 w-auto object-contain" />
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-foreground">Mehar Finance</h2>
            <p className="text-xs text-muted-foreground">Car Loan Portal</p>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-1">Welcome back</h2>
          <p className="text-sm text-muted-foreground mb-4 sm:mb-6">Sign in to your account</p>

          {deferredPrompt && (
            <button
              onClick={handleInstall}
              className="w-full flex items-center justify-center gap-2 bg-green-600 text-white font-semibold py-2.5 px-4 rounded-xl hover:bg-green-700 transition-colors text-sm mb-4"
            >
              <Download size={16} />
              Install App
            </button>
          )}

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm font-medium">{error}</div>
          )}

          <form onSubmit={handleLogin} className="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(''); }}
                  placeholder="Enter your email"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border-2 border-border bg-background text-foreground text-sm focus:outline-none focus:border-accent transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(''); }}
                  placeholder="Enter your password"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border-2 border-border bg-background text-foreground text-sm focus:outline-none focus:border-accent transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-accent text-accent-foreground font-semibold py-2.5 sm:py-3 px-4 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-60 text-sm sm:text-base"
            >
              {loading ? 'Signing in…' : 'Sign In'}
              {!loading && <ArrowRight size={18} />}
            </button>
          </form>

          {/* Demo users collapsible dropdown */}
          <div className="border-t border-border pt-3 sm:pt-4">
            <button
              onClick={() => setShowDemoUsers(!showDemoUsers)}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-sm"
            >
              <span className="text-muted-foreground font-medium">Quick Login — Demo Users</span>
              {showDemoUsers ? <ChevronUp size={16} className="text-muted-foreground" /> : <ChevronDown size={16} className="text-muted-foreground" />}
            </button>

            {showDemoUsers && (
              <div className="mt-2 space-y-1 bg-card border border-border rounded-xl p-2 shadow-md z-10 max-h-64 overflow-y-auto">
                {DEMO_ACCOUNTS.map(u => (
                  <button
                    key={u.email}
                    onClick={() => handleDemoSelect(u.email, u.password)}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-all text-sm hover:bg-muted/60"
                  >
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 bg-accent/10 text-accent">
                      {u.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground text-xs truncate">{u.name}</p>
                      <p className="text-[10px] text-muted-foreground">{ROLE_LABELS[u.role]}</p>
                    </div>
                    <span className="text-[10px] text-muted-foreground mono truncate">{u.email}</span>
                  </button>
                ))}
                <p className="text-[10px] text-muted-foreground text-center pt-1 pb-0.5">Password for all: Demo@1234</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
