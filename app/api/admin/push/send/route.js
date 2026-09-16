import { NextResponse } from "next/server";
import { requireAdminContext, writeAdminLog } from "../../_utils";
import { isPushConfigured, sendPushToSubscriptions } from "../../../_utils/pushSender";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Envio em lote leva alguns segundos com muitos inscritos; o padrão da
// Vercel (10s) é curto demais para isso.
export const maxDuration = 60;

const MAX_TITLE = 80;
const MAX_BODY = 300;
// Teto por disparo. Acima disso a Function estoura o tempo e o envio ficaria
// pela metade sem ninguém saber — melhor recusar e avisar.
const MAX_RECIPIENTS = 2000;

// O link só pode ser um caminho do próprio site ("/", "/veiculo/civic-2020").
// URL externa em notificação é vetor de phishing se uma conta admin vazar, e
// não há caso de uso aqui que precise disso.
function normalizeUrl(raw) {
  const value = String(raw || "").trim();
  if (!value) return "/";
  if (!value.startsWith("/") || value.startsWith("//")) return null;
  return value.slice(0, 300);
}

export async function POST(request) {
  const ctx = await requireAdminContext(request, {
    adminOnly: true,
    moduleKey: "notificacoes",
  });
  if (ctx.error) return ctx.error;

  const { supabase, actorUser: actor } = ctx;

  if (!isPushConfigured()) {
    return NextResponse.json(
      { error: "Chaves VAPID nao configuradas. Rode 'npm run push:keys' e adicione as variaveis na Vercel." },
      { status: 503 }
    );
  }

  const body = await request.json().catch(() => ({}));

  const message = String(body.body || "").trim();
  if (!message) {
    return NextResponse.json({ error: "Escreva a mensagem da notificacao." }, { status: 400 });
  }
  if (message.length > MAX_BODY) {
    return NextResponse.json({ error: `A mensagem passa de ${MAX_BODY} caracteres.` }, { status: 400 });
  }

  const url = normalizeUrl(body.url);
  if (url === null) {
    return NextResponse.json({ error: "O link deve ser um caminho do site, comecando com /." }, { status: 400 });
  }

  // O título e a logo saem das configurações da loja: o dono muda a logo em
  // Configurações e a notificação acompanha, sem tocar em código.
  const { data: settings } = await supabase
    .from("store_settings")
    .select("store_name,logo_url")
    .order("updated_date", { ascending: false })
    .limit(1)
    .maybeSingle();

  const storeName = (settings?.store_name || "Prestiger Motors").slice(0, MAX_TITLE);
  const iconUrl = settings?.logo_url || "/icon-192.png";

  const payload = {
    title: storeName,
    body: message,
    url,
    icon: iconUrl,
    badge: "/icon-192.png",
    tag: `pm-${Date.now()}`,
  };

  // Teste: manda só para o navegador do próprio admin, sem gravar campanha
  // nem incomodar a lista inteira.
  const testEndpoint = typeof body.test_endpoint === "string" ? body.test_endpoint : "";
  if (testEndpoint) {
    const { data: own } = await supabase
      .from("push_subscriptions")
      .select("endpoint,p256dh,auth")
      .eq("endpoint", testEndpoint)
      .eq("active", true)
      .maybeSingle();

    if (!own) {
      return NextResponse.json(
        { error: "Este navegador nao esta inscrito. Ative as notificacoes nele primeiro." },
        { status: 400 }
      );
    }

    const testResult = await sendPushToSubscriptions([own], payload);
    if (testResult.sent === 0) {
      return NextResponse.json(
        { error: testResult.lastError || "Falha ao enviar o teste." },
        { status: 502 }
      );
    }
    return NextResponse.json({ test: true, sent: testResult.sent });
  }

  const { data: subscriptions = [], error: loadError } = await supabase
    .from("push_subscriptions")
    .select("endpoint,p256dh,auth")
    .eq("active", true)
    .limit(MAX_RECIPIENTS + 1);

  if (loadError) {
    return NextResponse.json({ error: "Falha ao carregar as inscricoes." }, { status: 500 });
  }

  if (subscriptions.length === 0) {
    return NextResponse.json({ error: "Nenhum aparelho inscrito ainda." }, { status: 400 });
  }

  if (subscriptions.length > MAX_RECIPIENTS) {
    return NextResponse.json(
      { error: `A lista passou de ${MAX_RECIPIENTS} aparelhos. Fale com o desenvolvedor para dividir o envio em lotes.` },
      { status: 413 }
    );
  }

  const result = await sendPushToSubscriptions(subscriptions, payload);

  // Endpoints que o navegador já descartou (404/410) saem da lista: manter
  // significa tentar de novo em todo envio, de graça.
  if (result.expiredEndpoints.length > 0) {
    await supabase.from("push_subscriptions").delete().in("endpoint", result.expiredEndpoints);
  }

  const { data: campaign } = await supabase
    .from("push_campaigns")
    .insert({
      title: storeName,
      body: message,
      url,
      icon_url: iconUrl,
      target_count: subscriptions.length,
      sent_count: result.sent,
      failed_count: result.failed,
      expired_count: result.expired,
      created_by: actor.id,
    })
    .select("id,title,body,url,target_count,sent_count,failed_count,expired_count,created_at")
    .single();

  await writeAdminLog(supabase, {
    actorId: actor.id,
    action: "notificacao_enviada",
    details: {
      campaign_id: campaign?.id ?? null,
      body: message,
      url,
      target_count: subscriptions.length,
      sent_count: result.sent,
      failed_count: result.failed,
    },
  });

  return NextResponse.json({
    campaign: campaign || null,
    sent: result.sent,
    failed: result.failed,
    expired: result.expired,
  });
}
