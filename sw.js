const CACHE_NAME = 'tokofull-v1';
const ASSETS_TO_CACHE = [
  '/tokofull/',
  '/tokofull/index.html',
  '/tokofull/manifest.json',
  '/tokofull/icon-512x512.png',
  '/tokofull/offline.html'
];

// Install Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// Aktivasi & Hapus Cache Lama
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(keyList.map((key) => {
        if (key !== CACHE_NAME) {
          return caches.delete(key);
        }
      }));
    })
  );
});

// Strategi Fetch (Network First, then Cache)
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request).then((response) => {
        return response || caches.match('/tokofull/offline.html');
      });
    })
  );
});
