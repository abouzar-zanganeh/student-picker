const cacheName = 'teacher-assistant-v1';
const assetsToCache = [
    './',
    './index.html',
    './style.css',
    './js/main.js',
    './js/models.js',
    './js/state.js',
    './js/ui.js',
    './js/utils.js',
    './images/icon-192.png',
    './images/icon-512.png'
];

// The 'install' event is fired when the service worker is first installed.
self.addEventListener('install', (event) => {
    // We wait until the assets are successfully cached before considering the installation complete.
    event.waitUntil(
        caches.open(cacheName).then((cache) => {
            return cache.addAll(assetsToCache);
        })
    );
});

// The 'fetch' event intercepts all network requests made by the app.
self.addEventListener('fetch', (event) => {
    event.respondWith(
        // We check if the requested resource is already in our cache.
        caches.match(event.request).then((response) => {
            // If a cached version is found, we return it. Otherwise, we fetch it from the network.
            return response || fetch(event.request);
        })
    );
});