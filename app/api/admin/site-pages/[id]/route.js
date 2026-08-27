import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { requireAdminContext, writeAdminLog } from "../../_utils";
import { isValidSlug, slugify } from "@/lib/slug";

export async function PATCH(request, { params }) {
  const ctx = await requireAdminContext(request, { adminOnly: true });
  if (ctx.error) return ctx.error;
  const { supabase, actorUser: actor } = ctx;
  const targetId = params.id;
  const body = await request.json().catch(() => ({}));

  const updates = {};
  if (typeof body.title === "string") {
    const title = body.title.trim();
    if (!title) return NextResponse.json({ error: "Informe um título." }, { status: 400 });
    updates.title = title;
  }
  if (body.kind === "page" || body.kind === "link") updates.kind = body.kind;
  if (typeof body.body_markdown === "string") updates.body_markdown = body.body_markdown;
  if (typeof body.link_url === "string") updates.link_url = body.link_url.trim();
  if (body.link_type === "domain" || body.link_type === "external") updates.link_type = body.link_type;
  if (typeof body.published === "boolean") updates.published = body.published;
  if (typeof body.slug === "string") {
    const slug = slugify(body.slug);
    if (!isValidSlug(slug)) {
      return NextResponse.json({ error: "Slug inválido. Use apenas letras minúsculas, números e hífens." }, { status: 400 });
    }
    updates.slug = slug;
  }

  const effectiveKind = updates.kind || "page";
  if (effectiveKind === "link" && typeof updates.link_url === "string" && !updates.link_url) {
    return NextResponse.json({ error: "Informe a URL do link." }, { status: 400 });
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "Nenhuma alteração informada." }, { status: 400 });
  }

  updates.updated_by = actor.id;
  updates.updated_date = new Date().toISOString();

  const { data, error } = await supabase
    .from("site_pages")
    .update(updates)
    .eq("id", targetId)
    .select("id,slug,title,body_markdown,kind,link_url,link_type,published,created_date,updated_date")
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "Já existe uma página com esse slug." }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) return NextResponse.json({ error: "Página não encontrada." }, { status: 404 });

  await writeAdminLog(supabase, {
    actorId: actor.id,
    action: "pagina_atualizada",
    details: { id: data.id, slug: data.slug, title: data.title },
  });

  revalidateTag("public-site-pages");

  return NextResponse.json({ page: data });
}

export async function DELETE(request, { params }) {
  const ctx = await requireAdminContext(request, { adminOnly: true });
  if (ctx.error) return ctx.error;
  const { supabase, actorUser: actor } = ctx;
  const targetId = params.id;

  const { data: existing } = await supabase
    .from("site_pages")
    .select("id,slug,title")
    .eq("id", targetId)
    .maybeSingle();

  if (!existing) return NextResponse.json({ error: "Página não encontrada." }, { status: 404 });

  const { error } = await supabase.from("site_pages").delete().eq("id", targetId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await writeAdminLog(supabase, {
    actorId: actor.id,
    action: "pagina_excluida",
    details: { id: existing.id, slug: existing.slug, title: existing.title },
  });

  revalidateTag("public-site-pages");

  return NextResponse.json({ ok: true });
}
