const CACHE_NAME = 'budget-planner-cache-v2';
const ASSETS_TO_CACHE = [
  '/',
  '/login',
  '/manifest.json',
  '/favicon.ico'
];

// Install Event - Caching static resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Activate Event - Clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('Deleting old cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch Event - Dynamic caching strategy
self.addEventListener('fetch', (event) => {
  // Only cache GET requests
  if (event.request.method !== 'GET') return;

  const url = event.request.url;

  // Skip caching bundlers, dev hot reloading, and remote API/Supabase calls
  if (
    url.includes('_next/webpack-hmr') || 
    url.includes('supabase') || 
    url.includes('/_next/static/development') ||
    url.includes('/api/')
  ) {
    return;
  }

  const acceptHeader = event.request.headers.get('accept') || '';
  const isPageRequest = acceptHeader.includes('text/html') || 
                        url === self.location.origin || 
                        url === self.location.origin + '/' || 
                        url.includes('/login');

  if (isPageRequest) {
    // Network-First for HTML/Pages to always show latest changes
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response.status === 200 && url.startsWith(self.location.origin)) {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return response;
        })
        .catch(() => {
          return caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) return cachedResponse;
            return caches.match('/');
          });
        })
    );
  } else {
    // Stale-While-Revalidate for other static assets
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        const fetchPromise = fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse.status === 200 && url.startsWith(self.location.origin)) {
              const responseToCache = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, responseToCache);
              });
            }
            return networkResponse;
          })
          .catch(() => {
            // Ignore network errors for background cache updates
          });

        return cachedResponse || fetchPromise;
      })
    );
  }
});
