import { NextResponse } from "next/server";
import { requireAdminContext } from "../_utils";
import { isPushConfigured } from "../../_utils/pushSender";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const HISTORY_LIMIT = 20;

// Painel de notificações: quantos aparelhos estão inscritos e o que já foi
// enviado. A lista de endpoints em si nunca sai do servidor — o admin não
// precisa dela e ela não diz nada de útil.
export async function GET(request) {
  const ctx = await requireAdminContext(request, {
    adminOnly: true,
    moduleKey: "notificacoes",
  });
  if (ctx.error) return ctx.error;

  const { supabase } = ctx;

  const [subscriptionsResult, campaignsResult, settingsResult] = await Promise.all([
    supabase.from("push_subscriptions").select("device").eq("active", true),
    supabase
      .from("push_campaigns")
      .select("id,title,body,url,target_count,sent_count,failed_count,expired_count,created_at")
      .order("created_at", { ascending: false })
      .limit(HISTORY_LIMIT),
    supabase
      .from("store_settings")
      .select("store_name,logo_url")
      .order("updated_date", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  if (subscriptionsResult.error) {
    return NextResponse.json({ error: "Falha ao carregar as inscricoes." }, { status: 500 });
  }

  const subscriptions = subscriptionsResult.data || [];
  const byDevice = { mobile: 0, tablet: 0, desktop: 0 };
  for (const row of subscriptions) {
    if (row.device && byDevice[row.device] !== undefined) byDevice[row.device] += 1;
  }

  return NextResponse.json({
    configured: isPushConfigured(),
    total: subscriptions.length,
    byDevice,
    campaigns: campaignsResult.data || [],
    store: {
      name: settingsResult.data?.store_name || "Prestiger Motors",
      logoUrl: settingsResult.data?.logo_url || "",
    },
  });
}
