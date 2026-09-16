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

// ---------------------------------------------------------------------------
// Notificações push
// ---------------------------------------------------------------------------
// O payload vem de /api/admin/push/send já montado: o título é o nome da loja
// e o ícone é a logo cadastrada em Configurações.

const FALLBACK_ICON = "/icon-192.png";

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    // Push sem payload (ou com payload quebrado) ainda deve virar algo
    // visível: em vários navegadores, ignorar um push recebido custa a
    // permissão do site.
    data = {};
  }

  const title = data.title || "Prestiger Motors";
  const options = {
    body: data.body || "Novidades no catálogo.",
    icon: data.icon || FALLBACK_ICON,
    badge: data.badge || FALLBACK_ICON,
    tag: data.tag || "prestiger-motors",
    // Sem isso, uma notificação com a mesma tag substitui a anterior em
    // silêncio e o visitante não percebe que chegou coisa nova.
    renotify: Boolean(data.tag),
    data: { url: data.url || "/" },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const target = new URL(event.notification.data?.url || "/", self.location.origin);

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        // Se o site já está aberto numa aba, reaproveita em vez de abrir outra.
        for (const client of clientList) {
          if (new URL(client.url).origin === target.origin && "focus" in client) {
            // navigate() falha em alguns navegadores quando a aba não está sob
            // controle deste Service Worker. Focar já é melhor que não fazer
            // nada, então a falha não pode derrubar o clique.
            return Promise.resolve(client.navigate(target.href))
              .catch(() => client)
              .then((focused) => (focused || client).focus());
          }
        }
        return self.clients.openWindow(target.href);
      })
  );
});
