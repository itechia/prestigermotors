-- Páginas de conteúdo livre publicadas pelo admin (política de privacidade,
-- termos de uso, LGPD etc.). Escritas via API admin com o client service-role
-- (ver app/api/admin/_utils.js::getServiceSupabase), que ignora RLS — por isso
-- não existe policy de escrita para "authenticated" aqui, só leitura pública
-- das páginas publicadas, seguindo o mesmo padrão de tabela-trancada +
-- view pública "security_invoker" usado no hardening de store_settings.

create table if not exists public.site_pages (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  body_markdown text not null default '',
  published boolean not null default true,
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null
);

alter table public.site_pages enable row level security;

revoke all on table public.site_pages from anon, authenticated;

drop policy if exists site_pages_select_public on public.site_pages;
create policy site_pages_select_public on public.site_pages
  for select to anon, authenticated
  using (published = true);

grant select (id, slug, title, body_markdown, published, updated_date) on public.site_pages to anon, authenticated;

drop view if exists public.public_site_pages;
create view public.public_site_pages
  with (security_invoker = true) as
  select id, slug, title, body_markdown, updated_date
  from public.site_pages
  where published = true;

revoke all on public.public_site_pages from anon, authenticated;
grant select on public.public_site_pages to anon, authenticated;
