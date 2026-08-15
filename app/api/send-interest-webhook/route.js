import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { z } from "zod";
import { postJsonWebhook, readLimitedJson, takeRateLimit } from "../_utils/webhookSecurity";

export const runtime = "nodejs";

const formValueSchema = z.union([
  z.string().max(4000),
  z.number().finite(),
  z.boolean(),
  z.null(),
]);

const requestSchema = z.object({
  vehicle_id: z.string().uuid(),
  form_data: z.record(formValueSchema).refine((value) => Object.keys(value).length <= 30),
});

const SETTINGS_COLS = [
  "store_name", "whatsapp_number", "phone_number",
  "interest_webhook_enabled", "interest_webhook_url",
  "interest_webhook_auth_enabled", "interest_webhook_auth_user",
  "interest_webhook_auth_pass",
].join(",");

const VEHICLE_COLS = [
  "id", "brand", "model", "version", "year", "manufacture_year",
  "price", "price_old", "mileage", "fuel_type", "transmission",
  "color", "body_type", "condition", "status", "featured", "images", "features",
].join(",");

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Servico indisponivel.");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

function buildAuthHeader(settings) {
  if (!settings.interest_webhook_auth_enabled || !settings.interest_webhook_auth_user) return {};
  const token = Buffer.from(
    `${settings.interest_webhook_auth_user}:${settings.interest_webhook_auth_pass || ""}`
  ).toString("base64");
  return { Authorization: `Basic ${token}` };
}

function buildYearDisplay(manufacture, model) {
  if (manufacture && model && manufacture !== model) return `${manufacture}/${model}`;
  return String(model || manufacture || "");
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

    const { vehicle_id, form_data } = parsed.data;
    const supabase = getSupabase();
    const [{ data: settings }, { data: vehicle }] = await Promise.all([
      supabase.from("store_settings").select(SETTINGS_COLS).limit(1).maybeSingle(),
      supabase.from("vehicles").select(VEHICLE_COLS).eq("id", vehicle_id).maybeSingle(),
    ]);

    if (!settings?.interest_webhook_enabled || !settings?.interest_webhook_url) {
      return NextResponse.json({ error: "Webhook de interesse nao esta ativo." }, { status: 400 });
    }
    if (!vehicle) {
      return NextResponse.json({ error: "Veiculo nao encontrado." }, { status: 404 });
    }

    const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || request.nextUrl.origin).replace(/\/$/, "");
    const payload = {
      type: "interest",
      sent_at: new Date().toISOString(),
      store: {
        name: settings.store_name,
        whatsapp: settings.whatsapp_number,
        phone: settings.phone_number,
      },
      vehicle: {
        ...vehicle,
        url: `${siteUrl}/veiculo/${vehicle.id}`,
        year_display: buildYearDisplay(vehicle.manufacture_year, vehicle.year),
        images: vehicle.images || [],
        features: vehicle.features || [],
      },
      form: form_data,
    };

    const response = await postJsonWebhook(
      settings.interest_webhook_url,
      payload,
      buildAuthHeader(settings)
    );

    return NextResponse.json({ ok: response.ok, status: response.status });
  } catch (error) {
    const status = error?.name === "AbortError" ? 504 : 500;
    return NextResponse.json({ error: "Nao foi possivel enviar o interesse." }, { status });
  }
}
