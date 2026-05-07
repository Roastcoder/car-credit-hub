import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Bell, Check, CheckCheck, Trash2, FileText, AlertCircle, CheckCircle2, Info, X, MessageSquare } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { subscribeUserToPush, checkPushSubscription } from '@/lib/notifications';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  loan_id: string | null;
  url: string | null;
  is_read: boolean;
  created_at: string;
}

const TYPE_CONFIG: Record<string, { icon: typeof Info; color: string }> = {
  info: { icon: Info, color: 'text-blue-500' },
  success: { icon: CheckCircle2, color: 'text-green-500' },
  warning: { icon: AlertCircle, color: 'text-yellow-500' },
  error: { icon: AlertCircle, color: 'text-red-500' },
  chat: { icon: MessageSquare, color: 'text-purple-500' },
};

export default function NotificationBell() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const navigate = useNavigate();
  const [lastNotificationId, setLastNotificationId] = useState<number | null>(null);

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/notifications`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
        });
        if (!response.ok) return [];
        return await response.json();
      } catch {
        return [];
      }
    },
    enabled: !!user,
    refetchInterval: 5000, // Refetch every 5 seconds for real-time feel
  });

  const playNotificationSound = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      const playChime = (freq: number, startTime: number) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, startTime);
        osc.frequency.exponentialRampToValueAtTime(freq * 1.5, startTime + 0.1);
        
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.3, startTime + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.5);
        
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(startTime);
        osc.stop(startTime + 0.5);
      };

      // Play double chime
      playChime(523.25, audioCtx.currentTime); // C5
      playChime(659.25, audioCtx.currentTime + 0.15); // E5
    } catch (e) { console.error('Notification sound failed', e); }
  };

  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );

  const requestPermission = async () => {
    if (typeof Notification === 'undefined') return;
    const permission = await Notification.requestPermission();
    setNotificationPermission(permission);
    if (permission === 'granted') {
      toast.success('Browser notifications enabled!');
      subscribeToPushNotifications();
    }
  };

  const subscribeToPushNotifications = async () => {
    try {
      await subscribeUserToPush();
      console.log('Push subscription successful');
    } catch (error) {
      console.error('Push subscription failed:', error);
    }
  };

  const [isSubscribedOnBackend, setIsSubscribedOnBackend] = useState<boolean | null>(null);

  const checkStatus = async () => {
    if (notificationPermission === 'granted') {
      const isSubscribed = await checkPushSubscription();
      setIsSubscribedOnBackend(isSubscribed);
      
      // Auto-fix: If permission is granted but not subscribed on backend, try to subscribe
      if (isSubscribed === false) {
        console.log('Permission granted but no backend subscription found. Auto-subscribing...');
        await subscribeToPushNotifications();
        const recheck = await checkPushSubscription();
        setIsSubscribedOnBackend(recheck);
      }
    }
  };

  useEffect(() => {
    checkStatus();
    // Re-check status every 30 seconds
    const interval = setInterval(checkStatus, 30000);
    return () => clearInterval(interval);
  }, [notificationPermission]);

  useEffect(() => {
    if (notifications.length > 0) {
      const latest = notifications[0]; // Assuming sorted by created_at DESC
      if (lastNotificationId !== null && latest.id !== lastNotificationId) {
        playNotificationSound();
        
        // Show toast for new notification
        toast(latest.title, {
          description: latest.message,
          icon: latest.type === 'success' ? <CheckCircle2 className="text-green-500" /> : <Info className="text-blue-500" />,
          action: latest.url ? {
            label: 'View',
            onClick: () => navigate(latest.url!)
          } : undefined
        });

        // Show native browser notification if permitted
        if (notificationPermission === 'granted') {
          try {
            const n = new Notification(latest.title, {
              body: latest.message,
              icon: '/favicon.png',
              tag: 'mehar-finance-notif', // Prevent duplicate alerts
              requireInteraction: false
            });
            n.onclick = () => {
              window.focus();
              if (latest.url) navigate(latest.url);
              n.close();
            };
          } catch (e) {
            console.error('Native notification failed', e);
          }
        }
      }
      setLastNotificationId(latest.id);
    }
  }, [notifications, lastNotificationId, navigate, notificationPermission]);

  useEffect(() => {
    // Listen for push notifications from service worker even if tab is in background
    const channel = new BroadcastChannel('notifications');
    channel.onmessage = (event) => {
      if (event.data.type === 'PUSH_RECEIVED') {
        playNotificationSound();
      }
    };
    return () => channel.close();
  }, []);

  useEffect(() => {
    // Realtime disabled for now
  }, [user?.id, queryClient]);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const markAsRead = useMutation({
    mutationFn: async (id: string) => {
      await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/notifications/${id}/read`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const markAllRead = useMutation({
    mutationFn: async () => {
      await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/notifications/read-all`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
      });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const deleteNotification = useMutation({
    mutationFn: async (id: string) => {
      await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/notifications/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
      });
      // Auto-delete after 1 minute
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['notifications'] });
      }, 60000);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-lg hover:bg-muted transition-colors"
      >
        <Bell size={20} className="text-muted-foreground" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-accent text-accent-foreground text-[10px] font-bold px-1">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 w-80 sm:w-96 bg-card border border-border rounded-xl shadow-2xl z-50 overflow-hidden max-h-[70vh] flex flex-col transition-all duration-200">
          {/* Header */}
          <div className="flex flex-col border-b border-border">
            <div className="flex items-center justify-between p-4 pb-2">
              <h3 className="font-bold text-foreground">Notifications</h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={() => markAllRead.mutate()}
                    className="text-xs text-accent hover:underline font-medium flex items-center gap-1"
                  >
                    <CheckCheck size={14} /> Mark all read
                  </button>
                )}
                <button onClick={() => setOpen(false)} className="p-1 rounded hover:bg-muted">
                  <X size={16} className="text-muted-foreground" />
                </button>
              </div>
            </div>

            {/* Push Notification Status & Actions */}
            <div className="mx-4 mb-3 p-3 bg-muted/50 rounded-lg border border-border/50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Push Alerts</span>
                <div className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${
                    notificationPermission === 'granted' 
                      ? (isSubscribedOnBackend === true ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-yellow-500 animate-pulse') 
                      : 'bg-red-500'
                  }`} />
                  <span className="text-[10px] font-medium capitalize">
                    {notificationPermission === 'granted' 
                      ? (isSubscribedOnBackend === true ? 'Active' : 'Reconnecting...') 
                      : notificationPermission}
                  </span>
                </div>
              </div>
              
              {notificationPermission !== 'granted' ? (
                <button
                  onClick={requestPermission}
                  className="w-full p-2 bg-accent text-accent-foreground rounded-md text-[10px] font-bold hover:opacity-90 transition-all flex items-center justify-center gap-2"
                >
                  <Bell size={12} />
                  Enable Browser Notifications
                </button>
              ) : (
                <button
                  onClick={subscribeToPushNotifications}
                  className="w-full p-2 bg-accent/10 border border-accent/20 text-accent rounded-md text-[10px] font-bold hover:bg-accent/20 transition-all flex items-center justify-center gap-2"
                >
                  <CheckCircle2 size={12} />
                  Refresh Connection
                </button>
              )}

              {notificationPermission === 'denied' && (
                <p className="mt-2 text-[9px] text-destructive leading-tight font-medium">
                  Blocked by browser. Click the lock icon in address bar to Allow.
                </p>
              )}
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-sm">
                <Bell size={32} className="mx-auto mb-3 opacity-30" />
                <p>No notifications yet</p>
              </div>
            ) : (
              notifications.map(n => {
                const config = TYPE_CONFIG[n.type] || TYPE_CONFIG.info;
                const Icon = config.icon;
                return (
                  <div
                    key={n.id}
                    className={`flex items-start gap-3 p-4 border-b border-border/50 hover:bg-muted/30 transition-colors ${!n.is_read ? 'bg-accent/5' : ''}`}
                  >
                    <div className={`mt-0.5 shrink-0 ${config.color}`}>
                      <Icon size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-sm font-medium ${!n.is_read ? 'text-foreground' : 'text-muted-foreground'}`}>
                          {n.title}
                        </p>
                        {!n.is_read && (
                          <span className="w-2 h-2 rounded-full bg-accent shrink-0 mt-1.5" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-[10px] text-muted-foreground">
                          {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                        </span>
                        {n.loan_id && (
                          <Link
                            to={`/loans/${n.loan_id}`}
                            onClick={() => { setOpen(false); if (!n.is_read) markAsRead.mutate(n.id); }}
                            className="text-[10px] text-accent font-medium hover:underline flex items-center gap-1"
                          >
                            <FileText size={10} /> View Detail
                          </Link>
                        )}
                        {n.type === 'chat' && (
                          <Link
                            to={n.url || '/chat'}
                            onClick={() => { setOpen(false); if (!n.is_read) markAsRead.mutate(n.id); }}
                            className="text-[10px] text-purple-500 font-medium hover:underline flex items-center gap-1"
                          >
                            <MessageSquare size={10} /> Open Chat
                          </Link>
                        )}
                        {!n.is_read && (
                          <button
                            onClick={() => markAsRead.mutate(n.id)}
                            className="text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-1"
                          >
                            <Check size={10} /> Read
                          </button>
                        )}
                        <button
                          onClick={() => deleteNotification.mutate(n.id)}
                          className="text-[10px] text-muted-foreground hover:text-destructive flex items-center gap-1 ml-auto"
                        >
                          <Trash2 size={10} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}