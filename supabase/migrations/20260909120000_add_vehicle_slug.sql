-- URL amigável para os veículos: /veiculo/volkswagen-tera-1-4-tsi-highline-2024
-- em vez de expor a chave primária (UUID) no link compartilhado.
begin;

-- Converte texto livre em slug de URL: sem acentos, minúsculo, separado por hífen.
-- (Diferente de pm_slugify, que usa "_" e é usada nas taxonomias.)
create or replace function public.pm_url_slug(p_text text)
returns text
language sql
immutable
set search_path = public
as $$
  select trim(both '-' from
    regexp_replace(
      regexp_replace(
        lower(translate(
          coalesce(p_text, ''),
          'áàâãäåéèêëíìîïóòôõöúùûüçñÁÀÂÃÄÅÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇÑ',
          'aaaaaaeeeeiiiiooooouuuucnaaaaaaeeeeiiiiooooouuuucn'
        )),
        '[^a-z0-9]+', '-', 'g'
      ),
      '-+', '-', 'g'
    )
  );
$$;

alter table public.vehicles add column if not exists slug text;

-- Gera o slug apenas quando ele está vazio. Assim, editar marca/modelo depois
-- não quebra os links já compartilhados por WhatsApp ou indexados no Google.
create or replace function public.vehicles_set_slug()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_base text;
  v_candidate text;
  v_suffix text;
  v_len int := 4;
begin
  if new.slug is not null and btrim(new.slug) <> '' then
    new.slug := public.pm_url_slug(new.slug);
    return new;
  end if;

  v_base := public.pm_url_slug(
    concat_ws(' ', new.brand, new.model, new.version, coalesce(new.manufacture_year, new.year))
  );
  v_base := left(v_base, 70);
  v_base := trim(both '-' from v_base);
  if v_base = '' then
    v_base := 'veiculo';
  end if;

  v_candidate := v_base;
  v_suffix := replace(new.id::text, '-', '');

  while exists (
    select 1 from public.vehicles v where v.slug = v_candidate and v.id <> new.id
  ) loop
    v_candidate := v_base || '-' || substr(v_suffix, 1, v_len);
    v_len := v_len + 2;
    exit when v_len > 32;
  end loop;

  new.slug := v_candidate;
  return new;
end;
$$;

drop trigger if exists vehicles_set_slug_trigger on public.vehicles;
create trigger vehicles_set_slug_trigger
  before insert or update on public.vehicles
  for each row execute function public.vehicles_set_slug();

-- Backfill: o próprio gatilho preenche os registros existentes.
update public.vehicles set slug = null where slug is null;

alter table public.vehicles alter column slug set not null;

create unique index if not exists vehicles_slug_key on public.vehicles (slug);

-- O catálogo público lê a tabela com grants por coluna: liberar a nova coluna.
grant select (slug) on table public.vehicles to anon, authenticated;

commit;
