// ─────────────────────────────────────────────────────────
//  SERVICE WORKER  —  offline caching for PWA
// ─────────────────────────────────────────────────────────

const CACHE_NAME = 'chain-reaction-v1';

const PRECACHE = [
  '/',
  '/index.html',
  '/css/style.css',
  '/js/config.js',
  '/js/puzzles.js',
  '/js/game.js',
  '/js/auth.js',
  '/js/stats.js',
  '/js/app.js',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  'https://fonts.googleapis.com/css2?family=Fraunces:wght@700&family=DM+Mono:wght@400;500&display=swap'
];

// Install — cache core assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

// Activate — remove old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch — network first for Firebase, cache first for app shell
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Always go network for Firebase
  if (url.hostname.includes('firebase') || url.hostname.includes('google')) {
    return; // let browser handle it normally
  }

  // Cache-first for app assets
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        // Cache successful GET responses
        if (event.request.method === 'GET' && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => {
        // Offline fallback for navigation
        if (event.request.mode === 'navigate') {
          return caches.match('/index.html');
        }
      });
    })
  );
});
