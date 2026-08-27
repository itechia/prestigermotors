-- Script único e idempotente que deixa public_site_pages 100% funcional,
-- independente de quais migrations anteriores de site_pages já foram
-- aplicadas ou não (20260826235851, 20260827004500, 20260827005500).
-- Seguro rodar mais de uma vez.

-- Garante as colunas de "link direto" (caso a migration 20260827005500
-- ainda não tenha sido aplicada).
alter table public.site_pages
  add column if not exists kind text not null default 'page' check (kind in ('page', 'link')),
  add column if not exists link_url text not null default '',
  add column if not exists link_type text not null default 'external' check (link_type in ('domain', 'external'));

-- Garante a policy pública de leitura.
drop policy if exists site_pages_select_public on public.site_pages;
create policy site_pages_select_public on public.site_pages
  for select to anon, authenticated
  using (published = true);

-- Garante TODAS as colunas que a view/policy precisam ler — inclusive
-- "published", que é a coluna usada na cláusula USING da policy acima e
-- cuja falta é a causa do erro 42501 (insufficient_privilege).
grant select (id, slug, title, body_markdown, published, kind, link_url, link_type, updated_date)
  on public.site_pages to anon, authenticated;

-- Recria a view pública com o conjunto completo de colunas.
drop view if exists public.public_site_pages;
create view public.public_site_pages
  with (security_invoker = true) as
  select id, slug, title, body_markdown, kind, link_url, link_type, updated_date
  from public.site_pages
  where published = true;

revoke all on public.public_site_pages from anon, authenticated;
grant select on public.public_site_pages to anon, authenticated;
