import { NextResponse } from "next/server";
import { requireAdminContext } from "../_utils";

export async function GET(request) {
  const ctx = await requireAdminContext(request, { adminOnly: true });
  if (ctx.error) return ctx.error;

  const { supabase } = ctx;
  const url = new URL(request.url);
  const targetUserId = url.searchParams.get("user_id");

  let query = supabase
    .from("admin_user_logs")
    .select("id,actor_id,target_user_id,action,details,created_at")
    .order("created_at", { ascending: false })
    .limit(200);

  if (targetUserId) query = query.eq("target_user_id", targetUserId);

  const { data: logs, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const ids = [
    ...new Set((logs || []).flatMap((log) => [log.actor_id, log.target_user_id]).filter(Boolean)),
  ];

  const { data: profiles = [] } = ids.length
    ? await supabase.from("profiles").select("id,email,nome").in("id", ids)
    : { data: [] };
  const byId = new Map(profiles.map((profile) => [profile.id, profile]));

  return NextResponse.json({
    logs: (logs || []).map((log) => ({
      ...log,
      actor: byId.get(log.actor_id) || null,
      target: byId.get(log.target_user_id) || null,
    })),
  });
}
