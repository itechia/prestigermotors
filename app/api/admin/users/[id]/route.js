import { NextResponse } from "next/server";
import { requireAdminContext, writeAdminLog } from "../../_utils";

export async function PATCH(request, { params }) {
  const ctx = await requireAdminContext(request, { adminOnly: true });
  if (ctx.error) return ctx.error;

  const { supabase, user: actor } = ctx;
  const targetId = params.id;
  const body = await request.json().catch(() => ({}));
  const profileUpdates = {};
  const authUpdates = {};

  if (typeof body.nome === "string") profileUpdates.nome = body.nome.trim();
  if (body.role === "admin" || body.role === "vendedor") profileUpdates.role = body.role;
  if (typeof body.active === "boolean") profileUpdates.active = body.active;
  if (typeof body.must_change_password === "boolean") {
    profileUpdates.must_change_password = body.must_change_password;
  }
  if (typeof body.password === "string" && body.password.length > 0) {
    if (body.password.length < 6) {
      return NextResponse.json({ error: "A nova senha precisa ter no mínimo 6 caracteres." }, { status: 400 });
    }
    authUpdates.password = body.password;
    profileUpdates.must_change_password = true;
  }

  if (Object.keys(authUpdates).length > 0) {
    const { error: authError } = await supabase.auth.admin.updateUserById(targetId, authUpdates);
    if (authError) return NextResponse.json({ error: authError.message }, { status: 400 });
  }

  if (Object.keys(profileUpdates).length === 0) {
    return NextResponse.json({ error: "Nenhuma alteração informada." }, { status: 400 });
  }

  profileUpdates.updated_date = new Date().toISOString();

  const { data, error } = await supabase
    .from("profiles")
    .update(profileUpdates)
    .eq("id", targetId)
    .select("id,email,nome,role,active,must_change_password,last_login_at,created_by,criado_em,updated_date")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await writeAdminLog(supabase, {
    actorId: actor.id,
    targetUserId: targetId,
    action: authUpdates.password ? "senha_resetada" : "usuario_atualizado",
    details: {
      role: profileUpdates.role,
      active: profileUpdates.active,
      must_change_password: profileUpdates.must_change_password,
      nome: profileUpdates.nome,
    },
  });

  return NextResponse.json({ user: data });
}
