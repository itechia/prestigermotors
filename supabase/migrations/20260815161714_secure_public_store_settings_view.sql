begin;

alter view public.public_store_settings set (security_invoker = true);

drop policy if exists configuracoes_select_admin on public.store_settings;
drop policy if exists configuracoes_insert_admin on public.store_settings;
drop policy if exists configuracoes_update_admin on public.store_settings;
drop policy if exists configuracoes_delete_admin on public.store_settings;
drop policy if exists configuracoes_select_public on public.store_settings;

create policy configuracoes_select_public on public.store_settings
  for select to anon, authenticated
  using (true);

revoke all on table public.store_settings from anon, authenticated;

do $$
declare
  safe_columns text;
begin
  select string_agg(quote_ident(column_name), ', ' order by ordinal_position)
    into safe_columns
  from information_schema.columns
  where table_schema = 'public'
    and table_name = 'public_store_settings';

  if safe_columns is null then
    raise exception 'public_store_settings has no columns';
  end if;

  execute format(
    'grant select (%s) on table public.store_settings to anon, authenticated',
    safe_columns
  );
end
$$;

revoke all on table public.public_store_settings from anon, authenticated;
grant select on table public.public_store_settings to anon, authenticated;

commit;
