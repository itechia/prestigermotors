drop policy if exists admin_module_access_select_super_admin on public.admin_module_access;
drop policy if exists admin_module_access_select_authenticated_global on public.admin_module_access;

create policy admin_module_access_select_authenticated_global on public.admin_module_access
  for select to authenticated
  using (
    role = 'global'
    or private.current_user_role() = 'super_admin'
  );
