import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Capacitor } from '@capacitor/core';
import { biometricAuth } from '@/lib/biometric';
import { ArrowRight, Mail, Lock, Download, Eye, EyeOff, Fingerprint, ArrowLeft, Shield, Zap, Globe, Smartphone, Monitor, CheckCircle2 } from 'lucide-react';
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
  const [isElectron, setIsElectron] = useState(false);

  // Forgot password states
  const [view, setView] = useState<'login' | 'forgot'>('login');
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotPhone, setForgotPhone] = useState('');
  const [forgotOTP, setForgotOTP] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotStep, setForgotStep] = useState<'email' | 'otp' | 'password'>('email');
  const [forgotLoading, setForgotLoading] = useState(false);

  useEffect(() => {
    const checkEnvironment = async () => {
      const native = Capacitor.isNativePlatform();
      setIsNative(native);
      
      const electron = navigator.userAgent.toLowerCase().includes('electron');
      setIsElectron(electron);

      const standalone = window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone ||
        document.referrer.includes('android-app://') ||
        native || electron;
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

  const openForgot = () => {
    setForgotEmail(email && email.includes('@') ? email : '');
    setForgotPhone('');
    setForgotStep('email');
    setForgotOTP('');
    setForgotNewPassword('');
    setView('forgot');
  };

  const handleSendOTP = async () => {
    if (!forgotEmail.includes('@')) { toast.error('Enter a valid email address'); return; }
    setForgotLoading(true);
    try {
      // Step 1: get phone from email
      const phoneRes = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/auth/get-phone-by-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail })
      });
      const phoneData = await phoneRes.json();
      if (!phoneRes.ok) {
        toast.error(phoneData.error || 'No account found with this email');
        return;
      }
      const phone = phoneData.phone;
      setForgotPhone(phone);

      // Step 2: send OTP to that phone
      const otpRes = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/auth/forgot-password/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone })
      });
      const otpData = await otpRes.json();
      if (otpRes.ok) {
        setForgotStep('otp');
        toast.success('OTP sent to your registered mobile number!');
      } else {
        toast.error(otpData.error || 'Failed to send OTP');
      }
    } catch (_) {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (forgotOTP.length !== 6) { toast.error('Enter a valid 6-digit OTP'); return; }
    setForgotLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/auth/forgot-password/check-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: forgotPhone, otp: forgotOTP })
      });
      const data = await res.json();
      if (res.ok && data.valid) {
        setForgotStep('password');
      } else {
        toast.error(data.error || 'Invalid or expired OTP');
      }
    } catch (_) {
      toast.error('Failed to verify OTP');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (forgotNewPassword.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    setForgotLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/auth/forgot-password/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: forgotPhone, otp: forgotOTP, newPassword: forgotNewPassword })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('Password reset successfully! Please login.');
        setView('login');
        setForgotEmail('');
        setForgotPhone('');
        setForgotOTP('');
        setForgotNewPassword('');
        setForgotStep('email');
      } else {
        toast.error(data.error || 'Failed to reset password');
      }
    } catch (_) {
      toast.error('Failed to reset password');
    } finally {
      setForgotLoading(false);
    }
  };

  // ── Shared Forgot Password UI ──
  const renderForgotPassword = (rounded = 'rounded-2xl') => (
    <div className="space-y-4">
      <button
        type="button"
        onClick={() => setView('login')}
        className="flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 font-medium hover:underline mb-2"
      >
        <ArrowLeft size={15} /> Back to Login
      </button>

      <div>
        <h2 className="text-xl font-bold text-foreground">Reset Password</h2>
        <p className="text-sm text-muted-foreground mt-1">
          {forgotStep === 'email' && 'Enter your registered email address'}
          {forgotStep === 'otp' && `OTP sent to your mobile ******${forgotPhone.slice(-3)}`}
          {forgotStep === 'password' && 'Set your new password'}
        </p>
      </div>

      {forgotStep === 'email' && (
        <>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Email Address</label>
            <input
              type="email"
              value={forgotEmail}
              onChange={(e) => setForgotEmail(e.target.value)}
              placeholder="Enter your registered email"
              className={`w-full px-4 py-3 ${rounded} border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all`}
            />
          </div>
          <button
            onClick={handleSendOTP}
            disabled={forgotLoading || !forgotEmail.includes('@')}
            className={`w-full py-3 bg-accent text-accent-foreground ${rounded} font-semibold hover:opacity-90 transition-opacity disabled:opacity-50`}
          >
            {forgotLoading ? 'Sending OTP...' : 'Send OTP'}
          </button>
        </>
      )}

      {forgotStep === 'otp' && (
        <>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Enter OTP</label>
            <input
              type="text"
              maxLength={6}
              value={forgotOTP}
              onChange={(e) => setForgotOTP(e.target.value.replace(/\D/g, ''))}
              placeholder="Enter 6-digit OTP"
              className={`w-full px-4 py-3 ${rounded} border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all`}
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleSendOTP}
              disabled={forgotLoading}
              className={`flex-1 py-3 border border-border ${rounded} font-semibold hover:bg-muted transition-colors`}
            >
              Resend OTP
            </button>
            <button
              onClick={handleVerifyOTP}
              disabled={forgotLoading || forgotOTP.length !== 6}
              className={`flex-1 py-3 bg-accent text-accent-foreground ${rounded} font-semibold hover:opacity-90 transition-opacity disabled:opacity-50`}
            >
              {forgotLoading ? 'Verifying...' : 'Verify OTP'}
            </button>
          </div>
        </>
      )}

      {forgotStep === 'password' && (
        <>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">New Password</label>
            <input
              type="password"
              value={forgotNewPassword}
              onChange={(e) => setForgotNewPassword(e.target.value)}
              placeholder="Enter new password (min 6 characters)"
              className={`w-full px-4 py-3 ${rounded} border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all`}
            />
          </div>
          <button
            onClick={handleResetPassword}
            disabled={forgotLoading || forgotNewPassword.length < 6}
            className={`w-full py-3 bg-accent text-accent-foreground ${rounded} font-semibold hover:opacity-90 transition-opacity disabled:opacity-50`}
          >
            {forgotLoading ? 'Updating...' : 'Update Password'}
          </button>
        </>
      )}
    </div>
  );

  // ──── RENDER: NATIVE APP UI ────
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
            {view === 'login' ? (
              <>
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
                    <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-500 dark:text-blue-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setError(''); }}
                      placeholder="Email Address"
                      className="w-full pl-12 pr-4 py-4 rounded-2xl border border-border bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all font-medium"
                    />
                  </div>

                  <div className="relative group">
                    <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-500 dark:text-blue-400" />
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
                    <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 font-bold py-4 px-6 rounded-2xl text-white bg-accent shadow-xl hover:shadow-2xl transition-all active:scale-95 border border-transparent">
                      {loading ? (
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Authenticating…
                        </div>
                      ) : (<>Sign In <ArrowRight size={20} /></>)}
                    </button>

                    {isBiometricAvailable && (
                      <button type="button" onClick={handleBiometricLogin} className="w-full flex items-center justify-center gap-3 font-bold py-4 px-6 rounded-2xl text-blue-600 dark:text-blue-400 border-2 border-blue-100/50 dark:border-white/10 hover:bg-white/40 dark:hover:bg-white/5 transition-all active:scale-95 backdrop-blur-md shadow-md hover:shadow-lg">
                        <Fingerprint size={28} className="animate-pulse" />
                        Biometric Unlock
                      </button>
                    )}
                  </div>
                </form>

                <button type="button" onClick={openForgot} className="w-full text-sm text-blue-600 dark:text-blue-400 font-medium hover:underline text-center mt-5">
                  Forgot Password?
                </button>
              </>
            ) : (
              renderForgotPassword('rounded-2xl')
            )}

            <div className="mt-8 pt-6 border-t border-gray-200/50 dark:border-gray-700/50 text-center">
              <p className="text-sm text-blue-700 dark:text-blue-400 font-medium">
                Don't have an account?{' '}
                <a href="/signup" className="text-blue-700 dark:text-blue-400 font-bold hover:underline underline-offset-2">Sign Up</a>
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
      </div>
    );
  }

  // ──── RENDER: STANDARD WEB UI ────
  const showFeaturePanel = !isNative && !isElectron;

  return (
    <div className="min-h-screen flex bg-white dark:bg-slate-950 font-sans">
      {showFeaturePanel && (
        <div className="hidden lg:flex lg:w-1/2 flex-col justify-center items-center p-12 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white relative overflow-hidden border-r border-slate-200 dark:border-slate-800">
          {/* Decorative elements */}
          <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500/5 rounded-full blur-[100px] -ml-44 -mt-44" />
          <div className="absolute bottom-0 right-0 w-80 h-80 bg-indigo-500/5 rounded-full blur-[80px] -mr-32 -mb-32" />
          
          <div className="relative z-10 max-w-lg">
            <div className="p-1 mb-10 inline-block">
              <img src={logo} alt="Mehar Finance" className="h-16 w-auto object-contain" />
            </div>
            
            <h1 className="text-4xl font-black mb-4 tracking-tight text-slate-900 dark:text-white">Mehar Finance</h1>
            <p className="text-xl text-blue-600 dark:text-blue-400 mb-12 font-medium opacity-90 italic">Digital Intelligence Suite</p>
            
            <div className="space-y-8 mb-16">
              <div className="flex gap-5 group">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-2xl h-fit group-hover:bg-blue-200 dark:group-hover:bg-blue-800/40 transition-colors">
                  <Monitor className="text-blue-600 dark:text-blue-400" size={24} />
                </div>
                <div>
                  <h4 className="font-bold text-lg text-slate-900 dark:text-white">Desktop Performance</h4>
                  <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">Native applications for Windows & macOS with high-speed processing and offline stability.</p>
                </div>
              </div>
              
              <div className="flex gap-5 group">
                <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-2xl h-fit group-hover:bg-indigo-200 dark:group-hover:bg-indigo-800/40 transition-colors">
                  <Smartphone className="text-indigo-600 dark:text-indigo-400" size={24} />
                </div>
                <div>
                  <h4 className="font-bold text-lg text-slate-900 dark:text-white">Mobile Accessibility</h4>
                  <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">Android application optimized for field staff and real-time application tracking.</p>
                </div>
              </div>

              <div className="flex gap-5 group">
                <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-2xl h-fit group-hover:bg-green-200 dark:group-hover:bg-green-800/40 transition-colors">
                  <Shield className="text-green-600 dark:text-green-400" size={24} />
                </div>
                <div>
                  <h4 className="font-bold text-lg text-slate-900 dark:text-white">Enterprise Security</h4>
                  <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">End-to-end data encryption with biometric authentication for all native platforms.</p>
                </div>
              </div>
            </div>

            <div className="p-8 bg-blue-600 rounded-[2.5rem] border border-blue-500 shadow-xl text-white">
               <div className="flex items-center justify-between gap-4">
                  <div className="flex -space-x-3">
                     <div className="w-10 h-10 rounded-full bg-blue-500 border-2 border-white flex items-center justify-center shadow-lg"><Monitor size={16} /></div>
                     <div className="w-10 h-10 rounded-full bg-indigo-500 border-2 border-white flex items-center justify-center shadow-lg"><Smartphone size={16} /></div>
                     <div className="w-10 h-10 rounded-full bg-slate-700 border-2 border-white flex items-center justify-center shadow-lg font-bold text-[10px]">WEB</div>
                  </div>
                  <div className="flex-1">
                     <p className="text-xs font-bold text-blue-100 uppercase tracking-widest mb-1">Get the native App</p>
                     <Link to="/download" className="text-sm font-black text-white hover:text-blue-100 flex items-center gap-1 transition-colors">
                        Explore Download Center <ArrowRight size={14} />
                     </Link>
                  </div>
               </div>
            </div>
          </div>
        </div>
      )}

      <div className={`flex-1 flex items-center justify-center p-5 sm:p-8 ${showFeaturePanel ? 'bg-slate-50 dark:bg-slate-900' : 'bg-[#f8fafc] dark:bg-slate-950'}`}>
        <div className="w-full max-w-[420px]">
          <div className={`${showFeaturePanel ? 'lg:hidden' : ''} flex flex-col items-center mb-8`}>
            <div className="glass-card rounded-2xl p-3 shadow-lg mb-3 bg-white border border-slate-100">
              <img src={logo} alt="Mehar Finance" className="h-11 w-auto object-contain" />
            </div>
            <h2 className="text-lg font-bold text-blue-950 dark:text-white">Mehar Finance</h2>
            <p className="text-xs text-blue-700 dark:text-blue-400 font-medium">Digital Intelligence Suite</p>
          </div>

          <div className="bg-card p-7 sm:p-8 shadow-xl rounded-2xl border border-border">
            {view === 'login' ? (
              <>
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
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-blue-500 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-200 transition-colors">
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 font-bold py-3 px-4 rounded-xl text-white text-sm transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 bg-gradient-to-r from-blue-600 to-indigo-600 border border-white/20">
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Signing in…
                      </div>
                    ) : (<>Sign In <ArrowRight size={16} /></>)}
                  </button>

                  <button type="button" onClick={openForgot} className="w-full text-sm text-blue-600 dark:text-blue-400 font-medium hover:underline text-center">
                    Forgot Password?
                  </button>
                </form>
              </>
            ) : (
              renderForgotPassword('rounded-xl')
            )}

            <div className="mt-6 pt-5 border-t border-gray-200/50 dark:border-gray-700/50 text-center">
              <p className="text-sm text-blue-700 dark:text-blue-400 font-medium">
                Don't have an account?{' '}
                <a href="/signup" className="text-blue-700 dark:text-blue-400 font-bold hover:underline underline-offset-2">Sign Up</a>
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
    </div>
  );
}
