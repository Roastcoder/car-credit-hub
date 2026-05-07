importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-messaging-compat.js');

firebase.initializeApp({
  messagingSenderId: "997732651411",
  projectId: "mehar-finance",
  appId: "1:997732651411:web:91363580ba169a63f01866"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message:', payload);
  
  const title = payload.notification?.title || payload.data?.title || 'Mehar Finance';
  const body = payload.notification?.body || payload.data?.body || 'New notification';
  const url = payload.data?.url || '/';

  const options = {
    body: body,
    icon: '/icon-192.png',
    badge: '/favicon.png',
    data: url,
    requireInteraction: true,
    tag: 'mehar-finance-push',
    vibrate: [200, 100, 200],
    actions: [
      { action: 'open', title: 'View' },
      { action: 'close', title: 'Dismiss' }
    ]
  };
  
  return self.registration.showNotification(title, options);
});
