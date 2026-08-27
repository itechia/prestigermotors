-- Permite que uma entrada de "Páginas do site" seja ou uma página em Markdown
-- (kind='page', renderizada em /pagina/[slug]) ou um link direto — interno ou
-- externo — sem passar por uma página própria (kind='link').

alter table public.site_pages
  add column if not exists kind text not null default 'page' check (kind in ('page', 'link')),
  add column if not exists link_url text not null default '',
  add column if not exists link_type text not null default 'external' check (link_type in ('domain', 'external'));

grant select (kind, link_url, link_type) on public.site_pages to anon, authenticated;

drop view if exists public.public_site_pages;
create view public.public_site_pages
  with (security_invoker = true) as
  select id, slug, title, body_markdown, kind, link_url, link_type, updated_date
  from public.site_pages
  where published = true;

revoke all on public.public_site_pages from anon, authenticated;
grant select on public.public_site_pages to anon, authenticated;
