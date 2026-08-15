import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { z } from "zod";
import { postJsonWebhook, readLimitedJson, takeRateLimit } from "../_utils/webhookSecurity";

export const runtime = "nodejs";

const requestSchema = z.object({ lead_id: z.string().uuid() });

const SETTINGS_COLS = [
  "store_name", "whatsapp_number", "phone_number",
  "sell_webhook_enabled", "sell_webhook_url",
  "sell_webhook_auth_enabled", "sell_webhook_auth_user", "sell_webhook_auth_pass",
].join(",");

const LEAD_COLS = [
  "id", "owner_name", "owner_email", "owner_phone", "owner_city",
  "brand", "model", "version", "year", "manufacture_year", "mileage",
  "fuel_type", "transmission", "color", "condition_notes", "asking_price",
  "images", "status", "created_date",
].join(",");

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Servico indisponivel.");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

function buildAuthHeader(settings) {
  if (!settings.sell_webhook_auth_enabled || !settings.sell_webhook_auth_user) return {};
  const token = Buffer.from(
    `${settings.sell_webhook_auth_user}:${settings.sell_webhook_auth_pass || ""}`
  ).toString("base64");
  return { Authorization: `Basic ${token}` };
}

export async function POST(request) {
  const rate = takeRateLimit(request);
  if (!rate.allowed) {
    return NextResponse.json(
      { error: "Muitas tentativas. Aguarde e tente novamente." },
      { status: 429, headers: { "Retry-After": String(rate.retryAfter) } }
    );
  }

  try {
    const parsed = requestSchema.safeParse(await readLimitedJson(request));
    if (!parsed.success) {
      return NextResponse.json({ error: "Dados invalidos." }, { status: 400 });
    }

    const supabase = getSupabase();
    const [{ data: settings }, { data: lead }] = await Promise.all([
      supabase.from("store_settings").select(SETTINGS_COLS).limit(1).maybeSingle(),
      supabase.from("sell_leads").select(LEAD_COLS).eq("id", parsed.data.lead_id).maybeSingle(),
    ]);

    if (!settings?.sell_webhook_enabled || !settings?.sell_webhook_url) {
      return NextResponse.json({ ok: true, skipped: true });
    }
    if (!lead) {
      return NextResponse.json({ error: "Proposta nao encontrada." }, { status: 404 });
    }

    const payload = {
      type: "sell_lead",
      sent_at: new Date().toISOString(),
      store: {
        name: settings.store_name,
        whatsapp: settings.whatsapp_number,
        phone: settings.phone_number,
      },
      lead: { ...lead, images: lead.images || [] },
    };

    const response = await postJsonWebhook(
      settings.sell_webhook_url,
      payload,
      buildAuthHeader(settings)
    );

    return NextResponse.json({ ok: response.ok, status: response.status });
  } catch (error) {
    const status = error?.name === "AbortError" ? 504 : 500;
    return NextResponse.json({ error: "Nao foi possivel enviar a proposta." }, { status });
  }
}
