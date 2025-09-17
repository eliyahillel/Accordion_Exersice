const CACHE_NAME = 'accordion-trainer-v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/style.css', 
    '/app.js',
    '/manifest.json',
    '/icon-192.jpg',
    '/icon-512.jpg'
];

// התקנת Service Worker
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                return cache.addAll(urlsToCache);
            })
    );
});

// הבאת משאבים
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // החזר מהמטמון אם קיים, אחרת מהרשת
                return response || fetch(event.request);
            }
        )
    );
});