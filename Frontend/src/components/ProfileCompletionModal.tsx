import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { usersAPI } from '@/lib/api';
import { toast } from 'sonner';

export default function ProfileCompletionModal() {
  const { user, refreshUser } = useAuth();
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  // If there's no user, or they already have a phone number, hide modal
  if (!user || (user.phone && user.phone.trim().length >= 10)) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || phone.length < 10) {
      toast.error('Please enter a valid 10-digit mobile number');
      return;
    }
    
    setLoading(true);
    try {
      await usersAPI.updateProfile({ phone });
      await refreshUser();
      toast.success('Mobile number updated successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-md">
      <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md p-6 relative overflow-hidden">
        
        {/* Glow effect */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative">
          <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
          </div>
          
          <h2 className="text-xl font-bold text-foreground mb-2">Complete Your Profile</h2>
          <p className="text-sm text-muted-foreground mb-6">
            We noticed your profile is missing a mobile number. Please update it to ensure you receive important loan and portal notifications.
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5 flex items-center gap-2">
                Mobile Number
                <span className="text-[10px] uppercase font-bold tracking-wider text-red-500 bg-red-100 dark:bg-red-900/30 px-1.5 py-0.5 rounded">Required</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium text-sm">
                  +91
                </span>
                <input
                  type="tel"
                  className="w-full pl-11 pr-4 py-2.5 bg-background border border-input rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm"
                  placeholder="Enter 10-digit number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  autoFocus
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || phone.length !== 10}
              className="w-full py-2.5 rounded-xl bg-blue-600 text-white font-semibold shadow-md shadow-blue-500/20 hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-500/30 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:shadow-none transition-all"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving...
                </div>
              ) : 'Update Mobile Number'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
