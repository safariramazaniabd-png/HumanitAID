const CACHE_NAME = 'humanitaid-v9';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/css/variables.css',
  '/css/base.css',
  '/css/components.css',
  '/css/sections.css',
  '/css/responsive.css',
  '/js/config.js',
  '/js/app.js',
  '/js/api.js',
  '/js/theme.js',
  '/js/i18n.js',
  '/js/icons.js',
  '/js/carousel.js',
  '/js/donation.js',
  '/js/pwa-install.js',
  '/manifest.webmanifest',
  '/assets/icons/favicon.svg',
  '/assets/icons/icon-192.png',
  '/assets/icons/icon-512.png',
  '/assets/logo/humanitaid-symbol.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const isApiRequest = request.url.includes('/api/');
  const isGetRequest = request.method === 'GET';

  // API mutations must always go to the network.
  // Cache Storage only supports GET requests.
  if (isApiRequest && !isGetRequest) {
    event.respondWith(fetch(request));
    return;
  }

  // Network-first for API GET requests.
  if (isApiRequest) {
    event.respondWith(
      fetch(request).catch(() => caches.match(request))
    );
    return;
  }

  // Never cache non-GET requests.
  if (!isGetRequest) {
    event.respondWith(fetch(request));
    return;
  }

  // Cache-first for GET/static assets.
  event.respondWith(
    caches.match(request).then((cached) => {
      return cached || fetch(request).then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      });
    }).catch(() => {
      // Offline fallback
      if (request.destination === 'document') {
        return caches.match('/index.html');
      }
    })
  );
});
