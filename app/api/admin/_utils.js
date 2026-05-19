import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export function getServiceSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase service role não configurado.");
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function requireAdminContext(request, { adminOnly = false } = {}) {
  const auth = request.headers.get("authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!token) {
    return { error: NextResponse.json({ error: "Não autenticado" }, { status: 401 }) };
  }

  const supabase = getServiceSupabase();
  const { data: userData, error: userError } = await supabase.auth.getUser(token);
  const user = userData?.user;
  if (userError || !user) {
    return { error: NextResponse.json({ error: "Sessão inválida" }, { status: 401 }) };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id,email,nome,role,active,must_change_password")
    .eq("id", user.id)
    .single();

  if (!profile?.active) {
    return { error: NextResponse.json({ error: "Usuário inativo" }, { status: 403 }) };
  }

  if (adminOnly && profile.role !== "admin") {
    return { error: NextResponse.json({ error: "Apenas administradores" }, { status: 403 }) };
  }

  return { supabase, user, profile };
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
