import { NextResponse } from "next/server";
import { requireAdminContext } from "../_utils";

export async function GET(request) {
  const ctx = await requireAdminContext(request);
  if (ctx.error) return ctx.error;

  const { supabase, user, profile } = ctx;
  const now = new Date().toISOString();

  await supabase
    .from("profiles")
    .update({ last_login_at: now, updated_date: now })
    .eq("id", user.id);

  return NextResponse.json({
    profile: {
      ...profile,
      last_login_at: now,
    },
  });
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
