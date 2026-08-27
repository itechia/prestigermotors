import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { requireAdminContext, writeAdminLog } from "../_utils";
import { isValidSlug, slugify } from "@/lib/slug";

export async function GET(request) {
  const ctx = await requireAdminContext(request, { adminOnly: true });
  if (ctx.error) return ctx.error;
  const { supabase } = ctx;

  const { data, error } = await supabase
    .from("site_pages")
    .select("id,slug,title,body_markdown,kind,link_url,link_type,published,created_date,updated_date")
    .order("created_date", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ pages: data || [] });
}

export async function POST(request) {
  const ctx = await requireAdminContext(request, { adminOnly: true });
  if (ctx.error) return ctx.error;
  const { supabase, actorUser: actor } = ctx;
  const body = await request.json().catch(() => ({}));

  const title = String(body.title || "").trim();
  const kind = body.kind === "link" ? "link" : "page";
  const bodyMarkdown = kind === "page" ? String(body.body_markdown ?? "") : "";
  const linkUrl = kind === "link" ? String(body.link_url || "").trim() : "";
  const linkType = body.link_type === "domain" ? "domain" : "external";
  const published = body.published !== false;
  const slug = slugify(body.slug || title);

  if (!title) {
    return NextResponse.json({ error: "Informe um título." }, { status: 400 });
  }
  if (!isValidSlug(slug)) {
    return NextResponse.json({ error: "Slug inválido. Use apenas letras minúsculas, números e hífens." }, { status: 400 });
  }
  if (kind === "link" && !linkUrl) {
    return NextResponse.json({ error: "Informe a URL do link." }, { status: 400 });
  }

  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("site_pages")
    .insert({
      title,
      slug,
      body_markdown: bodyMarkdown,
      kind,
      link_url: linkUrl,
      link_type: linkType,
      published,
      created_by: actor.id,
      updated_by: actor.id,
      updated_date: now,
    })
    .select("id,slug,title,body_markdown,kind,link_url,link_type,published,created_date,updated_date")
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "Já existe uma página com esse slug." }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await writeAdminLog(supabase, {
    actorId: actor.id,
    action: "pagina_criada",
    details: { id: data.id, slug: data.slug, title: data.title },
  });

  revalidateTag("public-site-pages");

  return NextResponse.json({ page: data });
}
