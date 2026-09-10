import { NextResponse } from "next/server";
import { getServiceSupabase } from "../admin/_utils";
import { takeRateLimit } from "../_utils/webhookSecurity";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED_EVENTS = new Set([
  "page_view",
  "vehicle_view",
  "vehicle_time",
  "interest_click",
  "interest_submit",
  "whatsapp_click",
  "share_click",
  "gallery_open",
  "search",
  "filter",
  "sell_lead_submit",
]);

const ALLOWED_DEVICES = new Set(["mobile", "tablet", "desktop"]);
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_EVENTS = 20;
const MAX_BODY_BYTES = 32 * 1024;
const ONE_HOUR_MS = 60 * 60 * 1000;

function text(value, max) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, max);
}

// Só deixa passar chaves conhecidas e valores curtos: o corpo vem do navegador.
function sanitizeMetadata(metadata) {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return {};
  const allowed = ["label", "term", "field", "value", "referrer_host", "source"];
  const clean = {};
  for (const key of allowed) {
    const cleaned = text(metadata[key], 120);
    if (cleaned) clean[key] = cleaned;
  }
  return clean;
}

function sanitizeEvent(raw) {
  if (!raw || typeof raw !== "object") return null;

  const eventType = text(raw.event_type, 40);
  const sessionId = text(raw.session_id, 64);
  if (!eventType || !sessionId || !ALLOWED_EVENTS.has(eventType)) return null;

  const vehicleId = typeof raw.vehicle_id === "string" && UUID_RE.test(raw.vehicle_id)
    ? raw.vehicle_id
    : null;

  const device = ALLOWED_DEVICES.has(raw.device) ? raw.device : null;
  const duration = Number(raw.duration_ms);

  return {
    session_id: sessionId,
    visitor_id: text(raw.visitor_id, 64),
    event_type: eventType,
    vehicle_id: vehicleId,
    path: text(raw.path, 300),
    device,
    duration_ms: Number.isFinite(duration) && duration > 0
      ? Math.min(Math.round(duration), ONE_HOUR_MS)
      : null,
    metadata: sanitizeMetadata(raw.metadata),
  };
}

// Endpoint público: recebe os eventos de navegação do catálogo.
// O front só chama quando o visitante aceitou os cookies.
export async function POST(request) {
  // O rastreador manda em lotes a cada ~1,2s. O limite é por IP, e vários
  // visitantes podem dividir o mesmo IP (operadora, wi-fi de loja), então fica
  // folgado: corta quem tenta inflar a tabela sem perder evento de uso normal.
  const rate = takeRateLimit(request, { limit: 120, windowMs: 60_000 });
  if (!rate.allowed) {
    return NextResponse.json(
      { ok: false },
      { status: 429, headers: { "Retry-After": String(rate.retryAfter) } }
    );
  }

  try {
    const raw = await request.text();
    if (!raw || raw.length > MAX_BODY_BYTES) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    const body = JSON.parse(raw);
    const events = Array.isArray(body?.events) ? body.events.slice(0, MAX_EVENTS) : [];
    const rows = events.map(sanitizeEvent).filter(Boolean);

    if (rows.length === 0) return NextResponse.json({ ok: true, saved: 0 });

    const supabase = getServiceSupabase();
    const { error } = await supabase.from("site_events").insert(rows);
    if (error) throw error;

    return NextResponse.json({ ok: true, saved: rows.length });
  } catch {
    // Falha no analítico nunca deve aparecer para o visitante.
    return NextResponse.json({ ok: false }, { status: 202 });
  }
}
