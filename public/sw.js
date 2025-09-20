const CACHE_NAME = 'stackd-pwa-v2.0.0';
const STATIC_CACHE = 'stackd-static-v2.0.0';
const DYNAMIC_CACHE = 'stackd-dynamic-v2.0.0';

// Resources to cache immediately
const STATIC_RESOURCES = [
  '/',
  '/?utm_source=pwa',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json',
  '/app-icon.png'
];

// Install event - cache static resources
self.addEventListener('install', event => {
  console.log('Service Worker installing...');
  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE).then(cache => {
        console.log('Caching static resources');
        return cache.addAll(STATIC_RESOURCES);
      }),
      self.skipWaiting()
    ])
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('Service Worker activating...');
  event.waitUntil(
    Promise.all([
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames
            .filter(cacheName => 
              cacheName.startsWith('stackd-') && 
              ![STATIC_CACHE, DYNAMIC_CACHE].includes(cacheName)
            )
            .map(cacheName => caches.delete(cacheName))
        );
      }),
      self.clients.claim()
    ])
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Handle navigation requests
  if (request.mode === 'navigate') {
    event.respondWith(
      caches.match('/').then(cachedResponse => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(request).then(response => {
          const responseClone = response.clone();
          caches.open(DYNAMIC_CACHE).then(cache => {
            cache.put('/', responseClone);
          });
          return response;
        });
      }).catch(() => {
        return caches.match('/');
      })
    );
    return;
  }

  // Handle other requests
  event.respondWith(
    caches.match(request).then(cachedResponse => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(request).then(response => {
        // Don't cache non-successful responses
        if (!response.ok) return response;

        const responseClone = response.clone();
        caches.open(DYNAMIC_CACHE).then(cache => {
          cache.put(request, responseClone);
        });

        return response;
      });
    }).catch(() => {
      // Fallback for offline
      if (request.destination === 'document') {
        return caches.match('/');
      }
    })
  );
});

// Handle background sync for true app-like behavior
self.addEventListener('sync', event => {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

function doBackgroundSync() {
  // Implement background sync logic here
  console.log('Background sync triggered');
}