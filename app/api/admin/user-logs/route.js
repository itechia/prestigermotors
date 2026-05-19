import { NextResponse } from "next/server";
import { getVisibleProfilesById, isSuperAdmin, requireAdminContext } from "../_utils";

export async function GET(request) {
  const ctx = await requireAdminContext(request, { adminOnly: true });
  if (ctx.error) return ctx.error;

  const { supabase, realProfile } = ctx;
  const url = new URL(request.url);
  const targetUserId = url.searchParams.get("user_id");

  let query = supabase
    .from("admin_user_logs")
    .select("id,actor_id,target_user_id,action,details,created_at")
    .order("created_at", { ascending: false })
    .limit(200);

  if (targetUserId) query = query.eq("target_user_id", targetUserId);

  const { data: rawLogs, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  let logs = rawLogs || [];

  if (!isSuperAdmin(realProfile) && logs.length > 0) {
    const idsToCheck = [
      ...new Set(logs.flatMap((log) => [log.actor_id, log.target_user_id]).filter(Boolean)),
    ];
    const { data: superProfiles = [] } = idsToCheck.length
      ? await supabase.from("profiles").select("id").in("id", idsToCheck).eq("role", "super_admin")
      : { data: [] };
    const hiddenIds = new Set(superProfiles.map((profile) => profile.id));
    logs = logs.filter((log) => !hiddenIds.has(log.actor_id) && !hiddenIds.has(log.target_user_id));
  }

  const ids = [
    ...new Set(logs.flatMap((log) => [log.actor_id, log.target_user_id]).filter(Boolean)),
  ];

  const byId = await getVisibleProfilesById(supabase, ids, realProfile, "id,email,nome");

  return NextResponse.json({
    logs: logs.map((log) => ({
      ...log,
      actor: byId.get(log.actor_id) || null,
      target: byId.get(log.target_user_id) || null,
    })),
  });
}
