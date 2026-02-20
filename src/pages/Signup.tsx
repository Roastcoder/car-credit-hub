import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Mail, Lock, User, Building2, Shield, BarChart3, Users, Zap, Download } from 'lucide-react';
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

  const { data: branches = [] } = useQuery({
    queryKey: ['branches-signup'],
    queryFn: async () => {
      const { data } = await supabase.from('branches').select('*').eq('is_active', true).order('name');
      return data ?? [];
    },
  });

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !password || !branchId) {
      toast.error('Please fill all fields');
      return;
    }
    setLoading(true);
    const { error } = await signUp(email, password, fullName);
    if (error) {
      toast.error(error);
      setLoading(false);
      return;
    }
    
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('profiles').update({ branch_id: branchId }).eq('id', user.id);
    }
    
    setLoading(false);
    toast.success('Account created! Please login.');
    navigate('/login');
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

      {/* Right signup */}
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

          <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-1">Create Account</h2>
          <p className="text-sm text-muted-foreground mb-4 sm:mb-6">Join Mehar Finance</p>

          <form onSubmit={handleSignup} className="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Full Name</label>
              <div className="relative">
                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter your full name"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border-2 border-border bg-background text-foreground text-sm focus:outline-none focus:border-accent transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a password"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border-2 border-border bg-background text-foreground text-sm focus:outline-none focus:border-accent transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Branch</label>
              <div className="relative">
                <Building2 size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <select
                  value={branchId}
                  onChange={(e) => setBranchId(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border-2 border-border bg-background text-foreground text-sm focus:outline-none focus:border-accent transition-colors appearance-none"
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
              className="w-full flex items-center justify-center gap-2 bg-accent text-accent-foreground font-semibold py-2.5 sm:py-3 px-4 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-60 text-sm sm:text-base"
            >
              {loading ? 'Creating Account…' : 'Sign Up'}
              {!loading && <ArrowRight size={18} />}
            </button>
          </form>

          <div className="mt-4 text-center">
            <p className="text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link to="/login" className="text-accent font-medium hover:underline">
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
