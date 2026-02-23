import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Fingerprint } from 'lucide-react';
import { toast } from 'sonner';
import {
  isBiometricAvailable,
  hasBiometricCredential,
  registerBiometric,
  clearBiometricCredential,
} from '@/lib/biometric-auth';

export default function BiometricSetup() {
  const { user, session, logout } = useAuth();
  const navigate = useNavigate();
  const [available, setAvailable] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const avail = await isBiometricAvailable();
      setAvailable(avail);
      setEnabled(hasBiometricCredential());
    })();
  }, []);

  if (!available || !user || !session) return null;

  const handleEnable = async () => {
    setLoading(true);
    try {
      const refreshToken = session.refresh_token;
      const success = await registerBiometric(user.id, user.email, refreshToken);
      if (success) {
        setEnabled(true);
        toast.success('Fingerprint enabled! Redirecting to login...');
        // Log out and redirect so fingerprint prompt appears
        await logout();
        navigate('/login');
      } else {
        toast.error('Failed to set up fingerprint. Please try again.');
      }
    } catch {
      toast.error('Fingerprint setup cancelled.');
    } finally {
      setLoading(false);
    }
  };

  const handleDisable = () => {
    clearBiometricCredential();
    setEnabled(false);
    toast.success('Fingerprint login disabled.');
  };

  return (
    <div className="flex items-center gap-3">
      {enabled ? (
        <button
          onClick={handleDisable}
          className="flex items-center gap-2 text-xs text-muted-foreground hover:text-destructive transition-colors"
          title="Disable fingerprint login"
        >
          <Fingerprint size={14} className="text-green-500" />
          <span className="hidden sm:inline">Biometric On</span>
        </button>
      ) : (
        <button
          onClick={handleEnable}
          disabled={loading}
          className="flex items-center gap-2 text-xs text-muted-foreground hover:text-accent transition-colors disabled:opacity-60"
          title="Enable fingerprint login"
        >
          <Fingerprint size={14} />
          <span className="hidden sm:inline">{loading ? 'Setting up...' : 'Enable Fingerprint'}</span>
        </button>
      )}
    </div>
  );
}