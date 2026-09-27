const CACHE_NAME = "wordram-v132";
const ASSETS_TO_CACHE = [
  "./",
  "./index.html?v=132",
  "./styles.css?v=132",
  "./data-ce.js?v=132",
  "./data-en.js?v=132",
  "./data.js?v=132",
  "./storage.js?v=132",
  "./generator.js?v=132",
  "./game.js?v=132",
  "./main.js?v=132",
  "./chechen.json",
  "./manifest.webmanifest?v=132",
  "./favicon.svg?v=132",
  "./icon-192.png?v=132",
  "./icon-512.png?v=132",
  "./logo.svg",
  "./og-image.png"
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((k) => {
          if (k !== CACHE_NAME) return caches.delete(k);
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  e.respondWith(
    caches.match(e.request).then((res) => res || fetch(e.request))
  );
});
