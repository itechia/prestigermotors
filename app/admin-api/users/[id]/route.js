import { NextResponse } from "next/server";
import { isSuperAdmin, requireAdminContext, writeAdminLog } from "../../../api/admin/_utils";

export async function PATCH(request, { params }) {
  const ctx = await requireAdminContext(request, { adminOnly: true });
  if (ctx.error) return ctx.error;

  const { supabase, actorUser: actor, realProfile } = ctx;
  const targetId = params.id;
  const body = await request.json().catch(() => ({}));
  const profileUpdates = {};
  const authUpdates = {};

  const { data: targetProfile, error: targetError } = await supabase
    .from("profiles")
    .select("id,role")
    .eq("id", targetId)
    .single();

  if (targetError || !targetProfile) {
    return NextResponse.json({ error: "Usuario nao encontrado." }, { status: 404 });
  }

  if (targetProfile.role === "super_admin" && !isSuperAdmin(realProfile)) {
    return NextResponse.json({ error: "Usuario nao encontrado." }, { status: 404 });
  }

  if (typeof body.nome === "string") profileUpdates.nome = body.nome.trim();
  if (typeof body.email === "string") {
    const email = body.email.trim().toLowerCase();
    if (!email) return NextResponse.json({ error: "E-mail invalido." }, { status: 400 });
    profileUpdates.email = email;
    authUpdates.email = email;
    authUpdates.email_confirm = true;
  }
  if (body.role === "admin" || body.role === "vendedor") profileUpdates.role = body.role;
  if (body.role === "super_admin" && isSuperAdmin(realProfile)) profileUpdates.role = body.role;
  if (profileUpdates.role === "super_admin" && !isSuperAdmin(realProfile)) {
    return NextResponse.json({ error: "Apenas super admin pode definir esse papel." }, { status: 403 });
  }
  if (typeof body.active === "boolean") profileUpdates.active = body.active;
  if (typeof body.must_change_password === "boolean") {
    profileUpdates.must_change_password = body.must_change_password;
  }
  if (typeof body.password === "string" && body.password.length > 0) {
    if (body.password.length < 6) {
      return NextResponse.json({ error: "A nova senha precisa ter no minimo 6 caracteres." }, { status: 400 });
    }
    authUpdates.password = body.password;
    profileUpdates.must_change_password = true;
  }

  if (Object.keys(authUpdates).length > 0) {
    const { error: authError } = await supabase.auth.admin.updateUserById(targetId, authUpdates);
    if (authError) return NextResponse.json({ error: authError.message }, { status: 400 });
  }

  if (Object.keys(profileUpdates).length === 0) {
    return NextResponse.json({ error: "Nenhuma alteracao informada." }, { status: 400 });
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

export async function DELETE(request, { params }) {
  const ctx = await requireAdminContext(request, { adminOnly: true });
  if (ctx.error) return ctx.error;

  const { supabase, actorUser, realProfile } = ctx;
  const targetId = params.id;

  if (targetId === actorUser.id) {
    return NextResponse.json({ error: "Voce nao pode excluir sua propria conta." }, { status: 400 });
  }

  const { data: targetProfile, error: targetError } = await supabase
    .from("profiles")
    .select("id,email,nome,role")
    .eq("id", targetId)
    .single();

  if (targetError || !targetProfile) {
    return NextResponse.json({ error: "Usuario nao encontrado." }, { status: 404 });
  }

  if (targetProfile.role === "super_admin" && !isSuperAdmin(realProfile)) {
    return NextResponse.json({ error: "Usuario nao encontrado." }, { status: 404 });
  }

  await writeAdminLog(supabase, {
    actorId: actorUser.id,
    targetUserId: targetId,
    action: "usuario_excluido",
    details: { email: targetProfile.email, nome: targetProfile.nome, role: targetProfile.role },
  });

  const { error: authError } = await supabase.auth.admin.deleteUser(targetId);
  if (authError) return NextResponse.json({ error: authError.message }, { status: 400 });

  await supabase.from("profiles").delete().eq("id", targetId);

  return NextResponse.json({ ok: true });
}
