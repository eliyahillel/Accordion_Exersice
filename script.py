# יצירת הקבצים המעודכנים עם כל השיפורים
import json

# יצירת manifest.json עבור PWA
manifest = {
    "name": "אימון אקורדיון מתקדם",
    "short_name": "אקורדיון",
    "description": "אפליקציה לאימון אקורדיון עם מטרונום ומעקב התקדמות",
    "start_url": "/",
    "display": "standalone",
    "background_color": "#f8fffe",
    "theme_color": "#32808d",
    "orientation": "portrait",
    "icons": [
        {
            "src": "icon-192.png",
            "sizes": "192x192",
            "type": "image/png"
        },
        {
            "src": "icon-512.png", 
            "sizes": "512x512",
            "type": "image/png"
        }
    ],
    "categories": ["music", "education"],
    "lang": "he",
    "dir": "rtl"
}

# שמירת manifest
with open('manifest.json', 'w', encoding='utf-8') as f:
    json.dump(manifest, f, ensure_ascii=False, indent=2)

print("נוצר manifest.json עבור PWA")

# יצירת service worker פשוט
service_worker = """
const CACHE_NAME = 'accordion-trainer-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/style.css',
  '/app.js',
  '/manifest.json'
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
"""

with open('sw.js', 'w', encoding='utf-8') as f:
    f.write(service_worker)

print("נוצר sw.js (Service Worker)")