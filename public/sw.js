// Kill-switch service worker — unregisters any previous PWA service worker
self.addEventListener("install", (e) => e.waitUntil(self.skipWaiting()));
self.addEventListener("activate", (e) => e.waitUntil((async () => {
  await self.clients.claim();
  const names = await caches.keys();
  await Promise.all(names.map((n) => caches.delete(n)));
  await self.registration.unregister();
  const clients = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
  await Promise.all(clients.map((c) => c.navigate(c.url)));
})()));
