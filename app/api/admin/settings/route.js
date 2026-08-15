import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { requireAdminContext } from "../_utils";
import { readLimitedJson } from "../../_utils/webhookSecurity";

const PROTECTED_FIELDS = new Set(["id", "created_date", "updated_date", "created_by"]);

export async function GET(request) {
  const ctx = await requireAdminContext(request, {
    adminOnly: true,
    moduleKey: "configuracoes",
  });
  if (ctx.error) return ctx.error;

  const { data, error } = await ctx.supabase
    .from("store_settings")
    .select("*")
    .order("updated_date", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) return NextResponse.json({ error: "Falha ao carregar configuracoes." }, { status: 500 });
  return NextResponse.json({ settings: data ?? null });
}

export async function PATCH(request) {
  const ctx = await requireAdminContext(request, {
    adminOnly: true,
    moduleKey: "configuracoes",
  });
  if (ctx.error) return ctx.error;

  try {
    const body = await readLimitedJson(request, 256 * 1024);
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json({ error: "Dados invalidos." }, { status: 400 });
    }

    const payload = Object.fromEntries(
      Object.entries(body).filter(([key]) => !PROTECTED_FIELDS.has(key))
    );
    const now = new Date().toISOString();

    const { data: current, error: currentError } = await ctx.supabase
      .from("store_settings")
      .select("id")
      .limit(1)
      .maybeSingle();
    if (currentError) throw currentError;

    const query = current?.id
      ? ctx.supabase
          .from("store_settings")
          .update({ ...payload, updated_date: now })
          .eq("id", current.id)
      : ctx.supabase.from("store_settings").insert({
          id: crypto.randomUUID(),
          ...payload,
          created_date: now,
          updated_date: now,
        });

    const { data, error } = await query.select("*").single();
    if (error) throw error;
    revalidateTag("public-settings");
    revalidateTag("public-taxonomies");
    return NextResponse.json({ settings: data });
  } catch {
    return NextResponse.json({ error: "Falha ao salvar configuracoes." }, { status: 500 });
  }
}
