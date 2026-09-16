import { NextResponse } from "next/server";
import { getServiceSupabase } from "../../../admin/_utils";
import { readLimitedJson, takeRateLimit } from "../../../_utils/webhookSecurity";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// O endpoint vem do serviço de push do próprio navegador. Hoje os maiores são
// fcm.googleapis.com (Chrome/Edge/Android), updates.push.services.mozilla.com
// e web.push.apple.com. Não fixamos a lista de domínios — navegadores novos
// aparecem — mas exigimos https e um tamanho de gente.
const MAX_ENDPOINT_LENGTH = 1000;
const MAX_KEY_LENGTH = 300;

function isValidEndpoint(value) {
  if (typeof value !== "string") return false;
  if (value.length < 20 || value.length > MAX_ENDPOINT_LENGTH) return false;
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

function isValidKey(value) {
  return typeof value === "string" && value.length > 0 && value.length <= MAX_KEY_LENGTH;
}

// Só para o admin saber de que tipo de aparelho vêm as inscrições. Não
// identifica ninguém.
function detectDevice(userAgent = "") {
  const ua = userAgent.toLowerCase();
  if (/ipad|tablet|playbook|silk|(android(?!.*mobile))/.test(ua)) return "tablet";
  if (/mobile|iphone|ipod|android|blackberry|iemobile|opera mini/.test(ua)) return "mobile";
  return "desktop";
}

// Endpoint público: registra a inscrição anônima do navegador.
//
// Não há login nem cadastro. O visitante clica em "Permitir", o navegador
// devolve um endpoint e duas chaves, e é só isso que guardamos — nenhum nome,
// e-mail ou telefone passa por aqui.
export async function POST(request) {
  const rate = takeRateLimit(request, { limit: 20, windowMs: 60_000 });
  if (!rate.allowed) {
    return NextResponse.json(
      { error: "Muitas tentativas. Tente novamente em instantes." },
      { status: 429, headers: { "Retry-After": String(rate.retryAfter) } }
    );
  }

  const body = await readLimitedJson(request).catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Corpo invalido." }, { status: 400 });
  }

  const endpoint = body.endpoint;
  const p256dh = body.keys?.p256dh;
  const auth = body.keys?.auth;

  if (!isValidEndpoint(endpoint) || !isValidKey(p256dh) || !isValidKey(auth)) {
    return NextResponse.json({ error: "Inscricao invalida." }, { status: 400 });
  }

  const userAgent = (request.headers.get("user-agent") || "").slice(0, 300);
  const now = new Date().toISOString();

  const supabase = getServiceSupabase();

  // O mesmo navegador pode reinscrever (o serviço de push renova o endpoint
  // de tempos em tempos). O upsert pelo endpoint evita linha duplicada e
  // reativa quem tinha saído da lista.
  const { error } = await supabase
    .from("push_subscriptions")
    .upsert(
      {
        endpoint,
        p256dh,
        auth,
        user_agent: userAgent || null,
        device: detectDevice(userAgent),
        active: true,
        last_seen_at: now,
        last_error: null,
      },
      { onConflict: "endpoint" }
    );

  if (error) {
    return NextResponse.json({ error: "Nao foi possivel salvar a inscricao." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
