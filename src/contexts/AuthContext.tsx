import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session, User } from '@supabase/supabase-js';

export type UserRole = 'super_admin' | 'admin' | 'manager' | 'bank' | 'broker' | 'employee';

export interface AppUser {
  id: string;
  email: string;
  full_name: string;
  role: UserRole | null;
  avatar_url?: string;
  branch_id?: string | null;
}

interface AuthContextType {
  user: AppUser | null;
  session: Session | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ error: string | null }>;
  logout: () => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: string | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUserProfile = async (supabaseUser: User): Promise<AppUser | null> => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', supabaseUser.id)
        .single();

      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', supabaseUser.id)
        .limit(1)
        .single();

      return {
        id: supabaseUser.id,
        email: supabaseUser.email ?? '',
        full_name: profile?.full_name ?? supabaseUser.email ?? '',
        role: (roleData?.role as UserRole) ?? null,
        avatar_url: profile?.avatar_url,
        branch_id: profile?.branch_id ?? null,
      };
    } catch {
      return {
        id: supabaseUser.id,
        email: supabaseUser.email ?? '',
        full_name: supabaseUser.email ?? '',
        role: null,
        branch_id: null,
      };
    }
  };

  useEffect(() => {
    // Set up auth state listener BEFORE getting session
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      setSession(currentSession);
      if (currentSession?.user) {
        // Defer Supabase calls to avoid deadlock
        setTimeout(async () => {
          const appUser = await fetchUserProfile(currentSession.user);
          setUser(appUser);
          setIsLoading(false);
        }, 0);
      } else {
        setUser(null);
        setIsLoading(false);
      }
    });

    // Then get initial session
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      if (!s) {
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string): Promise<{ error: string | null }> => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    return { error: null };
  };

  const signUp = async (email: string, password: string, fullName: string): Promise<{ error: string | null }> => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    if (error) return { error: error.message };
    return { error: null };
  };

  const logout = async () => {
    // Use local scope so biometric refresh token stays valid on server
    const hasBiometric = !!localStorage.getItem('biometric_credential_id');
    await supabase.auth.signOut({ scope: hasBiometric ? 'local' : 'global' });
    setUser(null);
    setSession(null);
  };

  return (
    <AuthContext.Provider value={{ user, session, isLoading, login, logout, signUp }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
