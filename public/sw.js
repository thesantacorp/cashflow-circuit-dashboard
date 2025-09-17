/* eslint-disable no-restricted-globals */

// Enhanced Service Worker for Stack'd Finance PWA
const CACHE_NAME = 'stackd-finance-v1.0.0';
const STATIC_CACHE = 'stackd-static-v1';
const DYNAMIC_CACHE = 'stackd-dynamic-v1';

const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/pwa-icons/icon-192x192.png',
  '/pwa-icons/icon-512x512.png'
];

// Install event - silent installation
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('Stack\'d SW: Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('Stack\'d SW: Installed successfully');
        return self.skipWaiting();
      })
      .catch((err) => console.log('Stack\'d SW: Install error', err))
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
            console.log('Stack\'d SW: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('Stack\'d SW: Activated and claimed clients');
      return self.clients.claim();
    })
  );
});

// Fetch event - network first, fallback to cache
self.addEventListener('fetch', (event) => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  // For navigation requests (HTML pages)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // If successful, cache and return response
          if (response.status === 200) {
            const responseToCache = response.clone();
            caches.open(DYNAMIC_CACHE)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });
          }
          return response;
        })
        .catch(() => {
          // Network failed, try cache first, then fallback to app shell
          return caches.match(event.request)
            .then((cachedResponse) => {
              if (cachedResponse) {
                return cachedResponse;
              }
              // Return app shell for SPA routes
              return caches.match('/') || new Response(
                `<!DOCTYPE html>
                <html>
                  <head>
                    <title>Stack'd - Offline</title>
                    <meta name="viewport" content="width=device-width, initial-scale=1">
                    <style>
                      body { 
                        font-family: system-ui, -apple-system, sans-serif; 
                        text-align: center; 
                        padding: 2rem; 
                        background: linear-gradient(to bottom, #fff7ed, #ffffff);
                        color: #374151;
                      }
                      .offline { 
                        max-width: 400px; 
                        margin: 4rem auto; 
                        padding: 2rem;
                        border-radius: 12px;
                        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                        background: white;
                      }
                      h1 { color: #f97316; margin-bottom: 1rem; }
                      button { 
                        background: #f97316; 
                        color: white; 
                        border: none; 
                        padding: 0.75rem 1.5rem; 
                        border-radius: 8px; 
                        cursor: pointer;
                        font-size: 1rem;
                        margin-top: 1rem;
                      }
                      button:hover { background: #ea580c; }
                    </style>
                  </head>
                  <body>
                    <div class="offline">
                      <h1>Stack'd</h1>
                      <p>You're currently offline, but your financial data is safely stored locally.</p>
                      <p>Check your internet connection to sync your latest transactions.</p>
                      <button onclick="window.location.reload()">Try Again</button>
                    </div>
                  </body>
                </html>`,
                {
                  status: 200,
                  headers: { 'Content-Type': 'text/html' }
                }
              );
            });
        })
    );
    return;
  }

  // For other requests (API, assets, etc.)
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // If successful, cache and return response
        if (response.status === 200) {
          const responseToCache = response.clone();
          caches.open(DYNAMIC_CACHE)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            });
        }
        return response;
      })
      .catch(() => {
        // Network failed, try cache
        return caches.match(event.request);
      })
  );
});

// Background sync for offline transactions
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-transactions') {
    console.log('Stack\'d SW: Syncing offline transactions');
    event.waitUntil(syncOfflineData());
  }
});

// Sync offline data when back online
async function syncOfflineData() {
  try {
    const allClients = await self.clients.matchAll();
    allClients.forEach(client => {
      client.postMessage({
        type: 'SYNC_NEEDED',
        timestamp: new Date().toISOString()
      });
    });
    return true;
  } catch (error) {
    console.error('Stack\'d SW: Sync error:', error);
    return false;
  }
}

// Handle messages from the app
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CONNECTIVITY_CHANGE') {
    console.log('Stack\'d SW: Connectivity changed to', 
      event.data.online ? 'online' : 'offline');
      
    if (event.data.online) {
      // When back online, trigger sync
      self.registration.sync.register('sync-transactions')
        .catch(err => console.log('Stack\'d SW: Sync registration failed:', err));
    }
  }
});

// Handle push notifications (future feature)
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: '/pwa-icons/icon-192x192.png',
      badge: '/pwa-icons/icon-72x72.png',
      data: data.data
    };

    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  event.waitUntil(
    self.clients.matchAll().then((clients) => {
      if (clients.length > 0) {
        return clients[0].focus();
      }
      return self.clients.openWindow('/');
    })
  );
});