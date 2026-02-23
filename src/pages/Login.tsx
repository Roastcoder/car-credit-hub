import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { ArrowRight, Mail, Lock, Shield, BarChart3, Users, Zap, Download, Fingerprint } from 'lucide-react';
import { toast } from 'sonner';
import logo from '@/assets/logo.png';
import {
  isBiometricAvailable,
  hasBiometricCredential,
  authenticateBiometric,
  getBiometricEmail,
} from '@/lib/biometric-auth';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricLoading, setBiometricLoading] = useState(false);

  useEffect(() => {
    const standalone = window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone ||
      document.referrer.includes('android-app://');
    setIsStandalone(standalone);

    // Check biometric availability
    (async () => {
      const available = await isBiometricAvailable();
      const hasCredential = hasBiometricCredential();
      setBiometricAvailable(available && hasCredential);
    })();
  }, []);

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
      // Update biometric refresh token if biometrics are enabled
      if (hasBiometricCredential()) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.refresh_token) {
          localStorage.setItem('biometric_session', session.refresh_token);
        }
      }
      navigate('/dashboard');
    }
  };

  const handleBiometricLogin = async () => {
    setBiometricLoading(true);
    setError('');
    try {
      const result = await authenticateBiometric();
      if (!result) {
        setError('Biometric authentication failed. Please login with email/password.');
        setBiometricLoading(false);
        return;
      }

      // Use the stored refresh token to restore the session
      const { error: sessionError } = await supabase.auth.refreshSession({
        refresh_token: result.refreshToken,
      });

      if (sessionError) {
        setError('Session expired. Please login with email/password to re-enable biometrics.');
        setBiometricLoading(false);
        return;
      }

      toast.success('Logged in with fingerprint!');
      navigate('/dashboard');
    } catch (err) {
      setError('Biometric login failed. Please use email/password.');
    } finally {
      setBiometricLoading(false);
    }
  };

  const biometricEmail = getBiometricEmail();

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
          <div className="space-y-4 max-w-md mb-6">
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
          <a
            href="/mehar-finance.apk"
            download
            className="inline-flex items-center gap-2 bg-primary-foreground text-primary font-semibold py-3 px-6 rounded-xl hover:opacity-90 transition-opacity"
          >
            <Download size={20} />
            Download Android App
          </a>
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

          {/* Mobile APK Download - Only show if not installed */}
          {!isStandalone && (
            <a
              href="/mehar-finance.apk"
              download
              className="lg:hidden w-full flex items-center justify-center gap-2 bg-blue-600 text-white font-semibold py-2.5 px-4 rounded-xl hover:bg-blue-700 transition-colors text-sm mb-4"
            >
              <Download size={16} />
              Download Android App
            </a>
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

          {/* Biometric Login Button */}
          {biometricAvailable && (
            <>
              <div className="flex items-center gap-3 my-4">
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs text-muted-foreground">or</span>
                <div className="flex-1 h-px bg-border" />
              </div>
              <button
                onClick={handleBiometricLogin}
                disabled={biometricLoading}
                className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-accent to-accent/80 text-accent-foreground font-semibold py-3.5 px-4 rounded-xl hover:opacity-90 transition-all disabled:opacity-60 shadow-lg"
              >
                <Fingerprint size={22} />
                <div className="text-left">
                  <span className="block text-sm">
                    {biometricLoading ? 'Authenticating...' : 'Login with Fingerprint'}
                  </span>
                  {biometricEmail && (
                    <span className="block text-[10px] opacity-70">{biometricEmail}</span>
                  )}
                </div>
              </button>
            </>
          )}

          <div className="mt-4 text-center">
            <p className="text-sm text-muted-foreground">
              Don't have an account?{' '}
              <a href="/signup" className="text-accent font-medium hover:underline">
                Sign Up
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
