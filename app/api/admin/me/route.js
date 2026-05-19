import { NextResponse } from "next/server";
import { getDefaultModuleAccessMap, getModuleAccessMap, requireAdminContext } from "../_utils";

export async function GET(request) {
  try {
    const ctx = await requireAdminContext(request);
    if (ctx.error) return ctx.error;

    const { supabase, actorUser, profile, realProfile, isSimulating } = ctx;
    const now = new Date().toISOString();

    await supabase
      .from("profiles")
      .update({ last_login_at: now, updated_date: now })
      .eq("id", actorUser.id);

    let moduleAccess = getDefaultModuleAccessMap();
    try {
      moduleAccess = await getModuleAccessMap(supabase);
    } catch {
      moduleAccess = getDefaultModuleAccessMap();
    }

    return NextResponse.json({
      profile: {
        ...profile,
        last_login_at: isSimulating ? profile.last_login_at : now,
        module_access: moduleAccess,
      },
      real_profile: {
        ...realProfile,
        last_login_at: now,
      },
      module_access: moduleAccess,
      simulation: isSimulating
        ? { active: true, user_id: profile.id, nome: profile.nome, email: profile.email, role: profile.role }
        : null,
    });
  } catch (error) {
    return NextResponse.json({
      error: "Falha ao carregar perfil administrativo.",
      detail: error?.message || "Erro inesperado no servidor.",
    }, { status: 500 });
  }
}

export async function PATCH(request) {
  const ctx = await requireAdminContext(request);
  if (ctx.error) return ctx.error;

  const { supabase, user } = ctx;
  const body = await request.json().catch(() => ({}));
  const updates = {};

  if (body.must_change_password === false) {
    updates.must_change_password = false;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "Nenhuma alteração informada." }, { status: 400 });
  }

  updates.updated_date = new Date().toISOString();

  const { data, error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", user.id)
    .select("id,email,nome,role,active,must_change_password,last_login_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ profile: data });
}
