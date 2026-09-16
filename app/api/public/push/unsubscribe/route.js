import { NextResponse } from "next/server";
import { getServiceSupabase } from "../../../admin/_utils";
import { readLimitedJson, takeRateLimit } from "../../../_utils/webhookSecurity";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Endpoint público: o visitante desligou as notificações.
//
// Apagamos a linha em vez de marcar inativa — quem pediu para sair não deveria
// continuar numa tabela nossa, e o endpoint não serve para mais nada.
export async function POST(request) {
  const rate = takeRateLimit(request, { limit: 20, windowMs: 60_000 });
  if (!rate.allowed) {
    return NextResponse.json(
      { error: "Muitas tentativas. Tente novamente em instantes." },
      { status: 429, headers: { "Retry-After": String(rate.retryAfter) } }
    );
  }

  const body = await readLimitedJson(request).catch(() => null);
  const endpoint = body?.endpoint;

  if (typeof endpoint !== "string" || !endpoint) {
    return NextResponse.json({ error: "Inscricao invalida." }, { status: 400 });
  }

  const supabase = getServiceSupabase();
  const { error } = await supabase.from("push_subscriptions").delete().eq("endpoint", endpoint);

  if (error) {
    return NextResponse.json({ error: "Nao foi possivel cancelar a inscricao." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
