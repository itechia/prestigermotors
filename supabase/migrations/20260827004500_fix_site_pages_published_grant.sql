-- Corrige a migration anterior (20260826235851_add_site_pages.sql): a policy
-- pública de site_pages usa "published = true" na cláusula USING, mas o grant
-- de SELECT não incluía a coluna "published" — sem permissão de leitura nela,
-- o Postgres nega a avaliação da policy inteira (erro 42501/insufficient
-- privilege) ao consultar a view public_site_pages, que é security_invoker.

grant select (published) on public.site_pages to anon, authenticated;
