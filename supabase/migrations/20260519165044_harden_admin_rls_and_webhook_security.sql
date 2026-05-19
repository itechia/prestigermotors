begin;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create or replace function private.current_user_role()
returns text
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select p.role
  from public.profiles p
  where p.id = auth.uid()
    and p.active = true
  limit 1
$$;

create or replace function private.can_access_module(
  p_module_key text,
  p_allowed_roles text[] default array['super_admin', 'admin', 'vendedor']::text[]
)
returns boolean
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  v_role text;
  v_enabled boolean;
begin
  select p.role
    into v_role
  from public.profiles p
  where p.id = auth.uid()
    and p.active = true
  limit 1;

  if v_role is null then
    return false;
  end if;

  if v_role = 'super_admin' then
    return true;
  end if;

  if not (v_role = any(p_allowed_roles)) then
    return false;
  end if;

  select ama.enabled
    into v_enabled
  from public.admin_module_access ama
  where ama.role = v_role
    and ama.module_key = p_module_key
  limit 1;

  return coalesce(v_enabled, true);
end;
$$;

revoke all on function private.current_user_role() from public, anon, authenticated;
revoke all on function private.can_access_module(text, text[]) from public, anon, authenticated;

alter table public.vehicles enable row level security;
alter table public.store_settings enable row level security;
alter table public.sell_leads enable row level security;
alter table public.profiles enable row level security;
alter table public.vehicle_sales enable row level security;
alter table public.admin_module_access enable row level security;

drop policy if exists veiculos_select_publicos on public.vehicles;
drop policy if exists veiculos_select_admin on public.vehicles;
drop policy if exists veiculos_insert_admin on public.vehicles;
drop policy if exists veiculos_update_admin on public.vehicles;
drop policy if exists veiculos_delete_admin on public.vehicles;

create policy veiculos_select_publicos on public.vehicles
  for select to anon
  using (hidden = false);

create policy veiculos_select_admin on public.vehicles
  for select to authenticated
  using (
    hidden = false
    or private.can_access_module('veiculos', array['admin', 'vendedor']::text[])
  );

create policy veiculos_insert_admin on public.vehicles
  for insert to authenticated
  with check (private.can_access_module('veiculos', array['admin']::text[]));

create policy veiculos_update_admin on public.vehicles
  for update to authenticated
  using (private.can_access_module('veiculos', array['admin']::text[]))
  with check (private.can_access_module('veiculos', array['admin']::text[]));

create policy veiculos_delete_admin on public.vehicles
  for delete to authenticated
  using (private.can_access_module('veiculos', array['admin']::text[]));

drop policy if exists configuracoes_leitura_publica on public.store_settings;
drop policy if exists configuracoes_insert_admin on public.store_settings;
drop policy if exists configuracoes_update_admin on public.store_settings;
drop policy if exists configuracoes_delete_admin on public.store_settings;

create policy configuracoes_select_admin on public.store_settings
  for select to authenticated
  using (private.can_access_module('configuracoes', array['admin']::text[]));

create policy configuracoes_insert_admin on public.store_settings
  for insert to authenticated
  with check (private.can_access_module('configuracoes', array['admin']::text[]));

create policy configuracoes_update_admin on public.store_settings
  for update to authenticated
  using (private.can_access_module('configuracoes', array['admin']::text[]))
  with check (private.can_access_module('configuracoes', array['admin']::text[]));

create policy configuracoes_delete_admin on public.store_settings
  for delete to authenticated
  using (private.can_access_module('configuracoes', array['admin']::text[]));

drop policy if exists propostas_insercao_publica on public.sell_leads;
drop policy if exists propostas_select_admin on public.sell_leads;
drop policy if exists propostas_update_admin on public.sell_leads;
drop policy if exists propostas_delete_admin on public.sell_leads;

create policy propostas_insercao_publica on public.sell_leads
  for insert to anon
  with check (true);

create policy propostas_select_admin on public.sell_leads
  for select to authenticated
  using (private.can_access_module('propostas', array['admin', 'vendedor']::text[]));

create policy propostas_update_admin on public.sell_leads
  for update to authenticated
  using (private.can_access_module('propostas', array['admin', 'vendedor']::text[]))
  with check (private.can_access_module('propostas', array['admin', 'vendedor']::text[]));

create policy propostas_delete_admin on public.sell_leads
  for delete to authenticated
  using (private.can_access_module('propostas', array['admin']::text[]));

drop policy if exists vehicle_sales_select_authenticated on public.vehicle_sales;
drop policy if exists vehicle_sales_insert_authenticated on public.vehicle_sales;
drop policy if exists vehicle_sales_update_admin on public.vehicle_sales;
drop policy if exists vehicle_sales_delete_admin on public.vehicle_sales;

create policy vehicle_sales_select_staff on public.vehicle_sales
  for select to authenticated
  using (private.can_access_module('vendas', array['admin', 'vendedor']::text[]));

create policy vehicle_sales_insert_staff on public.vehicle_sales
  for insert to authenticated
  with check (private.can_access_module('vendas', array['admin', 'vendedor']::text[]));

create policy vehicle_sales_update_admin on public.vehicle_sales
  for update to authenticated
  using (private.can_access_module('vendas', array['admin']::text[]))
  with check (private.can_access_module('vendas', array['admin']::text[]));

create policy vehicle_sales_delete_admin on public.vehicle_sales
  for delete to authenticated
  using (private.can_access_module('vendas', array['admin']::text[]));

drop policy if exists perfis_acesso_proprio on public.profiles;
drop policy if exists profiles_select_visible on public.profiles;

create policy profiles_select_visible on public.profiles
  for select to authenticated
  using (
    id = auth.uid()
    or private.current_user_role() = 'super_admin'
    or (
      private.can_access_module('usuarios', array['admin']::text[])
      and role <> 'super_admin'
    )
  );

drop policy if exists admin_module_access_select_super_admin on public.admin_module_access;
drop policy if exists admin_module_access_write_super_admin on public.admin_module_access;

create policy admin_module_access_select_super_admin on public.admin_module_access
  for select to authenticated
  using (private.current_user_role() = 'super_admin');

create policy admin_module_access_write_super_admin on public.admin_module_access
  for all to authenticated
  using (private.current_user_role() = 'super_admin')
  with check (private.current_user_role() = 'super_admin');

revoke all on table public.store_settings from anon;
revoke all on table public.store_settings from authenticated;
grant select, insert, update, delete on table public.store_settings to authenticated;

revoke insert, update, delete, truncate, references, trigger on table public.vehicles from anon;
grant select on table public.vehicles to anon;
grant select, insert, update, delete on table public.vehicles to authenticated;

revoke all on table public.sell_leads from anon;
revoke all on table public.sell_leads from authenticated;
grant insert on table public.sell_leads to anon;
grant select, insert, update, delete on table public.sell_leads to authenticated;

revoke all on table public.profiles from anon;
revoke all on table public.profiles from authenticated;
grant select on table public.profiles to authenticated;

revoke all on table public.vehicle_sales from anon;
grant select, insert, update, delete on table public.vehicle_sales to authenticated;

commit;
