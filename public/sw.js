/* eslint-disable no-restricted-globals */

// Enhanced PWA Service Worker for Stack'd Financial App
const CACHE_NAME = 'stackd-pwa-v1.0.0';
const STATIC_CACHE = 'stackd-static-v1';
const DYNAMIC_CACHE = 'stackd-dynamic-v1';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/pwa-icons/icon-192x192.png',
  '/pwa-icons/icon-512x512.png',
  // Include all main routes for offline access
  '/expenses',
  '/income',
  '/overview',
  '/profile',
  '/auth/login',
  '/auth/signup'
];

// Additional routes that should be available offline
const OFFLINE_ROUTES = [
  '/expenses',
  '/income', 
  '/overview',
  '/profile',
  '/'
];

// Install event
self.addEventListener('install', (event) => {
  console.log('PWA Service Worker: Installing...');
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('PWA Service Worker: Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('PWA Service Worker: Installed');
        return self.skipWaiting();
      })
      .catch((err) => console.log('PWA Service Worker: Error during install', err))
  );
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('PWA Service Worker: Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE && cacheName !== CACHE_NAME) {
            console.log('PWA Service Worker: Deleting old cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('PWA Service Worker: Activated');
      return self.clients.claim();
    })
  );
});

// Fetch event with network-first strategy for navigation and cache-first for assets
self.addEventListener('fetch', (event) => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  // For navigation requests (HTML pages), use network-first but fallback gracefully
  if (event.request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        const cache = await caches.open(STATIC_CACHE);
        
        try {
          // Try network first for fresh content
          const networkResponse = await fetch(event.request, {
            signal: AbortSignal.timeout(5000)
          });
          
          if (networkResponse.ok) {
            // Cache successful responses for later offline use
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          }
        } catch (error) {
          console.log('PWA: Network failed, serving from cache:', error.message);
        }
        
        // Network failed or timed out, try cache
        const cachedResponse = await cache.match(event.request);
        if (cachedResponse) {
          console.log('PWA: Serving cached version');
          return cachedResponse;
        }
        
        // Check if this is an offline-supported route
        const url = new URL(event.request.url);
        const isOfflineRoute = OFFLINE_ROUTES.some(route => 
          url.pathname === route || url.pathname.endsWith(route)
        );
        
        if (isOfflineRoute) {
          // Serve the main app shell for SPA routes
          const indexResponse = await cache.match('/index.html') || await cache.match('/');
          if (indexResponse) {
            console.log('PWA: Serving app shell for offline route');
            return indexResponse;
          }
        }
        
        // Last resort - create a simple offline page
        return new Response(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Offline - Stack'd</title>
              <meta name="viewport" content="width=device-width, initial-scale=1">
              <style>
                body { 
                  font-family: system-ui, -apple-system, sans-serif; 
                  text-align: center; 
                  padding: 2rem;
                  background: linear-gradient(135deg, #f97316, #ea580c);
                  color: white;
                  margin: 0;
                  min-height: 100vh;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                }
                .offline { 
                  max-width: 400px; 
                  margin: 0 auto;
                  background: rgba(255,255,255,0.1);
                  padding: 2rem;
                  border-radius: 1rem;
                  backdrop-filter: blur(10px);
                }
                button {
                  background: white;
                  color: #f97316;
                  border: none;
                  padding: 1rem 2rem;
                  border-radius: 0.5rem;
                  font-weight: bold;
                  cursor: pointer;
                  margin-top: 1rem;
                }
              </style>
            </head>
            <body>
              <div class="offline">
                <h1>📱 You're Offline</h1>
                <p>Stack'd is working offline! Your data is stored locally and will sync when you're back online.</p>
                <button onclick="window.location.reload()">Try Again</button>
              </div>
            </body>
          </html>
        `, {
          status: 200,
          headers: { 'Content-Type': 'text/html' }
        });
      })()
    );
    return;
  }

  // For API calls, use network-first approach
  if (event.request.url.includes('/api/') || 
      event.request.headers.get('accept')?.includes('application/json')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const responseToCache = response.clone();
          caches.open(DYNAMIC_CACHE)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });
          return response;
        })
        .catch(() => {
          return caches.match(event.request);
        })
    );
    return;
  }
  
  // For all other requests (CSS, JS, images), use cache-first strategy
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        if (cachedResponse) {
          return cachedResponse;
        }
        
        return fetch(event.request)
          .then(networkResponse => {
            if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
              return networkResponse;
            }
            
            const responseToCache = networkResponse.clone();
            caches.open(DYNAMIC_CACHE)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });
              
            return networkResponse;
          });
      })
  );
});

// Background sync for offline transactions
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-transactions') {
    console.log('PWA: Attempting to sync offline transactions');
    event.waitUntil(syncOfflineTransactions());
  }
});

// Function to sync offline transactions when back online
async function syncOfflineTransactions() {
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
    console.error('PWA: Sync error:', error);
    return false;
  }
}

// Handle connectivity changes
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CONNECTIVITY_CHANGE') {
    console.log('PWA: Connectivity changed to', 
      event.data.online ? 'online' : 'offline');
      
    if (event.data.online) {
      // When back online, trigger sync
      self.registration.sync.register('sync-transactions')
        .catch(err => console.log('PWA: Sync registration failed:', err));
    }
  }
});

// Push notifications support
self.addEventListener('push', (event) => {
  console.log('PWA: Push notification received');
  
  if (event.data) {
    const options = {
      body: event.data.text(),
      icon: '/pwa-icons/icon-192x192.png',
      badge: '/pwa-icons/icon-72x72.png',
      tag: 'stackd-notification',
      requireInteraction: true
    };

    event.waitUntil(
      self.registration.showNotification('Stack\'d', options)
    );
  }
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  event.waitUntil(
    self.clients.openWindow('/')
  );
});

// Log errors
self.addEventListener('error', (event) => {
  console.error('PWA Service Worker error:', event.message);
});