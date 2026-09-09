// Analítico próprio do site (painel do admin).
// Regras:
// - Só registra depois que o visitante ACEITA os cookies no aviso de LGPD.
// - Não guarda nada que identifique a pessoa: apenas um id aleatório de sessão
//   e um id aleatório de visitante, ambos gerados no navegador.
// - Os eventos vão em lote para /api/track, que grava no Supabase.
import { CONSENT_EVENT, readConsent } from "@/lib/cookieConsent";

const SESSION_KEY = "pm:sid";
const VISITOR_KEY = "pm:vid";
const FLUSH_DELAY = 1200;
const MAX_BATCH = 20;

let queue = [];
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
    const ref = document.referrer;
    if (!ref) return "";
    const host = new URL(ref).hostname;
    return host === window.location.hostname ? "" : host;
  } catch {
    return "";
  }
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
      referrer_host: getReferrerHost(),
    },
  });

  if (flushTimer) clearTimeout(flushTimer);
  flushTimer = setTimeout(() => flush(), FLUSH_DELAY);
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
