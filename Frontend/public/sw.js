importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

const CACHE_NAME = 'mehar-finance-v4'; // Version bump
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

  // 1. Don't cache API requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(fetch(event.request));
    return;
  }
  
  // 2. Network-First for HTML (prevents white screen)
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

  // 3. Cache-First for other assets (JS, CSS, Images)
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

// Initialize Firebase in Service Worker
firebase.initializeApp({
  messagingSenderId: "997732651411"
});

const messaging = firebase.messaging();

// Handle background messages via FCM SDK
messaging.onBackgroundMessage((payload) => {
  console.log('[sw.js] Received background message ', payload);
  const notificationTitle = payload.notification?.title || 'Mehar Finance';
  const notificationOptions = {
    body: payload.notification?.body || 'New notification',
    icon: '/icon-192.png',
    badge: '/favicon.png',
    data: payload.data?.url || '/',
    requireInteraction: true,
    tag: 'mehar-finance-push',
    actions: [
      { action: 'open', title: 'Open Dashboard' },
      { action: 'close', title: 'Dismiss' }
    ]
  };
  
  // Notify active tabs to play sound
  channel.postMessage({ type: 'PUSH_RECEIVED' });
  
  return self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('push', (event) => {
  // If the push event is already handled by FCM (onBackgroundMessage), 
  // this event might still trigger but we should be careful about duplicates.
  // Usually, messaging.onBackgroundMessage handles FCM's special push format.
  
  if (!event.data) return;

  try {
    const data = event.data.json();
    
    // Check if it's an FCM message that might have been missed or is a manual push
    // FCM messages often have 'notification' or 'data' properties
    const title = data.notification?.title || data.title || 'Mehar Finance';
    const body = data.notification?.body || data.body || 'New notification';
    const url = data.data?.url || data.url || '/';

    const options = {
      body: body,
      icon: '/icon-192.png',
      badge: '/favicon.png',
      data: url,
      vibrate: [200, 100, 200],
      tag: 'mehar-finance-push',
      renotify: true,
      silent: false,
      requireInteraction: true,
      actions: [
        { action: 'open', title: 'Open Dashboard' },
        { action: 'close', title: 'Dismiss' }
      ]
    };

    // Notify active tabs to play sound
    channel.postMessage({ type: 'PUSH_RECEIVED' });
    
    event.waitUntil(self.registration.showNotification(title, options));
  } catch (err) {
    console.error('Push event error:', err);
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'close') {
    return;
  }

  // Default 'open' action or clicking the notification body
  if (event.notification.data) {
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true })
        .then((clientList) => {
          for (const client of clientList) {
            if (client.url.includes(new URL(event.notification.data, self.location.origin).pathname) && 'focus' in client) {
              return client.focus();
            }
          }
          if (clients.openWindow) {
            return clients.openWindow(event.notification.data);
          }
        })
    );
  }
});
