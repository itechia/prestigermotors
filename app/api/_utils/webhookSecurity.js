import { lookup } from "node:dns/promises";
import net from "node:net";

const RATE_LIMIT_STORE = Symbol.for("prestiger.webhookRateLimitStore");
const MAX_BODY_BYTES = 32 * 1024;

function isPrivateIp(address) {
  const family = net.isIP(address);
  if (family === 4) {
    const [a, b] = address.split(".").map(Number);
    return (
      a === 0 ||
      a === 10 ||
      a === 127 ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168)
    );
  }

  if (family === 6) {
    const normalized = address.toLowerCase();
    return (
      normalized === "::" ||
      normalized === "::1" ||
      normalized.startsWith("fc") ||
      normalized.startsWith("fd") ||
      normalized.startsWith("fe80:")
    );
  }

  return true;
}

export async function assertSafeWebhookUrl(rawUrl) {
  let parsed;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new Error("URL invalida.");
  }

  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new Error("Use apenas URLs HTTP ou HTTPS.");
  }
  if (parsed.username || parsed.password) {
    throw new Error("Credenciais devem ser configuradas no Basic Auth.");
  }

  const hostname = parsed.hostname.toLowerCase();
  if (hostname === "localhost" || hostname.endsWith(".localhost")) {
    throw new Error("URLs locais nao sao permitidas.");
  }
  if (net.isIP(hostname) && isPrivateIp(hostname)) {
    throw new Error("URLs privadas ou locais nao sao permitidas.");
  }

  const addresses = await lookup(hostname, { all: true, verbatim: false });
  if (!addresses.length || addresses.some(({ address }) => isPrivateIp(address))) {
    throw new Error("O destino resolve para uma rede privada ou local.");
  }

  return parsed.toString();
}

export async function postJsonWebhook(rawUrl, payload, headers = {}) {
  const safeUrl = await assertSafeWebhookUrl(rawUrl);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    return await fetch(safeUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify(payload),
      redirect: "error",
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}

export async function readLimitedJson(request, maxBytes = MAX_BODY_BYTES) {
  const declaredLength = Number(request.headers.get("content-length") || 0);
  if (declaredLength > maxBytes) throw new Error("Requisicao muito grande.");

  const raw = await request.text();
  if (Buffer.byteLength(raw, "utf8") > maxBytes) {
    throw new Error("Requisicao muito grande.");
  }

  try {
    return JSON.parse(raw || "{}");
  } catch {
    throw new Error("JSON invalido.");
  }
}

export function takeRateLimit(request, { limit = 12, windowMs = 60_000 } = {}) {
  const forwarded = request.headers.get("x-forwarded-for") || "";
  const key = forwarded.split(",")[0].trim() || request.headers.get("x-real-ip") || "unknown";
  const now = Date.now();
  const store = globalThis[RATE_LIMIT_STORE] || new Map();
  globalThis[RATE_LIMIT_STORE] = store;

  const current = store.get(key);
  if (!current || current.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, retryAfter: 0 };
  }

  current.count += 1;
  return {
    allowed: current.count <= limit,
    remaining: Math.max(0, limit - current.count),
    retryAfter: Math.max(1, Math.ceil((current.resetAt - now) / 1000)),
  };
}
