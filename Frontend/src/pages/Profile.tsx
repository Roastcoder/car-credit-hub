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
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header section with User Info Card */}
      <div className="relative overflow-hidden glass-panel rounded-3xl p-8 border border-white/40 dark:border-white/10 shadow-xl">
        <div className="absolute top-0 right-0 -tr-1/4 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -z-10" />
        <div className="absolute bottom-0 left-0 -bl-1/4 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -z-10" />
        
        <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
          <div className="relative group">
            <div className="w-24 h-24 md:w-32 md:h-32 rounded-3xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-3xl md:text-5xl font-black shadow-2xl border-4 border-white dark:border-slate-800 transition-transform group-hover:scale-105 duration-300">
              {user.name?.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase() || 'U'}
            </div>
            <div className="absolute -bottom-2 -right-2 p-2 bg-green-500 rounded-2xl border-4 border-white dark:border-slate-800 shadow-lg animate-bounce">
              <ShieldCheck size={20} className="text-white" />
            </div>
          </div>
          
          <div className="text-center md:text-left space-y-2">
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {user.name || 'Your Profile'}
            </h1>
            <div className="flex flex-wrap justify-center md:justify-start gap-4 text-sm font-semibold">
              <span className="flex items-center gap-1.5 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full border border-blue-200 dark:border-blue-800/50">
                <BadgeCheck size={14} />
                {ROLE_LABELS[user.role] || 'Member'}
              </span>
              <span className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 rounded-full border border-slate-200 dark:border-slate-700/50">
                <Mail size={14} />
                {user.email}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Profile Information Form */}
        <section className="glass-panel rounded-3xl overflow-hidden border border-white/40 dark:border-white/10 shadow-lg transition-all hover:shadow-xl group">
          <div className="p-6 bg-gradient-to-r from-blue-600 to-indigo-600">
            <div className="flex items-center gap-3 text-white">
              <User className="group-hover:rotate-12 transition-transform duration-300" />
              <h2 className="text-lg font-bold">Personal Information</h2>
            </div>
          </div>
          
          <form onSubmit={handleProfileSubmit} className="p-8 space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Full Name</label>
              <div className="relative group/input">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                  <User size={18} />
                </div>
                <input
                  type="text"
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl font-medium focus:ring-2 focus:ring-blue-500 transition-all text-slate-900 dark:text-white"
                  placeholder="Enter full name"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Phone Number</label>
              <div className="relative group/input">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                  <Phone size={18} />
                </div>
                <input
                  type="text"
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                  disabled={phoneUpdateDisabled}
                  className={`w-full pl-11 pr-4 py-3 rounded-2xl font-medium focus:ring-2 focus:ring-blue-500 transition-all ${
                    phoneUpdateDisabled 
                      ? 'bg-slate-100 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-500 cursor-not-allowed'
                      : 'bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white'
                  }`}
                  placeholder={phoneUpdateDisabled ? 'Phone already updated' : 'Enter mobile number'}
                />
              </div>
              {phoneUpdateDisabled ? (
                <p className="text-[10px] text-slate-500 flex items-center gap-1 mt-1 font-medium italic pl-1">
                  <AlertCircle size={10} /> Phone number can only be set once during onboarding.
                </p>
              ) : (
                <p className="text-[10px] text-blue-500 flex items-center gap-1 mt-1 font-bold pl-1 uppercase tracking-tighter">
                  <AlertCircle size={10} /> Important: You can only set this once.
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={updateProfileMutation.isPending}
              className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-indigo-600 disabled:bg-slate-400 text-white font-bold rounded-2xl transition-all shadow-lg hover:shadow-blue-500/20 active:scale-95"
            >
              <Save size={18} />
              {updateProfileMutation.isPending ? 'Saving Progress...' : 'Update Details'}
            </button>
          </form>
        </section>

        {/* Change Password Form */}
        <section className="glass-panel rounded-3xl overflow-hidden border border-white/40 dark:border-white/10 shadow-lg transition-all hover:shadow-xl group">
          <div className="p-6 bg-gradient-to-r from-slate-800 to-slate-900 dark:from-slate-700 dark:to-slate-800">
            <div className="flex items-center gap-3 text-white">
              <Lock className="group-hover:rotate-12 transition-transform duration-300" />
              <h2 className="text-lg font-bold">Security & Password</h2>
            </div>
          </div>
          
          <form onSubmit={handlePasswordSubmit} className="p-8 space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Current Password</label>
              <div className="relative group/input">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                  <Key size={18} />
                </div>
                <input
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl font-medium focus:ring-2 focus:ring-slate-500 transition-all text-slate-900 dark:text-white"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">New Password</label>
              <div className="relative group/input">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                  <Lock size={18} />
                </div>
                <input
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl font-medium focus:ring-2 focus:ring-blue-500 transition-all text-slate-900 dark:text-white"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Confirm New Password</label>
              <div className="relative group/input">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                  <ShieldCheck size={18} />
                </div>
                <input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl font-medium focus:ring-2 focus:ring-blue-500 transition-all text-slate-900 dark:text-white"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={changePasswordMutation.isPending}
              className="w-full flex items-center justify-center gap-2 py-3 bg-slate-950 dark:bg-slate-700 hover:bg-black dark:hover:bg-slate-600 disabled:bg-slate-400 text-white font-bold rounded-2xl transition-all shadow-lg active:scale-95"
            >
              <Key size={18} />
              {changePasswordMutation.isPending ? 'Locking in...' : 'Update Password'}
            </button>
          </form>
        </section>
      </div>

      <div className="p-6 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800 rounded-3xl text-center shadow-inner">
        <p className="text-sm text-blue-700 dark:text-blue-400 font-bold tracking-tight">
          Manage your account preferences and secure your presence on Mehar Finance Portal.
        </p>
      </div>
    </div>
  );
}
