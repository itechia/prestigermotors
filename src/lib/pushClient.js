// Notificações push no navegador — sem cadastro.
//
// O fluxo inteiro é: o navegador pede permissão, gera um endpoint anônimo, e
// a gente manda esse endpoint para /api/public/push/subscribe. Não existe
// login, perfil ou identificação do visitante em nenhum momento.

export const PUSH_DISMISSED_KEY = "pm_push_dismissed_at";

// Quem fecha o convite não deve ver de novo tão cedo.
export const PUSH_DISMISS_DAYS = 30;

export function isPushSupported() {
  if (typeof window === "undefined") return false;
  return (
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

export function isIOS() {
  if (typeof window === "undefined") return false;
  const ua = navigator.userAgent;
  // iPad com iPadOS 13+ se identifica como Mac; o toque na tela denuncia.
  return /iphone|ipod|ipad/i.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
}

// No iOS, push só existe se o site foi adicionado à tela de início
// (iOS 16.4+). No Safari comum não há o que pedir.
export function isStandalone() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    window.navigator.standalone === true
  );
}

export function getPermission() {
  if (typeof window === "undefined" || !("Notification" in window)) return "unsupported";
  return Notification.permission; // 'default' | 'granted' | 'denied'
}

// A chave VAPID chega em base64url e o PushManager exige bytes crus.
function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) output[i] = raw.charCodeAt(i);
  return output;
}

// Registrar é idempotente: se o Service Worker já está no ar (providers.jsx
// registra em produção), devolve o mesmo registro. Chamar aqui faz o opt-in
// funcionar também em desenvolvimento, onde providers.jsx não registra.
async function getRegistration() {
  await navigator.serviceWorker.register("/sw.js");
  return navigator.serviceWorker.ready;
}

export async function fetchPushConfig() {
  const response = await fetch("/api/public/push/config");
  if (!response.ok) return { enabled: false, publicKey: null };
  return response.json();
}

export async function getExistingSubscription() {
  if (!isPushSupported()) return null;
  const registration = await navigator.serviceWorker.getRegistration();
  if (!registration) return null;
  return registration.pushManager.getSubscription();
}

/**
 * Pede permissão e inscreve o navegador.
 * Precisa ser chamada a partir de um clique — os navegadores recusam
 * requestPermission() fora de um gesto do usuário.
 */
export async function subscribeToPush() {
  if (!isPushSupported()) {
    throw new Error("Este navegador não suporta notificações.");
  }

  const { enabled, publicKey } = await fetchPushConfig();
  if (!enabled || !publicKey) {
    throw new Error("As notificações ainda não foram configuradas.");
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    throw new Error("Permissão negada.");
  }

  const registration = await getRegistration();

  // Se já existe inscrição, reaproveita: criar outra geraria endpoint novo e
  // uma linha duplicada no banco.
  const existing = await registration.pushManager.getSubscription();
  const subscription =
    existing ||
    (await registration.pushManager.subscribe({
      // Obrigatório nos navegadores atuais: nada de push silencioso.
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    }));

  const response = await fetch("/api/public/push/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(subscription.toJSON()),
  });

  if (!response.ok) {
    throw new Error("Não foi possível salvar sua inscrição.");
  }

  return subscription;
}

export async function unsubscribeFromPush() {
  const subscription = await getExistingSubscription();
  if (!subscription) return;

  const { endpoint } = subscription;
  await subscription.unsubscribe().catch(() => {});

  await fetch("/api/public/push/unsubscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ endpoint }),
  }).catch(() => {});
}

export function wasRecentlyDismissed() {
  if (typeof window === "undefined") return false;
  try {
    const raw = window.localStorage.getItem(PUSH_DISMISSED_KEY);
    if (!raw) return false;
    const days = (Date.now() - Number(raw)) / (24 * 60 * 60 * 1000);
    return Number.isFinite(days) && days < PUSH_DISMISS_DAYS;
  } catch {
    return false;
  }
}

export function markDismissed() {
  try {
    window.localStorage.setItem(PUSH_DISMISSED_KEY, String(Date.now()));
  } catch {
    // Navegação anônima com storage bloqueado: sem memória do "não agora",
    // mas o convite continua fechável.
  }
}
