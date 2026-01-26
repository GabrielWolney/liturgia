const CACHE_NAME = "agape-v1";
const ASSETS = [
  "/",
  "/index.html",
  "/css/main.css",
  "/js/main.js",
  "/site.webmanifest"
];

// 1. Instalação: Cacheia os arquivos principais
self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// 2. Ativação: Limpa caches antigos
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          if (key !== CACHE_NAME) return caches.delete(key);
        })
      );
    })
  );
  self.clients.claim();
});

// 3. Fetch: Intercepta as requisições (Obrigatório para PWA)
self.addEventListener("fetch", (e) => {
  e.respondWith(
    caches.match(e.request).then((response) => {
      return response || fetch(e.request);
    })
  );
});