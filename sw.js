const CACHE_NAME = 'apee-ces-ekali1-v1';
const urlsToCache = [
  '.',
  'index.html',
  'public/style.css',
  //'public/script.js',
  //'public/api.js',  // si le fichier existe encore, sinon supprimez cette ligne
  'manifest.json',
  'icons/android-icon-192x192.png',
  'icons/apple-icon-180x180.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});