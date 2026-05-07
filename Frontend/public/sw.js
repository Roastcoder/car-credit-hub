importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-messaging-compat.js');

const CACHE_NAME = 'mehar-finance-v5'; // Version bump
const urlsToCache = [
  '/',
  '/index.html',
  '/favicon.ico',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  if (url.pathname.startsWith('/api/')) {
    event.respondWith(fetch(event.request));
    return;
  }
  
  if (event.request.mode === 'navigate' || url.pathname === '/' || url.pathname === '/index.html') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const clonedResponse = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, clonedResponse);
          });
          return response;
        })
        .catch(() => caches.match('/index.html') || caches.match('/'))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => response || fetch(event.request))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Handle messages from the app
const channel = new BroadcastChannel('notifications');

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => caches.delete(cacheName))
        );
      })
    );
  }
});

firebase.initializeApp({
  apiKey: "AIzaSyAj4KEdxX2IRIxOVA4_zT8cyky_XG8pPI8",
  authDomain: "mehar-finance.firebaseapp.com",
  projectId: "mehar-finance",
  storageBucket: "mehar-finance.firebasestorage.app",
  messagingSenderId: "997732651411",
  appId: "1:997732651411:web:91363580ba169a63f01866"
});

const messaging = firebase.messaging();

// Handle background messages via FCM SDK
messaging.onBackgroundMessage((payload) => {
  console.log('[sw.js] Received background message:', payload);
  
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
  
  // Notify active tabs to play sound if they are open
  channel.postMessage({ type: 'PUSH_RECEIVED', payload });
  
  return self.registration.showNotification(title, options);
});

// Fallback for generic push events (non-FCM)
self.addEventListener('push', (event) => {
  console.log('[sw.js] Generic push event received');
  if (!event.data) return;

  try {
    const data = event.data.json();
    console.log('[sw.js] Push data:', data);

    const title = data.notification?.title || data.title || 'Mehar Finance';
    const body = data.notification?.body || data.body || 'New notification';
    const url = data.data?.url || data.url || '/';

    const options = {
      body: body,
      icon: '/icon-192.png',
      badge: '/favicon.png',
      data: url,
      requireInteraction: true,
      tag: 'mehar-finance-push',
      vibrate: [200, 100, 200]
    };

    channel.postMessage({ type: 'PUSH_RECEIVED', payload: data });
    event.waitUntil(self.registration.showNotification(title, options));
  } catch (err) {
    console.error('[sw.js] Push event error:', err);
  }
});

self.addEventListener('notificationclick', (event) => {
  console.log('[sw.js] Notification clicked:', event.notification.tag);
  event.notification.close();
  
  if (event.action === 'close') return;

  const urlToOpen = event.notification.data || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Try to find an existing tab and focus it
        for (const client of clientList) {
          const clientPath = new URL(client.url).pathname;
          const targetPath = new URL(urlToOpen, self.location.origin).pathname;
          
          if (clientPath === targetPath && 'focus' in client) {
            return client.focus();
          }
        }
        // If no tab found, open a new one
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});
