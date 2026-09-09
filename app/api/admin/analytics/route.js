import { NextResponse } from "next/server";
import { requireAdminContext } from "../_utils";

export const dynamic = "force-dynamic";

const ALLOWED_PERIODS = [7, 15, 30, 90, 180, 365];
const MAX_RANGE_DAYS = 730;
const DAY_MS = 24 * 60 * 60 * 1000;

function parseDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

// Resolve o intervalo pedido: datas explícitas (período personalizado) ou
// os últimos N dias.
function resolveRange(searchParams) {
  const from = parseDate(searchParams.get("from"));
  const to = parseDate(searchParams.get("to"));

  if (from && to) {
    const start = from <= to ? from : to;
    let end = from <= to ? to : from;
    // Limita a janela para não varrer a tabela inteira sem necessidade.
    if (end.getTime() - start.getTime() > MAX_RANGE_DAYS * DAY_MS) {
      end = new Date(start.getTime() + MAX_RANGE_DAYS * DAY_MS);
    }
    if (end > new Date()) end = new Date();
    return { from: start, to: end, custom: true };
  }

  const requested = Number(searchParams.get("days"));
  const days = ALLOWED_PERIODS.includes(requested) ? requested : 30;
  return {
    from: new Date(Date.now() - days * DAY_MS),
    to: new Date(),
    days,
    custom: false,
  };
}

// Todas as métricas do painel vêm de uma única função no banco
// (admin_analytics_range), executada com a service role — a tabela de eventos
// não é exposta ao cliente.
export async function GET(request) {
  const ctx = await requireAdminContext(request, {
    adminOnly: true,
    moduleKey: "analitico",
  });
  if (ctx.error) return ctx.error;

  const range = resolveRange(new URL(request.url).searchParams);

  const { data, error } = await ctx.supabase.rpc("admin_analytics_range", {
    p_from: range.from.toISOString(),
    p_to: range.to.toISOString(),
  });

  if (error) {
    return NextResponse.json(
      { error: "Falha ao carregar o analítico." },
      { status: 500 }
    );
  }

  return NextResponse.json({
    analytics: data,
    days: range.days ?? null,
    custom: range.custom,
    from: range.from.toISOString(),
    to: range.to.toISOString(),
  });
}
