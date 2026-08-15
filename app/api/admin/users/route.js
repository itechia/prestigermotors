import { NextResponse } from "next/server";
import { isSuperAdmin, requireAdminContext, writeAdminLog } from "../_utils";

export async function GET(request) {
  const ctx = await requireAdminContext(request, { adminOnly: true });
  if (ctx.error) return ctx.error;
  const { supabase, realProfile } = ctx;

  let query = supabase
    .from("profiles")
    .select("id,email,nome,role,active,must_change_password,last_login_at,created_by,criado_em,updated_date")
    .order("criado_em", { ascending: false });

  if (!isSuperAdmin(realProfile)) query = query.neq("role", "super_admin");

  const { data: profiles, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ users: profiles || [] });
}

export async function POST(request) {
  const ctx = await requireAdminContext(request, { adminOnly: true });
  if (ctx.error) return ctx.error;
  const { supabase, actorUser: actor, realProfile } = ctx;
  const body = await request.json().catch(() => ({}));
  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "");
  const nome = String(body.nome || "").trim();
  let role = body.role === "vendedor" ? "vendedor" : "admin";
  if (body.role === "super_admin" && isSuperAdmin(realProfile)) role = "super_admin";

  if (!email || !password || password.length < 6) {
    return NextResponse.json({ error: "Informe e-mail e senha com no mínimo 6 caracteres." }, { status: 400 });
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { nome, role },
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  const newUser = data.user;
  const now = new Date().toISOString();
  const { error: profileError } = await supabase.from("profiles").upsert({
    id: newUser.id,
    email,
    nome,
    role,
    active: true,
    must_change_password: true,
    created_by: actor.id,
    updated_date: now,
  });
  if (profileError) {
    await supabase.auth.admin.deleteUser(newUser.id).catch(() => {});
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  await writeAdminLog(supabase, {
    actorId: actor.id,
    targetUserId: newUser.id,
    action: "usuario_criado",
    details: { email, nome, role },
  });

  return NextResponse.json({ user: { id: newUser.id, email, nome, role, active: true, must_change_password: true } });
}
