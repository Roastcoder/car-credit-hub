importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyAj4KEdxX2IRIxOVA4_zT8cyky_XG8pPI8",
  authDomain: "mehar-finance.firebaseapp.com",
  projectId: "mehar-finance",
  storageBucket: "mehar-finance.firebasestorage.app",
  messagingSenderId: "997732651411",
  appId: "1:997732651411:web:91363580ba169a63f01866"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Background payload:', JSON.stringify(payload));
  
  const title = payload.notification?.title || payload.data?.title || payload.data?.subject || 'Mehar Finance';
  const body = payload.notification?.body || payload.data?.body || payload.data?.message || 'New notification';
  const url = payload.data?.url || payload.notification?.click_action || '/';

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
