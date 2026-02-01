// MUDE AQUI: Toda vez que você lançar uma atualização no site, suba esse número.
// Ex: v1 -> v2. Isso força o navegador a apagar o cache velho e baixar tudo novo.
const CACHE_NAME = "agape-v71"; // Coloquei v7 pra garantir que limpe tudo

const ASSETS = [
  "./",              // Importante: use ./ para garantir caminho relativo
  "./index.html",
  "./css/main.css",
  "./js/main.js",    // O SW vai baixar a versão nova deste arquivo
  "./js/modules/avisos.js",
  "./js/modules/calendar.js",
  "./js/modules/mural.js",
  "./js/modules/liturgia.js",
  "./js/modules/bible.js",
  "./js/modules/novenas.js",
  "./js/modules/prayers.js",
  "./js/modules/admin.js",
  "./js/modules/install.js",
  "./site.webmanifest"
];

// 1. Instalação: Cacheia os arquivos
self.addEventListener("install", (e) => {
  self.skipWaiting(); // Força o SW novo a assumir o controle imediatamente
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Adicionei {cache: 'reload'} para obrigar a baixar do servidor, não do cache de memória
      return cache.addAll(ASSETS.map(url => new Request(url, {cache: 'reload'}))); 
    })
  );
});

// 2. Ativação: Limpa caches antigos (A MÁGICA ACONTECE AQUI)
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          // Se a chave for diferente da versão atual (ex: agape-v6), apaga!
          if (key !== CACHE_NAME) {
            console.log("[SW] Removendo cache antigo:", key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim(); // Controla a página imediatamente, sem precisar recarregar
});

// 3. Fetch: Estratégia "Network First" para HTML e JS (Mais seguro para desenvolvimento)
// Essa estratégia tenta pegar da internet primeiro. Se falhar (offline), pega do cache.
self.addEventListener("fetch", (e) => {
  e.respondWith(
    fetch(e.request)
      .then((response) => {
        // Se a resposta for válida, clonamos e atualizamos o cache
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(e.request, responseToCache);
        });
        return response;
      })
      .catch(() => {
        // Se der erro (offline), tenta pegar do cache
        return caches.match(e.request);
      })
  );
});