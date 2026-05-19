import { NextResponse } from "next/server";
import { ADMIN_MODULES, getModuleAccessMap, requireAdminContext, writeAdminLog } from "../_utils";

export async function GET(request) {
  const ctx = await requireAdminContext(request, { superAdminOnly: true, moduleKey: null });
  if (ctx.error) return ctx.error;
  const { supabase } = ctx;

  return NextResponse.json({
    modules: ADMIN_MODULES,
    access: await getModuleAccessMap(supabase),
  });
}

export async function PATCH(request) {
  const ctx = await requireAdminContext(request, { superAdminOnly: true, moduleKey: null });
  if (ctx.error) return ctx.error;
  const { supabase, actorUser } = ctx;

  const body = await request.json().catch(() => ({}));
  const moduleKey = String(body.module_key || "");
  const enabled = body.enabled !== false;

  if (!ADMIN_MODULES.includes(moduleKey)) {
    return NextResponse.json({ error: "Modulo invalido." }, { status: 400 });
  }

  const { error } = await supabase
    .from("admin_module_access")
    .upsert({
      role: "global",
      module_key: moduleKey,
      enabled,
      updated_by: actorUser.id,
      updated_at: new Date().toISOString(),
    }, { onConflict: "role,module_key" });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await writeAdminLog(supabase, {
    actorId: actorUser.id,
    action: "modulo_acesso_atualizado",
    details: { module_key: moduleKey, enabled },
  });

  return NextResponse.json({ access: await getModuleAccessMap(supabase) });
}
