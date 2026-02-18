import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { DEMO_USERS, ROLE_LABELS } from '@/lib/auth';
import { ArrowRight } from 'lucide-react';
import logo from '@/assets/logo.png';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [selectedEmail, setSelectedEmail] = useState('');
  const [error, setError] = useState('');

  const handleLogin = () => {
    if (!selectedEmail) {
      setError('Please select a role to continue');
      return;
    }
    const user = login(selectedEmail);
    if (user) {
      navigate('/dashboard');
    } else {
      setError('Invalid credentials');
    }
  };

  return (
    <div className="min-h-screen bg-primary flex">
      {/* Left branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12">
        <div>
          <img src={logo} alt="Mehar Finance" className="h-16 w-auto object-contain" />
        </div>
        <div>
          <h1 className="text-5xl font-bold text-primary-foreground leading-tight mb-4">
            Car Loan Sales<br />& Management Portal
          </h1>
          <p className="text-primary-foreground/60 text-lg max-w-md">
            Streamline your car loan operations with role-based access, real-time tracking, and comprehensive reporting.
          </p>
        </div>
        <p className="text-primary-foreground/30 text-sm">© 2025 Mehar Finance. All rights reserved.</p>
      </div>

      {/* Right login */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-card rounded-2xl shadow-2xl p-8">
          <div className="lg:hidden flex items-center justify-center mb-8">
            <img src={logo} alt="Mehar Finance" className="h-14 w-auto object-contain" />
          </div>

          <h2 className="text-2xl font-bold text-foreground mb-1">Welcome back</h2>
          <p className="text-muted-foreground mb-6">Select a role to login as a demo user</p>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm font-medium">{error}</div>
          )}

          <div className="space-y-2 mb-6">
            {DEMO_USERS.map(u => (
              <button
                key={u.id}
                onClick={() => { setSelectedEmail(u.email); setError(''); }}
                className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${
                  selectedEmail === u.email
                    ? 'border-accent bg-accent/5'
                    : 'border-border hover:border-accent/40'
                }`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                  selectedEmail === u.email ? 'bg-accent text-accent-foreground' : 'bg-muted text-muted-foreground'
                }`}>
                  {u.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground text-sm">{u.name}</p>
                  <p className="text-xs text-muted-foreground">{ROLE_LABELS[u.role]}</p>
                </div>
                {selectedEmail === u.email && (
                  <div className="w-5 h-5 rounded-full bg-accent flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-accent-foreground" />
                  </div>
                )}
              </button>
            ))}
          </div>

          <button
            onClick={handleLogin}
            className="w-full flex items-center justify-center gap-2 bg-accent text-accent-foreground font-semibold py-3 px-4 rounded-xl hover:opacity-90 transition-opacity"
          >
            Continue to Dashboard
            <ArrowRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
