// Minimal Service Worker to satisfy PWA requirements
const CACHE_NAME = 'noir-ai-v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/manifest.json',
    '/noir-logo-v2.png'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                // Try to cache core assets, but don't fail if some missing
                return cache.addAll(urlsToCache).catch(err => {
                    console.log('SW: Cache addAll skipped some files', err);
                });
            })
    );
});

self.addEventListener('fetch', (event) => {
    // Simple network-first strategy for dev (so changes appear instantly)
    // Fallback to cache if offline
    event.respondWith(
        fetch(event.request).catch(() => {
            return caches.match(event.request);
        })
    );
});

self.addEventListener('activate', (event) => {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});
