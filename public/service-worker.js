/* eslint-disable no-restricted-globals */

// Improved service worker with better caching strategies
const CACHE_NAME = 'cashflow-circuit-v2';
const APP_SHELL_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  '/app-icon.png',
  '/static/js/main.chunk.js',
  '/static/js/bundle.js',
  '/static/css/main.chunk.css',
  // Add more static assets as needed
];

// Install a service worker
self.addEventListener('install', (event) => {
  // Perform install steps
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching app shell');
        return cache.addAll(APP_SHELL_URLS);
      })
      .then(() => self.skipWaiting()) // Force activation
  );
});

// Cache and return requests with network-first strategy for API calls
// and cache-first for static assets
self.addEventListener('fetch', (event) => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin) && 
      !event.request.url.includes('fonts.googleapis.com')) {
    return;
  }

  // For navigation requests (HTML pages), use network-first strategy
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          return caches.match('/index.html');
        })
    );
    return;
  }

  // For all other requests, try network first, fallback to cache
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // Clone the response before using it because it's a stream
        const clonedResponse = networkResponse.clone();
        
        // Only cache successful responses
        if (networkResponse.ok) {
          caches.open(CACHE_NAME)
            .then((cache) => {
              // Don't cache API calls with dynamic data
              if (!event.request.url.includes('/api/') && 
                  !event.request.url.includes('supabase.co')) {
                cache.put(event.request, clonedResponse);
              }
            });
        }
        
        return networkResponse;
      })
      .catch(() => {
        // If network fails, try to serve from cache
        return caches.match(event.request)
          .then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }

            // If the request is for an HTML page, serve the cached index.html
            if (event.request.headers.get('accept').includes('text/html')) {
              return caches.match('/index.html');
            }
            
            // Otherwise, let the fetch fail
            return new Response('Network error occurred', {
              status: 408,
              headers: { 'Content-Type': 'text/plain' }
            });
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

// Handle connectivity changes
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CONNECTIVITY_CHANGE') {
    console.log('Service Worker: Connectivity changed to', 
      event.data.online ? 'online' : 'offline');
  }
});

// Log errors
self.addEventListener('error', (event) => {
  console.error('Service Worker error:', event.message);
});
