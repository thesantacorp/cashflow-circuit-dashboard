// Minimal service worker — required for Chrome to offer native "Install app" (WebAPK).
// No caching: every fetch goes to the network so users always get the latest build.
self.addEventListener("install", (e) => {
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil((async () => {
    // Drop any old caches from previous PWA versions
    const names = await caches.keys();
    await Promise.all(names.map((n) => caches.delete(n)));
    await self.clients.claim();
  })());
});

// Pass-through fetch handler — its mere presence makes the app installable in Chrome.
self.addEventListener("fetch", (event) => {
  // Network-only; do not cache.
  return;
});
