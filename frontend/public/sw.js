const CACHE_NAME = "inventario-ti-cache-v1";

const ARQUIVOS_CACHE_INICIAL = [
  "/",
  "/manifest.json",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/icon-maskable-192.png",
  "/icons/icon-maskable-512.png"
];

self.addEventListener("install", (event) => {
  self.skipWaiting();

  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ARQUIVOS_CACHE_INICIAL);
    })
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((nomesCaches) => {
      return Promise.all(
        nomesCaches
          .filter((nomeCache) => nomeCache !== CACHE_NAME)
          .map((nomeCache) => caches.delete(nomeCache))
      );
    })
  );

  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const requisicao = event.request;
  const url = new URL(requisicao.url);

  if (requisicao.method !== "GET") {
    return;
  }

  if (url.pathname.startsWith("/api/")) {
    event.respondWith(
      fetch(requisicao).catch(() => {
        return new Response(
          JSON.stringify({
            erro: "Sem conexão com o servidor. Verifique a internet ou a rede local."
          }),
          {
            status: 503,
            headers: {
              "Content-Type": "application/json"
            }
          }
        );
      })
    );

    return;
  }

  event.respondWith(
    caches.match(requisicao).then((respostaCache) => {
      if (respostaCache) {
        return respostaCache;
      }

      return fetch(requisicao)
        .then((respostaRede) => {
          const respostaClone = respostaRede.clone();

          if (respostaRede.ok) {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(requisicao, respostaClone);
            });
          }

          return respostaRede;
        })
        .catch(() => {
          return caches.match("/");
        });
    })
  );
});