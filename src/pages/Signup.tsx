import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Mail, Lock, User, Building2, Shield, BarChart3, Users, Zap, Download, Eye, EyeOff } from 'lucide-react';
import logo from '@/assets/logo.png';
import { toast } from 'sonner';
import React from 'react';

export default function Signup() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [branchId, setBranchId] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { data: branches = [] } = useQuery({
    queryKey: ['branches-signup'],
    queryFn: async () => {
      const { data } = await supabase.from('branches').select('*').eq('is_active', true).order('name');
      return (data ?? []) as any[];
    },
  });

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !password || !branchId) {
      toast.error('Please fill all fields');
      return;
    }
    setLoading(true);
    
    try {
      const result = await signUp(email, password, fullName);
      const error = result.error;
      if (error) {
        toast.error(error);
        setLoading(false);
        return;
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('profiles').update({ branch_id: branchId } as any).eq('id', user.id);
        await supabase.from('user_roles').insert({ user_id: user.id, role: 'employee' });
      }
      
      setLoading(false);
      toast.success('Account created! Please login.');
      navigate('/login');
    } catch (err: any) {
      setLoading(false);
      toast.error(err.message || 'Failed to create account');
    }
  };

  const features = [
    { icon: <Shield size={22} />, title: 'Role-Based Access', desc: 'Multi-level permissions for admins, managers, brokers & employees' },
    { icon: <BarChart3 size={22} />, title: 'Real-Time Analytics', desc: 'Track applications, commissions & performance metrics live' },
    { icon: <Users size={22} />, title: 'Multi-Party Management', desc: 'Banks, NBFCs, brokers & customers — all in one place' },
    { icon: <Zap size={22} />, title: 'Streamlined Workflow', desc: 'Application to disbursement with full document tracking' },
  ];

  return (
    <div className="min-h-screen flex bg-background">
      {/* ─── LEFT PANEL ─── */}
      <div className="hidden lg:flex lg:w-[52%] relative overflow-hidden" style={{ background: 'linear-gradient(145deg, #0F172A 0%, #1E293B 50%, #0F172A 100%)' }}>
        <div className="absolute top-0 right-0 w-80 h-80 rounded-full opacity-[0.07]" style={{ background: 'radial-gradient(circle, #3B82F6, transparent)' }} />
        <div className="absolute bottom-20 left-10 w-60 h-60 rounded-full opacity-[0.05]" style={{ background: 'radial-gradient(circle, #EF4444, transparent)' }} />
        <div className="absolute top-1/2 right-10 w-40 h-40 rounded-full opacity-[0.04]" style={{ background: 'radial-gradient(circle, #3B82F6, transparent)' }} />

        <div className="relative z-10 flex flex-col justify-between p-10 xl:p-14 w-full">
          <div className="flex items-center gap-3.5">
            <div className="bg-white rounded-2xl p-2.5 shadow-xl shadow-black/20">
              <img src={logo} alt="Mehar Finance" className="h-12 w-auto object-contain" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">Mehar Finance</h2>
              <p className="text-blue-300/70 text-xs font-medium tracking-wide uppercase">Car Loan Solutions</p>
            </div>
          </div>

          <div className="flex-1 flex flex-col justify-center -mt-8">
            <div className="mb-2">
              <span className="inline-block px-3 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider bg-blue-500/15 text-blue-300 border border-blue-500/20">
                Management Portal
              </span>
            </div>
            <h1 className="text-4xl xl:text-[2.75rem] font-extrabold text-white leading-[1.15] mb-4 tracking-tight">
              Car Loan Sales<br />
              <span className="bg-gradient-to-r from-blue-400 to-red-400 bg-clip-text text-transparent">& Management</span>
            </h1>
            <p className="text-slate-400 text-sm leading-relaxed max-w-sm mb-8">
              Complete loan lifecycle management — from lead generation to disbursement, all in one powerful platform.
            </p>

            <div className="space-y-3.5">
              {features.map(f => (
                <div key={f.title} className="flex items-start gap-3 group">
                  <div className="shrink-0 w-9 h-9 rounded-xl bg-white/[0.06] border border-white/[0.08] flex items-center justify-center text-blue-400 group-hover:bg-blue-500/15 group-hover:border-blue-500/20 transition-all duration-300">
                    {f.icon}
                  </div>
                  <div className="pt-0.5">
                    <h3 className="text-white text-sm font-semibold mb-0.5">{f.title}</h3>
                    <p className="text-slate-500 text-xs leading-relaxed">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8">
              <a
                href="/mehar-finance.apk"
                download
                className="inline-flex items-center gap-2.5 bg-white/[0.08] hover:bg-white/[0.12] border border-white/[0.1] hover:border-white/[0.18] text-white font-medium py-2.5 px-5 rounded-xl transition-all duration-300 text-sm"
              >
                <Download size={16} className="text-blue-400" />
                Download Android App
              </a>
            </div>
          </div>

          <p className="text-slate-600 text-xs">© 2025 Mehar Finance. All rights reserved.</p>
        </div>
      </div>

      {/* ─── RIGHT PANEL ─── */}
      <div className="flex-1 flex items-center justify-center p-5 sm:p-8 bg-slate-50 dark:bg-slate-900/50">
        <div className="w-full max-w-[420px]">
          {/* Mobile header */}
          <div className="lg:hidden flex flex-col items-center mb-8">
            <div className="bg-white rounded-2xl p-3 shadow-lg shadow-black/5 mb-3 border border-slate-100">
              <img src={logo} alt="Mehar Finance" className="h-11 w-auto object-contain" />
            </div>
            <h2 className="text-lg font-bold text-foreground">Mehar Finance</h2>
            <p className="text-xs text-muted-foreground">Car Loan Portal</p>
          </div>

          {/* Card */}
          <div className="bg-white dark:bg-slate-800/80 rounded-2xl shadow-xl shadow-black/[0.04] border border-slate-200/70 dark:border-slate-700/50 p-7 sm:p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-foreground tracking-tight">Create Account</h2>
              <p className="text-sm text-muted-foreground mt-1">Join Mehar Finance team</p>
            </div>

            <form onSubmit={handleSignup} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-foreground mb-1.5">Full Name</label>
                <div className="relative">
                  <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter your full name"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/50 text-foreground text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-foreground mb-1.5">Email Address</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/50 text-foreground text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-foreground mb-1.5">Password</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create a password"
                    className="w-full pl-10 pr-11 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/50 text-foreground text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-foreground mb-1.5">Branch</label>
                <div className="relative">
                  <Building2 size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <select
                    value={branchId}
                    onChange={(e) => setBranchId(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/50 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none"
                  >
                    <option value="">Select your branch</option>
                    {branches.map((branch: any) => (
                      <option key={branch.id} value={branch.id}>
                        {branch.name} ({branch.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 font-semibold py-3 px-4 rounded-xl text-white text-sm transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-blue-600/20 hover:shadow-blue-600/30 hover:translate-y-[-1px] active:translate-y-0"
                style={{ background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)' }}
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Creating Account…
                  </div>
                ) : (
                  <>
                    Sign Up
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-700/50 text-center">
              <p className="text-sm text-muted-foreground">
                Already have an account?{' '}
                <Link to="/login" className="text-blue-600 dark:text-blue-400 font-semibold hover:underline underline-offset-2">
                  Sign In
                </Link>
              </p>
            </div>
          </div>

          <p className="text-center text-xs text-slate-400 mt-5">
            Secured with end-to-end encryption
          </p>
        </div>
      </div>
    </div>
  );
}
