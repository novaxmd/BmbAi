// Bmb Ai Service Worker
// Uses a "network-first" strategy: always tries to fetch the latest version
// from the server first, and only falls back to the cache when offline.
// This avoids serving a stale JS bundle after a new deploy (which caused
// the "blank page until you clear site data" issue).

const CACHE_NAME = 'bmb-ai-v2';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // Never intercept API calls — they must always hit the network directly.
  if (event.request.url.includes('/api/')) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache a copy of successful GET responses for offline fallback
        if (event.request.method === 'GET' && response.ok) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
