const CACHE_NAME = 'tokofull-cache-v1';
const urlsToCache = [
  '/tokofull/',
  '/tokofull/index.html',
  '/tokofull/manifest.json',
  '/tokofull/icon-72x72.png',
  '/tokofull/icon-96x96.png',
  '/tokofull/icon-128x128.png',
  '/tokofull/icon-192x192.png',
  '/tokofull/icon-512x512.png',
  '/tokofull/offline.html'
];

// Install event
self.addEventListener('install', event => {
  console.log('[Service Worker] Install');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[Service Worker] Caching all assets');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - bersihkan cache lama
self.addEventListener('activate', event => {
  console.log('[Service Worker] Activate');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Menghapus cache lama:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - strategi network first, fallback ke cache
self.addEventListener('fetch', event => {
  // Abaikan request selain GET
  if (event.request.method !== 'GET') return;
  
  // Abaikan request ke API eksternal jika ada
  if (event.request.url.includes('/api/')) {
    event.respondWith(fetch(event.request));
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Clone response karena response stream hanya bisa dipakai sekali
        const responseClone = response.clone();
        
        caches.open(CACHE_NAME).then(cache => {
          // Cache file yang baru di-fetch
          if (event.request.url.startsWith(self.location.origin)) {
            cache.put(event.request, responseClone);
          }
        });
        
        return response;
      })
      .catch(() => {
        // Jika offline, coba ambil dari cache
        return caches.match(event.request).then(cachedResponse => {
          if (cachedResponse) {
            return cachedResponse;
          }
          
          // Jika tidak ada di cache dan offline, tampilkan halaman offline
          if (event.request.mode === 'navigate') {
            return caches.match('/tokofull/offline.html');
          }
          
          return new Response('Offline', {
            status: 503,
            statusText: 'Service Unavailable'
          });
        });
      })
  );
});

// Background sync untuk data offline (opsional)
self.addEventListener('sync', event => {
  console.log('[Service Worker] Background syncing', event);
  if (event.tag === 'sync-data') {
    event.waitUntil(syncData());
  }
});

async function syncData() {
  // Fungsi untuk sinkronisasi data ketika online kembali
  const cache = await caches.open(CACHE_NAME);
  const requests = await cache.keys();
  
  // Proses data yang perlu di-sync
  console.log('[Service Worker] Sync data:', requests.length);
}
