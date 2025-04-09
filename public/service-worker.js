
/* eslint-disable no-restricted-globals */

// Improved service worker with better caching strategies and offline expense page support
const CACHE_NAME = 'cashflow-circuit-v3';
const APP_SHELL_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  '/app-icon.png',
  // Include expense page in the core cached assets
  '/expenses',
  // Static assets
  '/static/js/main.chunk.js',
  '/static/js/bundle.js',
  '/static/css/main.chunk.css',
];

// Additional routes that should be available offline
const OFFLINE_ROUTES = [
  '/expenses',
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

  // For navigation requests (HTML pages), use cache-first for critical routes
  if (event.request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        // Try to get a fresh version from the network
        try {
          const networkResponse = await fetch(event.request);
          
          // Cache successful responses for later offline use
          const cache = await caches.open(CACHE_NAME);
          cache.put(event.request, networkResponse.clone());
          
          return networkResponse;
        } catch (error) {
          console.log('Fetch failed; returning offline page instead.', error);
          
          // If network fails, try to serve from cache
          const cache = await caches.open(CACHE_NAME);
          const cachedResponse = await cache.match(event.request);
          
          // If we have a cached version of this page, serve it
          if (cachedResponse) {
            return cachedResponse;
          }
          
          // If we don't have this specific URL cached, check if it's one of our offline routes
          const url = new URL(event.request.url);
          const offlinePath = OFFLINE_ROUTES.find(route => url.pathname.endsWith(route));
          
          if (offlinePath) {
            // If it's an offline route, serve the index.html as a fallback
            return cache.match('/index.html');
          }
          
          // Last resort fallback
          return cache.match('/index.html');
        }
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
