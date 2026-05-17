const CACHE_NAME = 'apee-ces-ekali1-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/public/style.css',
  '/manifest.json',
  '/icons/android-icon-192x192.png',
  '/icons/apple-icon-180x180.png',
  '/icons/apple-icon-60x60.png',
  '/icons/apple-icon-72x72.png',
  '/icons/apple-icon-76x76.png',
  '/icons/apple-icon-114x114.png',
  '/icons/apple-icon-120x120.png',
  '/icons/apple-icon-144x144.png',
  '/icons/apple-icon-152x152.png',
  '/icons/apple-icon-180x180.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache ouvert');
        return cache.addAll(urlsToCache);
      })
      .catch(err => {
        console.error('Erreur lors du cache:', err);
      })
  );
  self.skipWaiting(); // Force l'activation immédiate
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Suppression du cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim(); // Contrôle immédiatement les clients
});

self.addEventListener('fetch', event => {
  // N'intercepter que les requêtes GET
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Retourner la version en cache si disponible
        if (response) {
          return response;
        }

        // Sinon, faire une requête réseau
        return fetch(event.request)
          .then(response => {
            // Ne pas cacher les réponses non-réussies
            if (!response || response.status !== 200 || response.type === 'error') {
              return response;
            }

            // Cacher les réponses réussies
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });

            return response;
          })
          .catch(() => {
            // Fallback hors ligne - retourner une page d'erreur ou le cache
            console.log('Requête échouée, offline:', event.request.url);
            return new Response(
              'Page non disponible hors ligne',
              { status: 503, statusText: 'Service Unavailable' }
            );
          });
      })
  );
});
