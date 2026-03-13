export const requestNotificationPermission = async (): Promise<NotificationPermission> => {
  if (!('Notification' in window)) {
    console.warn('Notifications not supported');
    return 'denied';
  }
  
  return await Notification.requestPermission();
};

export const subscribeUserToPush = async (): Promise<PushSubscription | null> => {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(import.meta.env.VITE_VAPID_PUBLIC_KEY || '')
    });

    const token = localStorage.getItem('auth_token');
    if (!token) return subscription;

    // Send subscription to backend
    await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/notifications/subscribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(subscription)
    });

    return subscription;
  } catch (error) {
    console.error('Push subscription error:', error);
    return null;
  }
};

const urlBase64ToUint8Array = (base64String: string): Uint8Array => {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map(char => char.charCodeAt(0)));
};
