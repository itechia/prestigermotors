import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminContext } from "../admin/_utils";
import { postJsonWebhook, readLimitedJson } from "../_utils/webhookSecurity";

export const runtime = "nodejs";

const requestSchema = z.object({
  kind: z.enum(["interest", "sell"]).default("interest"),
  url: z.string().url().max(2048),
  auth_enabled: z.boolean().optional(),
  auth_user: z.string().max(200).optional(),
  auth_pass: z.string().max(500).optional(),
});

const SAMPLE_PAYLOADS = {
  interest: {
    type: "interest",
    sent_at: new Date().toISOString(),
    store: { name: "Sua Loja", whatsapp: "5511999999999", phone: "1133334444" },
    vehicle: {
      id: "test-id",
      url: "https://seusite.com/veiculo/test-id",
      brand: "Toyota",
      model: "Corolla",
      version: "XEi 2.0",
      year: 2024,
      price: 145000,
      images: [],
    },
    form: { name: "Joao da Silva", phone: "+5511999999999", message: "Teste" },
  },
  sell: {
    type: "sell_lead",
    sent_at: new Date().toISOString(),
    store: { name: "Sua Loja", whatsapp: "5511999999999", phone: "1133334444" },
    lead: { id: "test-id", brand: "Honda", model: "Civic", year: 2022, images: [] },
  },
};

export async function POST(request) {
  try {
    const context = await requireAdminContext(request, {
      adminOnly: true,
      moduleKey: "configuracoes",
    });
    if (context.error) return context.error;

    const parsed = requestSchema.safeParse(await readLimitedJson(request));
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: "Dados do teste invalidos." }, { status: 400 });
    }

    const { kind, url, auth_enabled, auth_user, auth_pass } = parsed.data;
    const headers = {};
    if (auth_enabled && auth_user) {
      headers.Authorization = `Basic ${Buffer.from(`${auth_user}:${auth_pass || ""}`).toString("base64")}`;
    }

    const response = await postJsonWebhook(url, SAMPLE_PAYLOADS[kind], headers);
    return NextResponse.json({ ok: response.ok, status: response.status });
  } catch (error) {
    const message = error?.name === "AbortError" ? "Tempo limite ao chamar o webhook." : error.message;
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
