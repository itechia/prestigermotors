// Analítico próprio do site (painel do admin).
// Regras:
// - Só registra depois que o visitante ACEITA os cookies no aviso de LGPD.
// - Não guarda nada que identifique a pessoa: apenas um id aleatório de sessão
//   e um id aleatório de visitante, ambos gerados no navegador.
// - Os eventos vão em lote para /api/track, que grava no Supabase.
import { CONSENT_EVENT, readConsent } from "@/lib/cookieConsent";

const SESSION_KEY = "pm:sid";
const VISITOR_KEY = "pm:vid";
const ORIGIN_KEY = "pm:origem";
const FLUSH_DELAY = 1200;
const MAX_BATCH = 20;

// Endereço e referrer de ENTRADA, lidos assim que o app carrega. Depois de uma
// navegação interna o ?ref= some da barra de endereços, então guardar aqui é o
// que permite creditar a visita inteira à origem certa — mesmo quando o
// visitante só aceita os cookies alguns cliques depois.
const ENTRY_SEARCH = typeof window !== "undefined" ? window.location.search : "";
const ENTRY_REFERRER = typeof document !== "undefined" ? document.referrer : "";

let queue = [];
let origemDetectada = null;
let flushTimer = null;
let listenersReady = false;

function randomId() {
  try {
    return crypto.randomUUID();
  } catch {
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  }
}

function readOrCreate(storage, key) {
  try {
    const existing = storage.getItem(key);
    if (existing) return existing;
    const created = randomId();
    storage.setItem(key, created);
    return created;
  } catch {
    // Navegador sem armazenamento: mantém um id só para esta aba, em memória.
    return null;
  }
}

let memorySessionId = null;

function getSessionId() {
  if (typeof window === "undefined") return null;
  const stored = readOrCreate(window.sessionStorage, SESSION_KEY);
  if (stored) return stored;
  if (!memorySessionId) memorySessionId = randomId();
  return memorySessionId;
}

function getVisitorId() {
  if (typeof window === "undefined") return null;
  return readOrCreate(window.localStorage, VISITOR_KEY);
}

function getDevice() {
  if (typeof window === "undefined") return null;
  const w = window.innerWidth;
  if (w < 768) return "mobile";
  if (w < 1024) return "tablet";
  return "desktop";
}

function getReferrerHost() {
  try {
    const ref = ENTRY_REFERRER;
    if (!ref) return "";
    const host = new URL(ref).hostname;
    return host === window.location.hostname ? "" : host;
  } catch {
    return "";
  }
}

// Domínios intermediários que os apps usam ao abrir um link.
const HOSTS_CONHECIDOS = [
  [/(^|\.)(wa\.me|whatsapp\.com)$/i, "whatsapp"],
  [/(^|\.)instagram\.com$/i, "instagram"],
  [/(^|\.)(facebook\.com|fb\.com|fb\.me)$/i, "facebook"],
  [/(^|\.)google\./i, "google"],
  [/(^|\.)(bing\.com|duckduckgo\.com)$/i, "buscador"],
  [/(^|\.)(t\.co|twitter\.com|x\.com)$/i, "x"],
  [/(^|\.)(youtube\.com|youtu\.be)$/i, "youtube"],
  [/(^|\.)(tiktok\.com)$/i, "tiktok"],
  [/(^|\.)(linkedin\.com|lnkd\.in)$/i, "linkedin"],
];

// De onde veio a visita.
//
// O navegador embutido do WhatsApp (e o do Instagram) NÃO envia referrer, então
// tudo caía como "direto". A ordem é:
//   1) ?ref= / utm_source do link que a própria loja compartilhou;
//   2) user agent do navegador embutido do app;
//   3) referrer normal, normalizado para um nome amigável.
// O resultado fica guardado na sessão: o parâmetro só existe na primeira
// página, mas a origem vale para a visita inteira.
function detectOrigin() {
  try {
    const params = new URLSearchParams(ENTRY_SEARCH);
    const marcado = params.get("ref") || params.get("utm_source");
    if (marcado) return marcado.trim().toLowerCase().slice(0, 40);
  } catch {
    // segue para as outras pistas
  }

  const ua = navigator.userAgent || "";
  if (/WhatsApp/i.test(ua)) return "whatsapp";
  if (/Instagram/i.test(ua)) return "instagram";
  if (/FBAN|FBAV|FB_IAB/i.test(ua)) return "facebook";

  const host = getReferrerHost();
  if (!host) return "";
  const conhecido = HOSTS_CONHECIDOS.find(([padrao]) => padrao.test(host));
  return conhecido ? conhecido[1] : host;
}

function getOrigin() {
  if (typeof window === "undefined") return "";

  // Já creditada nesta sessão (inclusive de uma carga de página anterior).
  try {
    const guardado = window.sessionStorage.getItem(ORIGIN_KEY);
    if (guardado) return guardado;
  } catch {
    // sem storage: vale só o que está em memória
  }

  if (origemDetectada === null) origemDetectada = detectOrigin();

  // Só grava quando há algo a creditar; "" continua sendo recalculado caso o
  // visitante volte por um link marcado na mesma aba.
  if (origemDetectada) {
    try {
      window.sessionStorage.setItem(ORIGIN_KEY, origemDetectada);
    } catch {
      // ignora
    }
  }

  return origemDetectada;
}

export function analyticsEnabled() {
  return typeof window !== "undefined" && readConsent() === "granted";
}

function flush({ beacon = false } = {}) {
  if (flushTimer) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }
  if (queue.length === 0) return;

  const events = queue.slice(0, MAX_BATCH);
  queue = queue.slice(MAX_BATCH);
  const body = JSON.stringify({ events });

  try {
    if (beacon && navigator.sendBeacon) {
      navigator.sendBeacon("/api/track", new Blob([body], { type: "application/json" }));
    } else {
      fetch("/api/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
        keepalive: true,
      }).catch(() => {});
    }
  } catch {
    // Analítico nunca pode quebrar a navegação do visitante.
  }

  if (queue.length > 0) flush({ beacon });
}

function ensureListeners() {
  if (listenersReady || typeof window === "undefined") return;
  listenersReady = true;

  // Envia o que estiver pendente quando a aba é fechada ou vai para segundo plano.
  window.addEventListener("pagehide", () => flush({ beacon: true }));
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") flush({ beacon: true });
  });
  // Se o visitante recusar depois de aceitar, descarta o que ainda não foi enviado.
  window.addEventListener(CONSENT_EVENT, (event) => {
    if (event.detail !== "granted") queue = [];
  });
}

export function track(eventType, payload = {}) {
  if (!analyticsEnabled()) return;
  ensureListeners();

  const { vehicle, vehicleId, label, durationMs, ...metadata } = payload;

  queue.push({
    event_type: eventType,
    session_id: getSessionId(),
    visitor_id: getVisitorId(),
    vehicle_id: vehicleId || vehicle?.id || null,
    path: window.location.pathname,
    device: getDevice(),
    duration_ms: Number.isFinite(durationMs) ? Math.round(durationMs) : null,
    metadata: {
      ...metadata,
      ...(label || vehicle
        ? { label: label || [vehicle?.brand, vehicle?.model, vehicle?.version].filter(Boolean).join(" ") }
        : {}),
      referrer_host: getOrigin(),
    },
  });

  if (flushTimer) clearTimeout(flushTimer);
  flushTimer = setTimeout(() => flush(), FLUSH_DELAY);
}

// Executa o registro agora, se o visitante já aceitou os cookies, ou no
// instante em que ele aceitar.
//
// Sem isso, tudo que acontece antes do aceite se perdia: a página de entrada e
// o primeiro veículo aberto nunca eram contados, porque o efeito que registra
// roda uma única vez na montagem — bem antes de o visitante clicar em
// "Aceitar todos". Devolve a função de limpeza do listener.
export function trackWhenAllowed(registrar) {
  let registrado = false;

  const tentar = () => {
    if (registrado || !analyticsEnabled()) return;
    registrado = true;
    registrar();
  };

  tentar();
  if (registrado || typeof window === "undefined") return () => {};

  window.addEventListener(CONSENT_EVENT, tentar);
  return () => window.removeEventListener(CONSENT_EVENT, tentar);
}

// Mede o tempo realmente visível numa página de veículo (ignora aba em segundo
// plano) e envia o total quando o visitante sai. Devolve a função de parada.
export function startVisibleTimer() {
  if (typeof document === "undefined") return () => 0;

  let total = 0;
  let startedAt = document.visibilityState === "visible" ? Date.now() : null;

  const onVisibility = () => {
    if (document.visibilityState === "visible") {
      startedAt = Date.now();
    } else if (startedAt) {
      total += Date.now() - startedAt;
      startedAt = null;
    }
  };

  document.addEventListener("visibilitychange", onVisibility);

  return function stop() {
    document.removeEventListener("visibilitychange", onVisibility);
    if (startedAt) total += Date.now() - startedAt;
    return total;
  };
}
