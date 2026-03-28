import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { useEffect } from 'react';

export default function DashboardRedirect() {
  const { user, isLoading } = useAuth();

  useEffect(() => {
    // If user is accountant, redirect to account dashboard
    if (user?.role === 'accountant') {
      // This will be handled by the Navigate component below
    }
  }, [user]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">Loading…</p>
        </div>
      </div>
    );
  }

  // Redirect accountants to account dashboard
  if (user?.role === 'accountant') {
    return <Navigate to="/account" replace />;
  }

  // For all other users, show regular dashboard
  return <Navigate to="/dashboard" replace />;
}