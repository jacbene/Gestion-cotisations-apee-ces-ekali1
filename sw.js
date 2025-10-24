const CACHE_NAME = 'apee-ekali1-v1.2';
const urlsToCache = [
  './',
  './index.html',
  './style.css',
  './api.js',
  './script.js',
  './manifest.json',
  './icons/icon-72x72.png',
  './icons/icon-192x192.png',
  './icons/icon-512x512.png'
];

// Installation du Service Worker
self.addEventListener('install', function(event) {
  console.log('Service Worker: Installation en cours');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        console.log('Service Worker: Mise en cache des ressources');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting())
  );
});

// Activation du Service Worker
self.addEventListener('activate', function(event) {
  console.log('Service Worker: Activation');
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Suppression de l\'ancien cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// Interception des requêtes
self.addEventListener('fetch', function(event) {
  if (event.request.url.startsWith('chrome-extension://')) {
    return;
  }
  
  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        // Retourne la ressource en cache ou fait une requête réseau
        if (response) {
          return response;
        }
        
        return fetch(event.request).then(function(response) {
          // Vérifie si la réponse est valide
          if(!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          
          // Clone la réponse pour la mettre en cache
          var responseToCache = response.clone();
          
          caches.open(CACHE_NAME)
            .then(function(cache) {
              cache.put(event.request, responseToCache);
            });
          
          return response;
        });
      })
      .catch(function() {
        // En cas d'échec, on peut retourner une page offline personnalisée
        return caches.match('./index.html');
      })
  );
});

