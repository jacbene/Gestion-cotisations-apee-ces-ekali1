const CACHE_NAME = 'apee-ekali-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/formulaire-cotisations.html',
  '/bilan-financier.html',
  '/parametres.html',
  '/manifest.json'
];

// Installation : mise en cache des ressources principales
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
      .then(() => self.skipWaiting())
  );
});

// Activation : nettoyer les anciens caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Stratégie de fetch : cache d'abord, puis réseau
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Retourne la réponse en cache si elle existe
        if (response) {
          return response;
        }
        // Sinon, va chercher sur le réseau
        return fetch(event.request).then(
          networkResponse => {
            // Vérifie si c'est une réponse valide
            if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
              return networkResponse;
            }
            // Clone et stocke en cache pour la prochaine fois
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });
            return networkResponse;
          }
        );
      })
  );
});

