begin;

alter view public.public_vehicle_taxonomy_options set (security_invoker = true);
alter view public.public_vehicle_brands set (security_invoker = true);
alter view public.public_vehicle_models set (security_invoker = true);

alter function public.pm_slugify(text) set search_path = '';
alter function public.sync_vehicle_lookup_ids() set search_path = '';
alter function public.sync_settings_to_vehicle_taxonomies() set search_path = '';

revoke all on function public.register_vehicle_sale_admin(
  uuid, uuid, uuid, integer, numeric, text, text, text, text, timestamptz
) from public, anon, authenticated;
grant execute on function public.register_vehicle_sale_admin(
  uuid, uuid, uuid, integer, numeric, text, text, text, text, timestamptz
) to service_role;

revoke all on function public.admin_create_user(text, text, text, text)
  from public, anon, authenticated;
grant execute on function public.admin_create_user(text, text, text, text)
  to service_role;

drop policy if exists admin_user_logs_select_admin on public.admin_user_logs;
create policy admin_user_logs_select_admin on public.admin_user_logs
  for select to authenticated
  using (
    exists (
      select 1
      from public.profiles p
      where p.id = (select auth.uid())
        and p.role = any (array['super_admin', 'admin']::text[])
        and p.active
    )
  );

drop policy if exists admin_user_logs_insert_admin on public.admin_user_logs;
create policy admin_user_logs_insert_admin on public.admin_user_logs
  for insert to authenticated
  with check (
    exists (
      select 1
      from public.profiles p
      where p.id = (select auth.uid())
        and p.role = any (array['super_admin', 'admin']::text[])
        and p.active
    )
  );

drop policy if exists profiles_select_visible on public.profiles;
create policy profiles_select_visible on public.profiles
  for select to authenticated
  using (
    id = (select auth.uid())
    or (select private.current_user_role()) = 'super_admin'
    or (
      (select private.can_access_module('usuarios', array['admin']::text[]))
      and role <> 'super_admin'
    )
  );

drop policy if exists admin_module_access_write_super_admin on public.admin_module_access;

create policy admin_module_access_insert_super_admin on public.admin_module_access
  for insert to authenticated
  with check ((select private.current_user_role()) = 'super_admin');

create policy admin_module_access_update_super_admin on public.admin_module_access
  for update to authenticated
  using ((select private.current_user_role()) = 'super_admin')
  with check ((select private.current_user_role()) = 'super_admin');

create policy admin_module_access_delete_super_admin on public.admin_module_access
  for delete to authenticated
  using ((select private.current_user_role()) = 'super_admin');

drop policy if exists admin_module_access_select_authenticated_global on public.admin_module_access;
create policy admin_module_access_select_authenticated_global on public.admin_module_access
  for select to authenticated
  using (
    role = 'global'
    or (select private.current_user_role()) = 'super_admin'
  );

commit;
