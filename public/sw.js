// Service Worker — foco em cache de imagens Supabase.
// NÃO cacheamos assets JS/CSS do app: o Vercel já os serve com
// Cache-Control immutable (hashes no nome), então o browser os
// guarda sozinho sem riscos de conteúdo desatualizado.
const IMAGE_CACHE = "pm-images-v1";

self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (event) => {
  // Apaga todos os caches antigos (automarket-v*, pm-images antigas, etc.)
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== IMAGE_CACHE).map((k) => caches.delete(k)))
      )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);

  // Só intercepta imagens do Supabase Storage.
  // Tudo o mais (JS, CSS, HTML, APIs) vai direto para a rede.
  const isSupabaseImage =
    url.host.endsWith("supabase.co") &&
    (url.pathname.includes("/storage/v1/object/public/") ||
      url.pathname.includes("/storage/v1/render/image/"));

  if (!isSupabaseImage) return;

  // Cache-first: imagens de veículo não mudam (mesmo path = mesma foto).
  event.respondWith(
    caches.open(IMAGE_CACHE).then((cache) =>
      cache.match(req).then((cached) => {
        if (cached) return cached;
        return fetch(req).then((res) => {
          if (res.ok) cache.put(req, res.clone());
          return res;
        });
      })
    )
  );
});
