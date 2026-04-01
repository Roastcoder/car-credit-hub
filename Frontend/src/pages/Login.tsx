import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Capacitor } from '@capacitor/core';
import { biometricAuth } from '@/lib/biometric';
import { ArrowRight, Mail, Lock, Download, Eye, EyeOff, Fingerprint } from 'lucide-react';
import { toast } from 'sonner';
import logo from '@/assets/logo.png';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isBiometricAvailable, setIsBiometricAvailable] = useState(false);
  const [isNative, setIsNative] = useState(false);

  useEffect(() => {
    const checkEnvironment = async () => {
      const native = Capacitor.isNativePlatform();
      setIsNative(native);
      
      const standalone = window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone ||
        document.referrer.includes('android-app://') ||
        native;
      setIsStandalone(standalone);

      if (native) {
        const result = await biometricAuth.checkAvailability();
        setIsBiometricAvailable(result.isAvailable);
      }
    };
    checkEnvironment();
  }, []);

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!email) { setError('Please enter your email'); return; }
    if (!password) { setError('Please enter your password'); return; }
    setLoading(true);
    setError('');

    try {
      const result = await login(email, password);
      if (result.error) {
        setError('Invalid email or password');
        toast.error('Login failed');
      } else {
        if (isNative && isBiometricAvailable) {
          await biometricAuth.setCredentials(email, password);
        }
        navigate('/dashboard');
        toast.success('Welcome back!');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleBiometricLogin = async () => {
    const authenticated = await biometricAuth.authenticate();
    if (authenticated) {
      const creds = await biometricAuth.getCredentials();
      if (creds) {
        setEmail(creds.username);
        setPassword(creds.password);
        setTimeout(() => handleLogin(), 100);
      } else {
        toast.error('Please login with password once to enable biometrics.');
      }
    }
  };

  // ──── RENDER: NATIVE APP UI (Premium Immersive) ────
  if (isNative) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 font-sans overflow-hidden relative">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="w-full max-w-[420px] z-10 px-6 py-8">
          <div className="flex flex-col items-center mb-10 text-center">
            <div className="w-20 h-20 bg-white dark:bg-slate-900 rounded-3xl shadow-xl flex items-center justify-center mb-6 border border-slate-200 dark:border-slate-800">
              <img src={logo} alt="Mehar Finance" className="h-12 w-auto object-contain" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Mehar Finance</h1>
          </div>

          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl p-8 rounded-[2.5rem] shadow-2xl border border-white/50 dark:border-slate-800/50">
            <div className="mb-8">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Welcome Back</h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Sign in with Face / Fingerprint ID</p>
            </div>

            {error && (
              <div className="mb-6 p-4 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900/30 text-red-700 dark:text-red-400 text-sm font-semibold">
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-5">
              <div className="relative group">
                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(''); }}
                  placeholder="Email Address"
                  className="w-full pl-12 pr-4 py-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>

              <div className="relative group">
                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(''); }}
                  placeholder="Password"
                  className="w-full pl-12 pr-12 py-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              <div className="flex flex-col gap-4 pt-2">
                <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 font-bold py-4 px-6 rounded-2xl text-white bg-blue-600 hover:bg-blue-700 shadow-lg transition-all active:scale-95">
                  {loading ? 'Processing...' : 'Sign In'}
                </button>

                {isBiometricAvailable && (
                  <button type="button" onClick={handleBiometricLogin} className="w-full flex items-center justify-center gap-2 font-bold py-4 px-6 rounded-2xl text-blue-600 border-2 border-blue-50 dark:border-blue-900/30 hover:bg-blue-50 transition-all active:scale-95">
                    <Fingerprint size={24} /> Biometric Unlock
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // ──── RENDER: STANDARD WEB UI (Split Panel / Web Design) ────
  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 font-sans">
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-center items-center p-12 bg-gradient-to-br from-blue-600 to-indigo-800 text-white">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-white/10 backdrop-blur-lg rounded-2xl flex items-center justify-center mb-8 mx-auto border border-white/20">
            <img src={logo} alt="Mehar Finance" className="h-12 w-auto brightness-0 invert" />
          </div>
          <h1 className="text-4xl font-bold mb-4 tracking-tight">Mehar Finance</h1>
          <p className="text-lg text-blue-100 mb-6 font-medium">Professional Car Loan Portal</p>
          <div className="h-1 w-12 bg-white/30 rounded-full mx-auto" />
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-5 sm:p-8">
        <div className="w-full max-w-[420px]">
          <div className="lg:hidden flex flex-col items-center mb-10">
            <img src={logo} alt="Mehar Finance" className="h-14 w-auto mb-3" />
            <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Mehar Finance</h2>
          </div>

          <div className="bg-white dark:bg-slate-900 p-8 sm:p-10 rounded-[2rem] shadow-xl border border-slate-200 dark:border-slate-800">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Sign In</h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Enter your details to continue</p>
            </div>

            {!isStandalone && (
              <a href="/mehar-finance.apk" download className="lg:hidden w-full flex items-center justify-center gap-2 bg-slate-950 text-white py-3 rounded-xl font-bold text-sm mb-6 hover:bg-slate-800 transition-colors">
                <Download size={18} /> Download mobile app
              </a>
            )}

            {error && (
              <div className="mb-6 p-4 rounded-xl bg-red-50 text-red-600 border border-red-100 text-sm font-semibold font-sans">
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="relative">
                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(''); }}
                  placeholder="Email Address"
                  className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div className="relative">
                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(''); }}
                  placeholder="Password"
                  className="w-full pl-12 pr-12 py-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm focus:ring-2 focus:ring-blue-500/20"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 font-bold py-3.5 px-6 rounded-xl text-white bg-blue-600 hover:bg-blue-700 shadow-lg transition-all active:scale-98">
                {loading ? 'Signing in...' : 'Sign In'}
                {!loading && <ArrowRight size={18} />}
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 text-center">
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium font-sans">
                Don't have an account? <a href="/signup" className="text-blue-600 font-bold hover:underline">Sign up</a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
