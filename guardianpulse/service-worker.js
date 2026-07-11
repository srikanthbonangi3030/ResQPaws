// resQpaws Service Worker — Network-First Strategy (Development-Safe)
// Strategy: Always try network first, fall back to cache only when offline.
// This ensures code changes are always picked up without needing a manual refresh.

const CACHE_NAME = 'resqpaws-v3';

// Static assets worth caching for offline resilience (non-HTML, non-JS pages).
// HTML and JS are intentionally excluded from pre-caching to avoid stale content.
const STATIC_ASSETS = [
  './manifest.json',
  './assets/placeholder.png',
  './assets/images/hero-bg.png',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
];

// ─── INSTALL ──────────────────────────────────────────────────────────────────
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch(err => {
        console.warn('SW: Static asset pre-cache warning:', err);
      });
    })
  );
  // Activate immediately — don't wait for old tabs to close
  self.skipWaiting();
});

// ─── ACTIVATE ─────────────────────────────────────────────────────────────────
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('SW: Deleting old cache:', key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  // Take control of all open clients immediately
  self.clients.claim();
});

// ─── FETCH ────────────────────────────────────────────────────────────────────
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);

  // Only intercept same-origin requests and known CDN assets
  const isSameOrigin = url.origin === location.origin;
  const isCdnAsset = url.hostname.includes('unpkg.com');

  if (!isSameOrigin && !isCdnAsset) return;

  // ── HTML pages and JS/CSS files: Network-First ──────────────────────────────
  // Always fetch fresh from the network. Only serve cache if network fails.
  // This guarantees code changes are always reflected immediately on navigation.
  const isNavigationOrScript =
    e.request.mode === 'navigate' ||
    url.pathname.endsWith('.html') ||
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.css');

  if (isNavigationOrScript) {
    e.respondWith(
      fetch(e.request)
        .then((networkResponse) => {
          // Clone and cache the fresh response for offline fallback
          const cloned = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(e.request, cloned));
          return networkResponse;
        })
        .catch(() => {
          // Network failed → serve cache (offline fallback)
          return caches.match(e.request).then((cached) => {
            if (cached) return cached;
            // Last resort for navigation: serve index.html
            if (e.request.mode === 'navigate') {
              return caches.match('./index.html');
            }
          });
        })
    );
    return;
  }

  // ── Static assets (images, icons, fonts): Cache-First ───────────────────────
  // These rarely change, so cache-first is fine and faster.
  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;
      return fetch(e.request).then((networkResponse) => {
        const cloned = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(e.request, cloned));
        return networkResponse;
      }).catch(() => undefined);
    })
  );
});
