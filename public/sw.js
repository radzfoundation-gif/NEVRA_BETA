// Minimal Service Worker to satisfy PWA requirements
const CACHE_NAME = 'noir-ai-v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/index.css',
    '/owl-logo.png'
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
    // Bypass Service Worker for non-GET requests (e.g. POST, PUT, DELETE)
    // and for external APIs like Supabase to avoid caching/interception errors
    if (
        event.request.method !== 'GET' ||
        event.request.url.includes('/api/') ||
        event.request.url.includes('supabase.co') ||
        !event.request.url.startsWith(self.location.origin)
    ) {
        return; // Let browser handle it directly
    }

    // Simple network-first strategy for local assets
    event.respondWith(
        fetch(event.request).catch(() => {
            return caches.match(event.request).then((response) => {
                if (response) {
                    return response;
                }
                // Return a generic 503 response if offline and not in cache
                // to prevent "Failed to convert value to 'Response'" TypeError
                return new Response('Offline - Not Cached', {
                    status: 503,
                    statusText: 'Service Unavailable'
                });
            });
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
