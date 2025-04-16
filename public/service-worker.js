
/* eslint-disable no-restricted-globals */

// Improved service worker with better caching strategies and offline expense page support
const CACHE_NAME = 'cashflow-circuit-v4';
const APP_SHELL_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  '/app-icon.png',
  // Include expense page in the core cached assets
  '/expenses',
  '/income',
  // Static assets
  '/static/js/main.chunk.js',
  '/static/js/bundle.js',
  '/static/css/main.chunk.css',
];

// Critical routes that should always be available offline
const OFFLINE_ROUTES = [
  '/expenses',
  '/income',
  '/'
];

// Install a service worker
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  // Perform install steps
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching app shell and critical paths');
        return cache.addAll(APP_SHELL_URLS);
      })
      .then(() => {
        console.log('Service Worker: Installation completed, now forcing activation');
        return self.skipWaiting(); // Force activation
      })
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
        const url = new URL(event.request.url);
        console.log('Service Worker: Handling navigation to', url.pathname);
        
        // Check if this is one of our critical offline routes
        const isOfflineRoute = OFFLINE_ROUTES.some(route => 
          url.pathname === route || url.pathname.endsWith(route)
        );
        
        // For critical offline routes, use cache-first strategy
        if (isOfflineRoute) {
          try {
            // Try to get from cache first
            const cachedResponse = await caches.match(event.request);
            if (cachedResponse) {
              console.log('Service Worker: Serving from cache for offline route:', url.pathname);
              return cachedResponse;
            }
            
            // If not in cache, try network
            const networkResponse = await fetch(event.request);
            
            // Cache successful responses for later offline use
            const cache = await caches.open(CACHE_NAME);
            cache.put(event.request, networkResponse.clone());
            
            return networkResponse;
          } catch (error) {
            console.log('Fetch failed for offline route; returning fallback.', error);
            
            // If network fails and we don't have this specific URL cached, 
            // try to serve index.html as a fallback
            const cache = await caches.open(CACHE_NAME);
            return cache.match('/index.html');
          }
        }
        
        // For non-critical routes, try network first, fall back to cache
        try {
          const networkResponse = await fetch(event.request);
          
          // Cache successful responses for later offline use
          const cache = await caches.open(CACHE_NAME);
          cache.put(event.request, networkResponse.clone());
          
          return networkResponse;
        } catch (error) {
          console.log('Fetch failed; trying cache.', error);
          
          const cachedResponse = await caches.match(event.request);
          if (cachedResponse) {
            return cachedResponse;
          }
          
          // Last resort fallback for navigation
          const cache = await caches.open(CACHE_NAME);
          return cache.match('/index.html');
        }
      })()
    );
    return;
  }

  // For API calls (e.g. JSON data), use stale-while-revalidate approach
  if (event.request.url.includes('/api/') || 
      event.request.url.includes('supabase') || 
      event.request.headers.get('accept')?.includes('application/json')) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.match(event.request).then((cachedResponse) => {
          const fetchPromise = fetch(event.request).then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              cache.put(event.request, networkResponse.clone());
            }
            return networkResponse;
          }).catch((error) => {
            console.error('Error fetching data:', error);
            // Return cached response if available, even if it's stale
            return cachedResponse;
          });
          
          // Return the cached response if we have one, otherwise wait for the network response
          return cachedResponse || fetchPromise;
        });
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
  console.log('Service Worker: Activating...');
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
