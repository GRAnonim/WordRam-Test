const CACHE_NAME = "wordram-v51";
const ASSETS_TO_CACHE = [
  "./",
  "./index.html?v=51",
  "./styles.css?v=51",
  "./data-ce.js?v=51",
  "./data-en.js?v=51",
  "./data.js?v=51",
  "./storage.js?v=51",
  "./generator.js?v=51",
  "./game.js?v=51",
  "./main.js?v=51",
  "./chechen.json",
  "./manifest.webmanifest?v=51",
  "./favicon.svg?v=51",
  "./icon-192.png?v=51",
  "./icon-512.png?v=51",
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
