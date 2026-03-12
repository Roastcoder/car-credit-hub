import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Mail, Lock, User, Building2, Download, Eye, EyeOff } from 'lucide-react';
import logo from '@/assets/logo.png';
import { toast } from 'sonner';
import React from 'react';
import { AuthImageSlider } from '@/components/AuthImageSlider';

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
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/branches`);
        if (!response.ok) return [];
        return await response.json();
      } catch {
        return [];
      }
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
      const result = await signUp(email, password, fullName, branchId);
      if (result.error) {
        toast.error(result.error);
        setLoading(false);
        return;
      }

      setLoading(false);
      toast.success('Account created! Please login.');
      navigate('/login');
    } catch (err: any) {
      setLoading(false);
      toast.error(err.message || 'Failed to create account');
    }
  };


  return (
    <div className="min-h-screen flex bg-transparent font-sans">
      {/* ─── LEFT PANEL ─── */}
      <div className="hidden lg:flex lg:w-[52%] relative overflow-hidden m-4 lg:mr-2 rounded-[2.5rem] shadow-2xl">
        <AuthImageSlider />
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
          <div className="glass-card p-7 sm:p-8 shadow-xl">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-blue-950 dark:text-white tracking-tight drop-shadow-sm">Create Account</h2>
              <p className="text-sm text-blue-700 dark:text-blue-300 mt-1 font-medium">Join Mehar Finance team</p>
            </div>

            <form onSubmit={handleSignup} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-blue-900 dark:text-blue-200 mb-1.5 drop-shadow-sm">Full Name</label>
                <div className="relative">
                  <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-blue-500 dark:text-blue-400" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter your full name"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-white/50 dark:border-white/10 bg-white/60 dark:bg-black/20 text-blue-950 dark:text-white text-sm placeholder:text-blue-500 dark:placeholder:text-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all shadow-sm backdrop-blur-md font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-blue-900 dark:text-blue-200 mb-1.5 drop-shadow-sm">Email Address</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-blue-500 dark:text-blue-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-white/50 dark:border-white/10 bg-white/60 dark:bg-black/20 text-blue-950 dark:text-white text-sm placeholder:text-blue-500 dark:placeholder:text-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all shadow-sm backdrop-blur-md font-medium"
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
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create a password"
                    className="w-full pl-10 pr-11 py-3 rounded-xl border border-white/50 dark:border-white/10 bg-white/60 dark:bg-black/20 text-blue-950 dark:text-white text-sm placeholder:text-blue-500 dark:placeholder:text-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all shadow-sm backdrop-blur-md font-medium"
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

              <div>
                <label className="block text-sm font-bold text-blue-900 dark:text-blue-200 mb-1.5 drop-shadow-sm">Branch</label>
                <div className="relative">
                  <Building2 size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-blue-500 dark:text-blue-400" />
                  <select
                    value={branchId}
                    onChange={(e) => setBranchId(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-white/50 dark:border-white/10 bg-white/60 dark:bg-black/20 text-blue-950 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all appearance-none shadow-sm backdrop-blur-md font-medium"
                  >
                    <option value="">Select your branch</option>
                    {branches.map((branch: any) => (
                      <option key={branch.id} value={branch.id} className="text-blue-950 bg-white dark:bg-slate-800 dark:text-white">
                        {branch.name} ({branch.code})
                      </option>
                    ))}
                  </select>
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

            <div className="mt-6 pt-5 border-t border-gray-200/50 dark:border-gray-700/50 text-center">
              <p className="text-sm text-blue-700 dark:text-blue-400 font-medium">
                Already have an account?{' '}
                <Link to="/login" className="text-blue-700 dark:text-blue-400 font-bold hover:underline underline-offset-2">
                  Sign In
                </Link>
              </p>
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
