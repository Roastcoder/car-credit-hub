import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { 
  User, Mail, Phone, Lock, Save, Key, ShieldCheck, 
  MapPin, BadgeCheck, AlertCircle
} from 'lucide-react';
import { ROLE_LABELS } from '@/lib/auth';

export default function Profile() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  // Profile State
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
  });

  // Password State
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: { name: string; phone?: string }) => {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/users/me/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update profile');
      }
      return response.json();
    },
    onSuccess: () => {
      toast.success('Profile updated successfully');
      // Force refresh auth state if needed - usually done via query invalidation or manual update
      // For now, since AuthContext doesn't expose a refresh method, we can tell user to reload
      // But queryClient invalidation might trigger a reload of relevant data elsewhere
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
      // In a real app, we'd update the AuthContext user state here
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/users/me/change-password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to change password');
      }
      return response.json();
    },
    onSuccess: () => {
      toast.success('Password changed successfully');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate(profileForm);
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    changePasswordMutation.mutate({
      currentPassword: passwordForm.currentPassword,
      newPassword: passwordForm.newPassword,
    });
  };

  if (!user) return null;

  const phoneUpdateDisabled = !!user.phone;

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-400">
      {/* Header section with User Info Card */}
      <div className="relative overflow-hidden glass-panel rounded-3xl p-6 border border-white/40 dark:border-white/10 shadow-lg">
        <div className="absolute top-0 right-0 -tr-1/4 w-48 h-48 bg-blue-500/5 rounded-full blur-3xl -z-10" />
        <div className="absolute bottom-0 left-0 -bl-1/4 w-48 h-48 bg-indigo-500/5 rounded-full blur-3xl -z-10" />
        
        <div className="flex flex-col sm:flex-row items-center gap-6 relative z-10">
          <div className="relative group">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white text-2xl sm:text-3xl font-black shadow-xl border-4 border-white dark:border-slate-800 transition-transform group-hover:scale-105 duration-300">
              {user.name?.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase() || 'U'}
            </div>
            <div className="absolute -bottom-1 -right-1 p-1.5 bg-green-500 rounded-xl border-2 border-white dark:border-slate-800 shadow-lg">
              <ShieldCheck size={16} className="text-white" />
            </div>
          </div>
          
          <div className="text-center sm:text-left space-y-1">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              {user.name || 'Your Profile'}
            </h1>
            <div className="flex flex-wrap justify-center sm:justify-start gap-2 text-[11px] font-bold uppercase tracking-wider">
              <span className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg border border-blue-100 dark:border-blue-800/50">
                <BadgeCheck size={12} />
                {ROLE_LABELS[user.role] || 'Member'}
              </span>
              <span className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 rounded-lg border border-slate-100 dark:border-slate-700/50">
                <Mail size={12} />
                {user.email}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Profile Information Form */}
        <section className="glass-panel rounded-2xl overflow-hidden border border-white/40 dark:border-white/10 shadow-md group">
          <div className="p-4 bg-gradient-to-r from-blue-600 to-indigo-700 border-b border-white/10">
            <div className="flex items-center gap-2 text-white">
              <User size={18} className="group-hover:rotate-12 transition-transform duration-300" />
              <h2 className="text-sm font-bold uppercase tracking-widest">Personal Info</h2>
            </div>
          </div>
          
          <form onSubmit={handleProfileSubmit} className="p-6 space-y-5">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] pl-0.5">Full Name</label>
              <div className="relative group/input">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User size={16} />
                </div>
                <input
                  type="text"
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 transition-all text-slate-900 dark:text-white"
                  placeholder="Enter full name"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] pl-0.5">Phone Number</label>
              <div className="relative group/input">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Phone size={16} />
                </div>
                <input
                  type="text"
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                  disabled={phoneUpdateDisabled}
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 transition-all ${
                    phoneUpdateDisabled 
                      ? 'bg-slate-100/50 dark:bg-slate-800/30 border-slate-200 dark:border-slate-800 text-slate-400 cursor-not-allowed'
                      : 'bg-slate-50/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white'
                  }`}
                  placeholder={phoneUpdateDisabled ? 'Phone already set' : 'Enter mobile number'}
                />
              </div>
              {phoneUpdateDisabled ? (
                <p className="text-[9px] text-slate-500 flex items-center gap-1 mt-1 font-medium pl-0.5">
                  <AlertCircle size={10} /> Contact admin to change saved phone number.
                </p>
              ) : (
                <p className="text-[9px] text-blue-500 flex items-center gap-1 mt-1 font-bold pl-0.5 uppercase tracking-wider">
                  <AlertCircle size={10} /> Single-time update allowed.
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={updateProfileMutation.isPending}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-indigo-700 disabled:bg-slate-400 text-white text-sm font-bold rounded-xl transition-all shadow-md hover:shadow-blue-500/20 active:scale-95"
            >
              <Save size={16} />
              {updateProfileMutation.isPending ? 'Updating...' : 'Save Profile'}
            </button>
          </form>
        </section>

        {/* Change Password Form */}
        <section className="glass-panel rounded-2xl overflow-hidden border border-white/40 dark:border-white/10 shadow-md group">
          <div className="p-4 bg-gradient-to-r from-slate-800 to-slate-950 dark:from-slate-700 dark:to-slate-900 border-b border-white/10">
            <div className="flex items-center gap-2 text-white">
              <Lock size={18} className="group-hover:rotate-12 transition-transform duration-300" />
              <h2 className="text-sm font-bold uppercase tracking-widest">Security</h2>
            </div>
          </div>
          
          <form onSubmit={handlePasswordSubmit} className="p-6 space-y-5">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] pl-0.5">Current Password</label>
              <div className="relative group/input">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Key size={16} />
                </div>
                <input
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-medium focus:ring-2 focus:ring-slate-500 transition-all text-slate-900 dark:text-white"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5 pt-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] pl-0.5">New Password</label>
              <div className="relative group/input">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock size={16} />
                </div>
                <input
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 transition-all text-slate-900 dark:text-white"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] pl-0.5">Confirm New Password</label>
              <div className="relative group/input">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <ShieldCheck size={16} />
                </div>
                <input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 transition-all text-slate-900 dark:text-white"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={changePasswordMutation.isPending}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-slate-900 dark:bg-slate-700 hover:bg-black dark:hover:bg-slate-600 disabled:bg-slate-400 text-white text-sm font-bold rounded-xl transition-all shadow-md active:scale-95"
            >
              <Key size={16} />
              {changePasswordMutation.isPending ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </section>
      </div>

      <div className="p-4 bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100/50 dark:border-blue-800/50 rounded-2xl text-center">
        <p className="text-[10px] text-blue-600/70 dark:text-blue-400/70 font-bold uppercase tracking-[0.2em]">
          Mehar Finance Account Security Management
        </p>
      </div>
    </div>
  );
}
