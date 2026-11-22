/**
 * TuStudyHub Service Worker
 * Enforces strict offline security & PWA installation resilience:
 * - App shell and static UI assets cached for fast loading and offline fallback.
 * - API requests use network-first strategy.
 * - CRITICAL: Never cache private or restricted academic documents, downloads, or auth streams.
 */

const CACHE_NAME = 'tustudyhub-shell-v3';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/icon.svg',
  '/manifest.json?v=1.0.1',
  '/pwa-192x192.png?v=1.0.1',
  '/pwa-512x512.png?v=1.0.1',
  '/pwa-maskable-512x512.png?v=1.0.1',
  '/apple-touch-icon.png?v=1.0.1'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // CRITICAL SECURITY RULE: NEVER cache protected/restricted document views, downloads, or sensitive auth tokens
  if (
    url.pathname.includes('/download') ||
    url.pathname.includes('/view') ||
    url.pathname.includes('/auth/') ||
    url.pathname.includes('/api/materials/') && (url.pathname.endsWith('/stream') || url.pathname.endsWith('/file'))
  ) {
    return; // Pass directly to network
  }

  // Network-first for other API calls
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          return new Response(
            JSON.stringify({
              success: false,
              error: {
                code: 'OFFLINE_MODE',
                message: 'You are currently working offline. Reconnect to access live academic services.'
              }
            }),
            {
              headers: { 'Content-Type': 'application/json' },
              status: 503
            }
          );
        })
    );
    return;
  }

  // Cache-first for static shell assets with network fallback
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then((networkResponse) => {
        // Cache new static UI assets (css/js/svg/png/woff2) only
        if (
          networkResponse.status === 200 &&
          (url.pathname.endsWith('.js') ||
           url.pathname.endsWith('.css') ||
           url.pathname.endsWith('.svg') ||
           url.pathname.endsWith('.png') ||
           url.pathname.endsWith('.woff2'))
        ) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      });
    })
  );
});
