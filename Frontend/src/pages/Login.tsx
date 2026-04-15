import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Capacitor } from '@capacitor/core';
import { biometricAuth } from '@/lib/biometric';
import { ArrowRight, Mail, Lock, Download, Eye, EyeOff, Fingerprint, X } from 'lucide-react';
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
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordPhone, setForgotPasswordPhone] = useState('');
  const [forgotPasswordOTP, setForgotPasswordOTP] = useState('');
  const [forgotPasswordNewPassword, setForgotPasswordNewPassword] = useState('');
  const [forgotPasswordStep, setForgotPasswordStep] = useState<'phone' | 'otp'>('phone');
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);

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

  const handleForgotPasswordSendOTP = async () => {
    if (!forgotPasswordPhone || forgotPasswordPhone.length !== 10) {
      toast.error('Please enter a valid 10-digit mobile number');
      return;
    }

    setForgotPasswordLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/auth/forgot-password/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: forgotPasswordPhone })
      });

      const data = await response.json();

      if (response.ok) {
        setForgotPasswordStep('otp');
        toast.success('OTP sent to your mobile number');
      } else {
        toast.error(data.error || 'Failed to send OTP');
      }
    } catch (error) {
      toast.error('Failed to send OTP');
    } finally {
      setForgotPasswordLoading(false);
    }
  };

  const handleForgotPasswordVerifyOTP = async () => {
    if (!forgotPasswordOTP || forgotPasswordOTP.length !== 6) {
      toast.error('Please enter a valid 6-digit OTP');
      return;
    }

    if (!forgotPasswordNewPassword || forgotPasswordNewPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setForgotPasswordLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/auth/forgot-password/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: forgotPasswordPhone,
          otp: forgotPasswordOTP,
          newPassword: forgotPasswordNewPassword
        })
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Password reset successfully! Please login.');
        setShowForgotPassword(false);
        setForgotPasswordPhone('');
        setForgotPasswordOTP('');
        setForgotPasswordNewPassword('');
        setForgotPasswordStep('phone');
      } else {
        toast.error(data.error || 'Failed to reset password');
      }
    } catch (error) {
      toast.error('Failed to reset password');
    } finally {
      setForgotPasswordLoading(false);
    }
  };

  // ──── RENDER: NATIVE APP UI (Premium Immersive) ────
  if (isNative) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800 font-sans overflow-hidden relative p-6">
        <div className="absolute top-[-10%] right-[-10%] w-[70%] h-[70%] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none animate-pulse" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[70%] h-[70%] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none animate-pulse" style={{ animationDelay: '2s' }} />

        <div className="w-full max-w-[420px] z-10">
          <div className="flex flex-col items-center mb-10 text-center">
            <div className="bg-card rounded-[2.5rem] p-5 shadow-2xl mb-6 border border-border">
              <img src={logo} alt="Mehar Finance" className="h-14 w-auto object-contain" />
            </div>
            <h1 className="text-3xl font-bold text-blue-950 dark:text-white tracking-tight drop-shadow-sm">Mehar Finance</h1>
            <p className="text-sm text-blue-700 dark:text-blue-300 mt-1 font-medium italic">Premium Car Loan Portal</p>
          </div>

          <div className="bg-card p-8 rounded-[2.5rem] shadow-2xl border border-border">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-blue-950 dark:text-white tracking-tight">Welcome Back</h2>
              <p className="text-sm text-blue-700 dark:text-blue-300 mt-1 font-medium">Quick sign in with biometrics</p>
            </div>

            {error && (
              <div className="mb-6 p-4 rounded-2xl bg-red-50/80 dark:bg-red-950/30 border border-red-100 dark:border-red-900/30 text-red-700 dark:text-red-400 text-xs font-bold shadow-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-5">
              <div className="relative group">
                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-500 dark:text-blue-400 group-focus-within:text-blue-600 transition-colors" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(''); }}
                  placeholder="Email Address"
                  className="w-full pl-12 pr-4 py-4 rounded-2xl border border-border bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all font-medium"
                />
              </div>

              <div className="relative group">
                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-500 dark:text-blue-400 group-focus-within:text-blue-600 transition-colors" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(''); }}
                  placeholder="Password"
                  className="w-full pl-12 pr-12 py-4 rounded-2xl border border-border bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all font-medium"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-blue-500 dark:text-blue-400 hover:text-blue-900 transition-colors">
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              <div className="flex flex-col gap-4 pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 font-bold py-4 px-6 rounded-2xl text-white bg-accent shadow-xl hover:shadow-2xl transition-all active:scale-95 border border-transparent"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Authenticating…
                    </div>
                  ) : (
                    <>
                      Sign In
                      <ArrowRight size={20} />
                    </>
                  )}
                </button>

                {isBiometricAvailable && (
                  <button
                    type="button"
                    onClick={handleBiometricLogin}
                    className="w-full flex items-center justify-center gap-3 font-bold py-4 px-6 rounded-2xl text-blue-600 dark:text-blue-400 border-2 border-blue-100/50 dark:border-white/10 hover:bg-white/40 dark:hover:bg-white/5 transition-all active:scale-95 backdrop-blur-md shadow-md hover:shadow-lg"
                  >
                    <Fingerprint size={28} className="animate-pulse" />
                    Biometric Unlock
                  </button>
                )}
              </div>
            </form>

            <button
              type="button"
              onClick={() => setShowForgotPassword(true)}
              className="text-sm text-blue-600 dark:text-blue-400 font-medium hover:underline text-center mt-4"
            >
              Forgot Password?
            </button>

            <div className="mt-8 pt-6 border-t border-gray-200/50 dark:border-gray-700/50 text-center">
              <p className="text-sm text-blue-700 dark:text-blue-400 font-medium">
                Don't have an account?{' '}
                <a href="/signup" className="text-blue-700 dark:text-blue-400 font-bold hover:underline underline-offset-2">
                  Sign Up
                </a>
              </p>
              <div className="mt-4 flex justify-center gap-4 text-[10px] text-blue-500/70 dark:text-blue-400/50 font-semibold uppercase tracking-widest">
                <Link to="/privacy" className="hover:text-blue-700 dark:hover:text-blue-300 transition-colors">Privacy Policy</Link>
                <span>•</span>
                <Link to="/terms" className="hover:text-blue-700 dark:hover:text-blue-300 transition-colors">Terms of Service</Link>
              </div>
            </div>
          </div>

          <p className="text-center text-xs text-blue-500 dark:text-slate-400 mt-6 font-medium drop-shadow-sm">
            Secured with end-to-end encryption
          </p>
        </div>

        {/* Forgot Password Modal */}
        {showForgotPassword && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/70 backdrop-blur-sm">
            <div className="bg-card border border-border rounded-3xl shadow-2xl max-w-md w-full p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-foreground">Reset Password</h3>
                <button
                  onClick={() => {
                    setShowForgotPassword(false);
                    setForgotPasswordPhone('');
                    setForgotPasswordOTP('');
                    setForgotPasswordNewPassword('');
                    setForgotPasswordStep('phone');
                  }}
                  className="p-2 hover:bg-muted rounded-full transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              {forgotPasswordStep === 'phone' && (
                <div className="space-y-5">
                  <p className="text-sm text-muted-foreground">Enter your registered mobile number to receive an OTP</p>
                  <div>
                    <label className="block text-sm font-bold text-foreground mb-2">Mobile Number</label>
                    <input
                      type="tel"
                      maxLength={10}
                      value={forgotPasswordPhone}
                      onChange={(e) => setForgotPasswordPhone(e.target.value.replace(/\D/g, ''))}
                      placeholder="Enter 10-digit mobile number"
                      className="w-full px-4 py-4 rounded-2xl border border-border bg-background text-foreground focus:ring-2 focus:ring-accent/50 transition-all"
                    />
                  </div>
                  <button
                    onClick={handleForgotPasswordSendOTP}
                    disabled={forgotPasswordLoading || forgotPasswordPhone.length !== 10}
                    className="w-full py-4 bg-accent text-accent-foreground rounded-2xl font-bold hover:opacity-90 transition-opacity disabled:opacity-50 shadow-xl"
                  >
                    {forgotPasswordLoading ? 'Sending OTP...' : 'Send OTP'}
                  </button>
                </div>
              )}

              {forgotPasswordStep === 'otp' && (
                <div className="space-y-5">
                  <p className="text-sm text-muted-foreground">OTP sent to ******{forgotPasswordPhone.slice(-3)}</p>
                  <div>
                    <label className="block text-sm font-bold text-foreground mb-2">Enter OTP</label>
                    <input
                      type="text"
                      maxLength={6}
                      value={forgotPasswordOTP}
                      onChange={(e) => setForgotPasswordOTP(e.target.value.replace(/\D/g, ''))}
                      placeholder="Enter 6-digit OTP"
                      className="w-full px-4 py-4 rounded-2xl border border-border bg-background text-foreground focus:ring-2 focus:ring-accent/50 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-foreground mb-2">New Password</label>
                    <input
                      type="password"
                      value={forgotPasswordNewPassword}
                      onChange={(e) => setForgotPasswordNewPassword(e.target.value)}
                      placeholder="Enter new password (min 6 characters)"
                      className="w-full px-4 py-4 rounded-2xl border border-border bg-background text-foreground focus:ring-2 focus:ring-accent/50 transition-all"
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={handleForgotPasswordSendOTP}
                      disabled={forgotPasswordLoading}
                      className="flex-1 py-4 border-2 border-border rounded-2xl font-bold hover:bg-muted transition-colors"
                    >
                      Resend OTP
                    </button>
                    <button
                      onClick={handleForgotPasswordVerifyOTP}
                      disabled={forgotPasswordLoading || forgotPasswordOTP.length !== 6 || forgotPasswordNewPassword.length < 6}
                      className="flex-1 py-4 bg-accent text-accent-foreground rounded-2xl font-bold hover:opacity-90 transition-opacity disabled:opacity-50 shadow-xl"
                    >
                      {forgotPasswordLoading ? 'Resetting...' : 'Reset Password'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ──── RENDER: STANDARD WEB UI (Split Panel / Web Design) ────
  return (
    <div className="min-h-screen flex bg-transparent font-sans">
      {/* ─── LEFT PANEL ─── */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-center items-center p-12 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800">
        <div className="text-center max-w-md">
          <img src={logo} alt="Mehar Finance" className="h-20 w-auto object-contain mx-auto mb-6 drop-shadow-lg" />
          <h1 className="text-3xl font-bold text-blue-950 dark:text-white mb-4">Mehar Finance</h1>
          <p className="text-lg text-blue-700 dark:text-blue-300 mb-6 font-medium">Car Loan Portal</p>
          <p className="text-sm text-blue-600 dark:text-blue-400 leading-relaxed text-center">
            Your professional gateway to digital financing. 
            Access your dashboard and manage applications with ease.
          </p>
        </div>
      </div>

      {/* ─── RIGHT PANEL ─── */}
      <div className="flex-1 flex items-center justify-center p-5 sm:p-8 bg-transparent">
        <div className="w-full max-w-[420px]">
          {/* Mobile header */}
          <div className="lg:hidden flex flex-col items-center mb-8">
            <div className="glass-card rounded-2xl p-3 shadow-lg mb-3">
              <img src={logo} alt="Mehar Finance" className="h-11 w-auto object-contain" />
            </div>
            <h2 className="text-lg font-bold text-blue-950 dark:text-white">Mehar Finance</h2>
            <p className="text-xs text-blue-700 dark:text-blue-400 font-medium">Car Loan Portal</p>
          </div>

          {/* Card */}
          <div className="bg-card p-7 sm:p-8 shadow-xl rounded-2xl border border-border">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-blue-950 dark:text-white tracking-tight drop-shadow-sm">Sign In</h2>
              <p className="text-sm text-blue-700 dark:text-blue-300 mt-1 font-medium">Enter your credentials to continue</p>
            </div>

            {!isStandalone && (
              <a href="/CarCreditHub.apk" download className="lg:hidden w-full flex items-center justify-center gap-2 bg-blue-950 dark:bg-blue-900 text-white py-3 rounded-xl font-bold text-xs mb-6 hover:bg-blue-900 transition-colors shadow-md">
                <Download size={16} /> Download Mobile App
              </a>
            )}

            {error && (
              <div className="mb-6 p-4 rounded-xl bg-red-50/80 dark:bg-red-950/30 border border-red-100 dark:border-red-900/30 text-red-700 dark:text-red-400 text-xs font-bold shadow-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-blue-900 dark:text-blue-200 mb-1.5 drop-shadow-sm">Email Address</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-blue-500 dark:text-blue-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError(''); }}
                    placeholder="Enter your email"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-blue-900 dark:text-blue-200 mb-1.5 drop-shadow-sm">Password</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-blue-500 dark:text-blue-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(''); }}
                    placeholder="Enter your password"
                    className="w-full pl-10 pr-11 py-3 rounded-xl border border-border bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-blue-500 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-200 transition-colors"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 font-bold py-3 px-4 rounded-xl text-white text-sm transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 bg-gradient-to-r from-blue-600 to-indigo-600 border border-white/20"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Signing in…
                  </div>
                ) : (
                  <>
                    Sign In
                    <ArrowRight size={16} />
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                className="text-sm text-blue-600 dark:text-blue-400 font-medium hover:underline text-center"
              >
                Forgot Password?
              </button>
            </form>

            <div className="mt-6 pt-5 border-t border-gray-200/50 dark:border-gray-700/50 text-center">
              <p className="text-sm text-blue-700 dark:text-blue-400 font-medium">
                Don't have an account?{' '}
                <a href="/signup" className="text-blue-700 dark:text-blue-400 font-bold hover:underline underline-offset-2">
                  Sign Up
                </a>
              </p>
              <div className="mt-4 flex justify-center gap-4 text-[10px] text-blue-500/70 dark:text-blue-400/50 font-semibold uppercase tracking-widest">
                <Link to="/privacy" className="hover:text-blue-700 dark:hover:text-blue-300 transition-colors">Privacy Policy</Link>
                <span>•</span>
                <Link to="/terms" className="hover:text-blue-700 dark:hover:text-blue-300 transition-colors">Terms of Service</Link>
              </div>
            </div>
          </div>
          
          <p className="text-center text-xs text-blue-500 dark:text-slate-400 mt-5 font-medium drop-shadow-sm">
            Secured with end-to-end encryption
          </p>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-foreground">Reset Password</h3>
              <button
                onClick={() => {
                  setShowForgotPassword(false);
                  setForgotPasswordPhone('');
                  setForgotPasswordOTP('');
                  setForgotPasswordNewPassword('');
                  setForgotPasswordStep('phone');
                }}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {forgotPasswordStep === 'phone' && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">Enter your registered mobile number to receive an OTP</p>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Mobile Number</label>
                  <input
                    type="tel"
                    maxLength={10}
                    value={forgotPasswordPhone}
                    onChange={(e) => setForgotPasswordPhone(e.target.value.replace(/\D/g, ''))}
                    placeholder="Enter 10-digit mobile number"
                    className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground focus:ring-2 focus:ring-accent/50 transition-all"
                  />
                </div>
                <button
                  onClick={handleForgotPasswordSendOTP}
                  disabled={forgotPasswordLoading || forgotPasswordPhone.length !== 10}
                  className="w-full py-3 bg-accent text-accent-foreground rounded-xl font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {forgotPasswordLoading ? 'Sending OTP...' : 'Send OTP'}
                </button>
              </div>
            )}

            {forgotPasswordStep === 'otp' && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">OTP sent to ******{forgotPasswordPhone.slice(-3)}</p>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Enter OTP</label>
                  <input
                    type="text"
                    maxLength={6}
                    value={forgotPasswordOTP}
                    onChange={(e) => setForgotPasswordOTP(e.target.value.replace(/\D/g, ''))}
                    placeholder="Enter 6-digit OTP"
                    className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground focus:ring-2 focus:ring-accent/50 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">New Password</label>
                  <input
                    type="password"
                    value={forgotPasswordNewPassword}
                    onChange={(e) => setForgotPasswordNewPassword(e.target.value)}
                    placeholder="Enter new password (min 6 characters)"
                    className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground focus:ring-2 focus:ring-accent/50 transition-all"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleForgotPasswordSendOTP}
                    disabled={forgotPasswordLoading}
                    className="flex-1 py-3 border border-border rounded-xl font-semibold hover:bg-muted transition-colors"
                  >
                    Resend OTP
                  </button>
                  <button
                    onClick={handleForgotPasswordVerifyOTP}
                    disabled={forgotPasswordLoading || forgotPasswordOTP.length !== 6 || forgotPasswordNewPassword.length < 6}
                    className="flex-1 py-3 bg-accent text-accent-foreground rounded-xl font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    {forgotPasswordLoading ? 'Resetting...' : 'Reset Password'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
