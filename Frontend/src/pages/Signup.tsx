import { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Mail, Lock, User, Building2, Eye, EyeOff, Phone, CheckCircle2, ArrowLeft } from 'lucide-react';
import logo from '@/assets/logo.png';
import { toast } from 'sonner';
import React from 'react';

export default function Signup() {
  const { requestOTP, verifyOTP } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState(1); // 1: Info, 2: OTP
  const [timer, setTimer] = useState(0);
  
  const [searchParams] = useSearchParams();
  const refCode = searchParams.get('ref') || undefined;
  const refName = searchParams.get('name') || undefined;
  const refBranch = searchParams.get('branch') || undefined;

  const [branchId, setBranchId] = useState(refBranch || '');

  const { data: branches = [] } = useQuery({
    queryKey: ['branches-signup'],
    queryFn: async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/branches`);
        if (!response.ok) return [];
        return await response.json();
      } catch {
        return [];
      }
    },
  });

  useEffect(() => {
    let interval: any;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !password || !branchId || !phone) {
      toast.error('Please fill all fields');
      return;
    }
    if (phone.length !== 10) {
      toast.error('Please enter a valid 10-digit mobile number');
      return;
    }
    
    setLoading(true);

    try {
      const result = await requestOTP(phone, 'signup');
      if (result.error) {
        toast.error(result.error);
        setLoading(false);
        return;
      }

      setLoading(false);
      setStep(2);
      setTimer(60);
      toast.success('OTP sent to your mobile number');
    } catch (err: any) {
      setLoading(false);
      toast.error(err.message || 'Failed to send OTP');
    }
  };

  const handleVerifySignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || otp.length < 6) {
      toast.error('Please enter valid 6-digit OTP');
      return;
    }
    setLoading(true);

    try {
      const result = await verifyOTP({ 
        phone, 
        otp, 
        purpose: 'signup',
        name: fullName,
        email,
        password,
        branch_id: branchId,
        referred_by: refCode
      });
      
      if (result.error) {
        toast.error(result.error);
        setLoading(false);
        return;
      }

      setLoading(false);
      toast.success('Account created and verified! Logged in.');
      navigate('/');
    } catch (err: any) {
      setLoading(false);
      toast.error(err.message || 'Failed to verify OTP');
    }
  };

  return (
    <div className="min-h-screen flex bg-transparent font-sans">
      {/* ─── LEFT PANEL ─── */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-center items-center p-12 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800">
        <div className="text-center max-w-md">
          <img src={logo} alt="Mehar Finance" className="h-20 w-auto object-contain mx-auto mb-6 drop-shadow-lg" />
          <h1 className="text-3xl font-bold text-blue-950 dark:text-white mb-4">Mehar Finance</h1>
          <p className="text-lg text-blue-700 dark:text-blue-300 mb-6 font-medium">Car Loan Portal</p>
          <p className="text-sm text-blue-600 dark:text-blue-400 leading-relaxed">
            Join the Mehar Finance team and start managing car loan applications efficiently.
          </p>
        </div>
      </div>

      {/* ─── RIGHT PANEL ─── */}
      <div className="flex-1 flex items-center justify-center p-5 sm:p-8 bg-transparent">
        <div className="w-full max-w-[420px]">
          {/* Card */}
          <div className="bg-card p-7 sm:p-8 shadow-xl relative overflow-hidden rounded-2xl border border-border">
            {/* Step Progress */}
            <div className="flex gap-1 mb-6">
              <div className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${step >= 1 ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'}`} />
              <div className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${step >= 2 ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'}`} />
            </div>

            <div className="mb-6">
              {refCode && (
                <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800/50 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                    {refName ? refName[0].toUpperCase() : 'Ref'}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase tracking-wider font-bold text-blue-600 dark:text-blue-400">Invited By</p>
                    <p className="text-sm font-bold text-blue-900 dark:text-blue-100 truncate">{refName || 'Mehar Finance Partner'}</p>
                  </div>
                </div>
              )}
              <h2 className="text-2xl font-bold text-blue-950 dark:text-white tracking-tight">
                {step === 1 ? (refCode ? 'Partner Signup' : 'Create Account') : 'Verify Mobile'}
              </h2>
              <p className="text-sm text-blue-700 dark:text-blue-300 mt-1 font-medium text-wrap">
                {step === 1 ? (refCode ? 'Join Mehar Finance as a Partner/Broker' : 'Join Mehar Finance team') : `Enter code sent to +91 ${phone}`}
              </p>
            </div>

            {step === 1 ? (
              <form onSubmit={handleSendOTP} className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-blue-900 dark:text-blue-200 mb-1.5">Full Name</label>
                  <div className="relative">
                    <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-blue-500" />
                    <input
                      required
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Enter your full name"
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-blue-900 dark:text-blue-200 mb-1.5">Email Address</label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-blue-500" />
                    <input
                      required
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-blue-900 dark:text-blue-200 mb-1.5">Mobile Number</label>
                  <div className="relative">
                    <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-blue-500" />
                    <input
                      required
                      type="tel"
                      maxLength={10}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                      placeholder="Enter 10 digit mobile"
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-blue-900 dark:text-blue-200 mb-1.5">Password</label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-blue-500" />
                    <input
                      required
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Create password"
                      className="w-full pl-10 pr-11 py-3 rounded-xl border border-border bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all font-medium"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-blue-500">
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-blue-900 dark:text-blue-200 mb-1.5">Branch</label>
                  <div className="relative">
                    <Building2 size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-blue-500" />
                    <select
                      required
                      value={branchId}
                      onChange={(e) => setBranchId(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all font-medium disabled:opacity-75 disabled:cursor-not-allowed"
                    >
                      <option value="">Select branch</option>
                      {branches.map((b: any) => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 flex items-center justify-center gap-2 font-bold rounded-xl text-white transition-all bg-accent shadow-lg hover:shadow-accent/25 active:scale-95 disabled:opacity-60 duration-200"
                >
                  {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <>Continue <ArrowRight size={18} /></>}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifySignup} className="space-y-6">
                <div>
                  <label className="block text-center text-sm font-bold text-blue-900 dark:text-blue-200 mb-4 uppercase tracking-widest">Verification Code</label>
                  <div className="flex justify-center">
                    <input
                      required
                      type="text"
                      maxLength={6}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                      className="w-full sm:w-64 text-center text-3xl font-black tracking-[1em] py-4 rounded-2xl border-2 border-blue-100 dark:border-slate-800 bg-white/50 dark:bg-black/40 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
                      autoFocus
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 flex items-center justify-center gap-2 font-bold rounded-xl text-white transition-all bg-gradient-to-r from-blue-600 to-indigo-600 shadow-xl hover:shadow-blue-500/30 active:scale-95 disabled:opacity-60"
                >
                  {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <>Verify & Complete <CheckCircle2 size={18} /></>}
                </button>

                <div className="flex flex-col gap-3 items-center">
                  <button
                    type="button"
                    disabled={timer > 0 || loading}
                    onClick={handleSendOTP}
                    className="text-sm font-bold text-blue-600 dark:text-blue-400 hover:underline disabled:opacity-50"
                  >
                    {timer > 0 ? `Resend code in ${timer}s` : 'Resend Verification Code'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-blue-600 transition-colors"
                  >
                    <ArrowLeft size={14} /> Back to info
                  </button>
                </div>
              </form>
            )}

            <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800 text-center">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Already have an account?{' '}
                <Link to="/login" className="text-blue-600 dark:text-blue-400 font-bold hover:underline">
                  Sign In
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
