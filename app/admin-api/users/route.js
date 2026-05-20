import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const ADMIN_MODULES = ["dashboard", "veiculos", "vendas", "propostas", "usuarios", "configuracoes"];

function jsonError(error, status = 500, fallback = "Falha na operacao administrativa.") {
  return NextResponse.json({
    error: fallback,
    detail: error?.message || String(error || "Erro inesperado no servidor."),
  }, { status });
}

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY ||
    process.env.SUPABASE_SECRET_KEY;

  if (!url) throw new Error("NEXT_PUBLIC_SUPABASE_URL nao configurada na Vercel.");
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY nao configurada na Vercel.");

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function getModuleAccessMap(supabase) {
  const { data = [] } = await supabase
    .from("admin_module_access")
    .select("module_key,enabled")
    .eq("role", "global");

  const access = Object.fromEntries(ADMIN_MODULES.map((moduleKey) => [moduleKey, true]));
  for (const row of data || []) access[row.module_key] = row.enabled !== false;
  return access;
}

async function requireUsersAdmin(request) {
  const auth = request.headers.get("authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!token) {
    return { error: NextResponse.json({ error: "Nao autenticado" }, { status: 401 }) };
  }

  const supabase = getServiceClient();
  const { data: userData, error: userError } = await supabase.auth.getUser(token);
  const user = userData?.user;
  if (userError || !user) {
    return { error: NextResponse.json({ error: "Sessao invalida" }, { status: 401 }) };
  }

  const { data: realProfile, error: profileError } = await supabase
    .from("profiles")
    .select("id,email,nome,role,active,must_change_password")
    .eq("id", user.id)
    .single();

  if (profileError) {
    return { error: NextResponse.json({ error: `Falha ao carregar perfil: ${profileError.message}` }, { status: 500 }) };
  }
  if (!realProfile?.active) {
    return { error: NextResponse.json({ error: "Usuario inativo" }, { status: 403 }) };
  }
  if (!["admin", "super_admin"].includes(realProfile.role)) {
    return { error: NextResponse.json({ error: "Apenas administradores" }, { status: 403 }) };
  }

  if (realProfile.role !== "super_admin") {
    const access = await getModuleAccessMap(supabase);
    if (access.usuarios === false) {
      return { error: NextResponse.json({ error: "Modulo bloqueado para este perfil." }, { status: 403 }) };
    }
  }

  return { supabase, user, realProfile };
}

async function writeAdminLog(supabase, { actorId, targetUserId = null, action, details = {} }) {
  if (!actorId || !action) return;
  await supabase.from("admin_user_logs").insert({
    actor_id: actorId,
    target_user_id: targetUserId,
    action,
    details,
  });
}

export async function GET(request) {
  try {
    const ctx = await requireUsersAdmin(request);
    if (ctx.error) return ctx.error;
    const { supabase, realProfile } = ctx;

    let query = supabase
      .from("profiles")
      .select("id,email,nome,role,active,must_change_password,last_login_at,created_by,criado_em,updated_date")
      .order("criado_em", { ascending: false });

    if (realProfile.role !== "super_admin") query = query.neq("role", "super_admin");

    const { data: profiles, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ users: profiles || [] });
  } catch (error) {
    return jsonError(error, 500, "Falha ao listar usuarios.");
  }
}

export async function POST(request) {
  let createdUserId = null;

  try {
    const ctx = await requireUsersAdmin(request);
    if (ctx.error) return ctx.error;
    const { supabase, user: actor, realProfile } = ctx;
    const body = await request.json().catch(() => ({}));
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");
    const nome = String(body.nome || "").trim();
    let role = body.role === "vendedor" ? "vendedor" : "admin";
    if (body.role === "super_admin" && realProfile.role === "super_admin") role = "super_admin";

    if (!email || !password || password.length < 6) {
      return NextResponse.json({ error: "Informe e-mail e senha com no minimo 6 caracteres." }, { status: 400 });
    }

    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { nome, role },
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    const newUser = data.user;
    createdUserId = newUser.id;
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
    if (profileError) throw new Error(profileError.message);

    await writeAdminLog(supabase, {
      actorId: actor.id,
      targetUserId: newUser.id,
      action: "usuario_criado",
      details: { email, nome, role },
    });

    return NextResponse.json({
      user: { id: newUser.id, email, nome, role, active: true, must_change_password: true },
    });
  } catch (error) {
    try {
      if (createdUserId) await getServiceClient().auth.admin.deleteUser(createdUserId);
    } catch {}
    return jsonError(error, 500, "Falha ao criar usuario.");
  }
}
