import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { DEMO_USERS, ROLE_LABELS } from '@/lib/auth';
import { ArrowRight, Mail, Lock, ChevronDown, ChevronUp, Shield, BarChart3, Users, Zap } from 'lucide-react';
import logo from '@/assets/logo.png';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showDemoUsers, setShowDemoUsers] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) { setError('Please enter your email'); return; }
    if (!password) { setError('Please enter your password'); return; }
    const user = login(email);
    if (user) { navigate('/dashboard'); } else { setError('Invalid email or password'); }
  };

  const handleDemoSelect = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('demo123');
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
            <div className="flex items-start gap-3">
              <div className="bg-primary-foreground/10 rounded-lg p-2 mt-1">
                <Shield className="text-primary-foreground" size={20} />
              </div>
              <div>
                <h3 className="text-primary-foreground font-semibold mb-1">Secure Role-Based Access</h3>
                <p className="text-primary-foreground/60 text-sm">Multi-level permissions for admins, managers, brokers, and employees</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="bg-primary-foreground/10 rounded-lg p-2 mt-1">
                <BarChart3 className="text-primary-foreground" size={20} />
              </div>
              <div>
                <h3 className="text-primary-foreground font-semibold mb-1">Real-Time Analytics</h3>
                <p className="text-primary-foreground/60 text-sm">Track loan applications, commissions, and performance metrics</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="bg-primary-foreground/10 rounded-lg p-2 mt-1">
                <Users className="text-primary-foreground" size={20} />
              </div>
              <div>
                <h3 className="text-primary-foreground font-semibold mb-1">Multi-Party Management</h3>
                <p className="text-primary-foreground/60 text-sm">Manage banks, NBFCs, brokers, and customers in one place</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="bg-primary-foreground/10 rounded-lg p-2 mt-1">
                <Zap className="text-primary-foreground" size={20} />
              </div>
              <div>
                <h3 className="text-primary-foreground font-semibold mb-1">Streamlined Workflow</h3>
                <p className="text-primary-foreground/60 text-sm">From application to disbursement with PDD tracking</p>
              </div>
            </div>
          </div>
        </div>
        <p className="text-primary-foreground/30 text-sm">© 2025 Mehar Finance. All rights reserved.</p>
      </div>

      {/* Right login */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-card rounded-2xl shadow-2xl p-8">
          <div className="lg:hidden flex flex-col items-center mb-8">
            <div className="bg-white rounded-xl p-3 shadow-lg mb-3">
              <img src={logo} alt="Mehar Finance" className="h-12 w-auto object-contain" />
            </div>
            <h2 className="text-xl font-bold text-foreground">Mehar Finance</h2>
          </div>

          <h2 className="text-2xl font-bold text-foreground mb-1">Welcome back</h2>
          <p className="text-muted-foreground mb-6">Sign in to your account</p>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm font-medium">{error}</div>
          )}

          <form onSubmit={handleLogin} className="space-y-4 mb-6">
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
              className="w-full flex items-center justify-center gap-2 bg-accent text-accent-foreground font-semibold py-3 px-4 rounded-xl hover:opacity-90 transition-opacity"
            >
              Sign In
              <ArrowRight size={18} />
            </button>
          </form>

          {/* Demo users collapsible dropdown */}
          <div className="border-t border-border pt-4">
            <button
              onClick={() => setShowDemoUsers(!showDemoUsers)}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-sm"
            >
              <span className="text-muted-foreground font-medium">Quick Login — Demo Users</span>
              {showDemoUsers ? <ChevronUp size={16} className="text-muted-foreground" /> : <ChevronDown size={16} className="text-muted-foreground" />}
            </button>

            {showDemoUsers && (
              <div className="mt-2 space-y-1 bg-card border border-border rounded-xl p-2 shadow-md z-10">
                {DEMO_USERS.map(u => (
                  <button
                    key={u.id}
                    onClick={() => handleDemoSelect(u.email)}
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
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
