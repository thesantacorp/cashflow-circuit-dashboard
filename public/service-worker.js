
/* eslint-disable no-restricted-globals */

// Improved service worker with better caching strategies and offline expense page support
const CACHE_NAME = 'stackd-v4';
const APP_SHELL_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  '/app-icon.png',
  // Include all main routes for offline access
  '/expenses',
  '/income',
  '/overview',
  '/profile',
  '/auth/login',
  '/auth/signup',
  // Static assets will be cached as they're requested
];

// Additional routes that should be available offline
const OFFLINE_ROUTES = [
  '/expenses',
  '/income', 
  '/overview',
  '/profile',
  '/'
];

// Install a service worker
self.addEventListener('install', (event) => {
  // Perform install steps
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching app shell and critical paths');
        return cache.addAll(APP_SHELL_URLS);
      })
      .then(() => self.skipWaiting()) // Force activation
  );
});

// Cache and return requests with appropriate strategy based on request type
self.addEventListener('fetch', (event) => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin) && 
      !event.request.url.includes('fonts.googleapis.com')) {
    return;
  }

  // For navigation requests (HTML pages), use network-first but fallback gracefully
  if (event.request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE_NAME);
        
        try {
          // Try network first for fresh content
          const networkResponse = await fetch(event.request, {
            // Add a timeout to prevent hanging
            signal: AbortSignal.timeout(5000)
          });
          
          if (networkResponse.ok) {
            // Cache successful responses for later offline use
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          }
        } catch (error) {
          console.log('Network failed, serving from cache:', error.message);
        }
        
        // Network failed or timed out, try cache
        const cachedResponse = await cache.match(event.request);
        if (cachedResponse) {
          console.log('Serving cached version');
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
            console.log('Serving app shell for offline route');
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
                body { font-family: system-ui; text-align: center; padding: 2rem; }
                .offline { color: #666; max-width: 400px; margin: 0 auto; }
              </style>
            </head>
            <body>
              <div class="offline">
                <h1>You're Offline</h1>
                <p>Please check your internet connection and try again.</p>
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

  // For API calls (e.g. JSON data), use network-first approach to always try for fresh data
  if (event.request.url.includes('/api/') || 
      event.request.headers.get('accept')?.includes('application/json')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Clone the response before using it
          const responseToCache = response.clone();
          
          // Cache the successful response
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });
            
          return response;
        })
        .catch(() => {
          // Fall back to cache if network fails
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
          // Return cached version
          return cachedResponse;
        }
        
        // If not in cache, fetch from network
        return fetch(event.request)
          .then(networkResponse => {
            // Don't cache if response is not valid
            if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
              return networkResponse;
            }
            
            // Clone the response before using it
            const responseToCache = networkResponse.clone();
            
            // Cache the successful response
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });
              
            return networkResponse;
          });
      })
  );
});

// Update a service worker
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  
  event.waitUntil(
    // Clean up old caches
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Service Worker: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
          return null;
        })
      );
    }).then(() => {
      console.log('Service Worker: Claiming clients');
      return self.clients.claim(); // Take control of all clients
    })
  );
});

// Handle synchronization for offline transactions
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-transactions') {
    console.log('Service Worker: Attempting to sync offline transactions');
    event.waitUntil(syncOfflineTransactions());
  }
});

// Function to sync offline transactions when back online
async function syncOfflineTransactions() {
  try {
    // Here we would implement logic to sync transactions
    // For now, we just post a message to the client
    const allClients = await self.clients.matchAll();
    allClients.forEach(client => {
      client.postMessage({
        type: 'SYNC_NEEDED',
        timestamp: new Date().toISOString()
      });
    });
    return true;
  } catch (error) {
    console.error('Service Worker: Sync error:', error);
    return false;
  }
}

// Handle connectivity changes
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CONNECTIVITY_CHANGE') {
    console.log('Service Worker: Connectivity changed to', 
      event.data.online ? 'online' : 'offline');
      
    if (event.data.online) {
      // When back online, trigger sync
      self.registration.sync.register('sync-transactions')
        .catch(err => console.log('Sync registration failed:', err));
    }
  }
});

// Log errors
self.addEventListener('error', (event) => {
  console.error('Service Worker error:', event.message);
});
