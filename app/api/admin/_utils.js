import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export function getServiceSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase service role nao configurado.");
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function isSuperAdmin(profile) {
  return profile?.role === "super_admin";
}

export function isAdminRole(profile) {
  return profile?.role === "admin" || profile?.role === "super_admin";
}

export const ADMIN_MODULES = [
  "dashboard",
  "veiculos",
  "vendas",
  "propostas",
  "usuarios",
  "configuracoes",
];

export function getModuleFromRequest(request, explicitModule = null) {
  if (explicitModule) return explicitModule;
  const pathname = new URL(request.url).pathname;
  if (pathname === "/api/admin/me") return null;
  if (pathname.startsWith("/api/test-webhook")) return "configuracoes";
  if (pathname.startsWith("/api/admin/vehicles")) return "veiculos";
  if (pathname.startsWith("/api/admin/module-access")) return "usuarios";
  if (pathname.startsWith("/api/admin/users") || pathname.startsWith("/api/admin/user-logs")) return "usuarios";
  if (pathname.startsWith("/api/admin/sales")) return "vendas";
  return null;
}

export async function getModuleAccessMap(supabase) {
  const { data = [] } = await supabase
    .from("admin_module_access")
    .select("module_key,enabled")
    .eq("role", "global");

  const access = Object.fromEntries(ADMIN_MODULES.map((moduleKey) => [moduleKey, true]));
  for (const row of data) access[row.module_key] = row.enabled !== false;
  return access;
}

export async function canAccessModule(supabase, profile, moduleKey) {
  if (!moduleKey || isSuperAdmin(profile)) return true;
  const access = await getModuleAccessMap(supabase);
  return access?.[moduleKey] !== false;
}

export async function requireAdminContext(request, { adminOnly = false, superAdminOnly = false, moduleKey: explicitModuleKey = null } = {}) {
  const auth = request.headers.get("authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!token) {
    return { error: NextResponse.json({ error: "Nao autenticado" }, { status: 401 }) };
  }

  const supabase = getServiceSupabase();
  const { data: userData, error: userError } = await supabase.auth.getUser(token);
  const user = userData?.user;
  if (userError || !user) {
    return { error: NextResponse.json({ error: "Sessao invalida" }, { status: 401 }) };
  }

  const { data: realProfile } = await supabase
    .from("profiles")
    .select("id,email,nome,role,active,must_change_password")
    .eq("id", user.id)
    .single();

  if (!realProfile?.active) {
    return { error: NextResponse.json({ error: "Usuario inativo" }, { status: 403 }) };
  }

  let profile = realProfile;
  const simulatedUserId = request.headers.get("x-simulated-user-id");

  if (simulatedUserId && simulatedUserId !== user.id) {
    if (!isSuperAdmin(realProfile)) {
      return { error: NextResponse.json({ error: "Simulacao permitida apenas para super admin." }, { status: 403 }) };
    }

    const { data: simulatedProfile, error: simulatedError } = await supabase
      .from("profiles")
      .select("id,email,nome,role,active,must_change_password")
      .eq("id", simulatedUserId)
      .single();

    if (simulatedError || !simulatedProfile?.active) {
      return { error: NextResponse.json({ error: "Usuario simulado invalido ou inativo." }, { status: 400 }) };
    }

    if (isSuperAdmin(simulatedProfile)) {
      return { error: NextResponse.json({ error: "Nao e possivel simular outro super admin." }, { status: 400 }) };
    }

    profile = simulatedProfile;
  }

  if (adminOnly && !isAdminRole(profile)) {
    return { error: NextResponse.json({ error: "Apenas administradores" }, { status: 403 }) };
  }

  if (superAdminOnly && !isSuperAdmin(realProfile)) {
    return { error: NextResponse.json({ error: "Apenas super admin" }, { status: 403 }) };
  }

  if (superAdminOnly && profile.id !== realProfile.id) {
    return { error: NextResponse.json({ error: "Saia da simulacao para alterar bloqueios de modulo." }, { status: 403 }) };
  }

  const moduleKey = getModuleFromRequest(request, explicitModuleKey);
  if (moduleKey && !(await canAccessModule(supabase, profile, moduleKey))) {
    return { error: NextResponse.json({ error: "Modulo bloqueado para este perfil." }, { status: 403 }) };
  }

  return {
    supabase,
    user,
    actorUser: user,
    profile,
    realProfile,
    isSimulating: profile.id !== realProfile.id,
  };
}

export async function getVisibleProfilesById(supabase, ids, viewerProfile, columns = "id,email,nome,role") {
  const uniqueIds = [...new Set((ids || []).filter(Boolean))];
  if (uniqueIds.length === 0) return new Map();

  let query = supabase.from("profiles").select(columns).in("id", uniqueIds);
  if (!isSuperAdmin(viewerProfile)) query = query.neq("role", "super_admin");

  const { data: profiles = [] } = await query;
  return new Map(profiles.map((profile) => [profile.id, profile]));
}

export async function writeAdminLog(supabase, { actorId, targetUserId = null, action, details = {} }) {
  if (!actorId || !action) return;

  await supabase.from("admin_user_logs").insert({
    actor_id: actorId,
    target_user_id: targetUserId,
    action,
    details,
  });
}
