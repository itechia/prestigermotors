create table if not exists public.admin_module_access (
  role text not null check (role in ('admin','vendedor')),
  module_key text not null check (module_key in ('dashboard','veiculos','vendas','propostas','usuarios','configuracoes')),
  enabled boolean not null default true,
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now(),
  primary key (role, module_key)
);

insert into public.admin_module_access (role, module_key, enabled)
select role, module_key, true
from unnest(array['admin','vendedor']) as role
cross join unnest(array['dashboard','veiculos','vendas','propostas','usuarios','configuracoes']) as module_key
on conflict (role, module_key) do nothing;

alter table public.admin_module_access enable row level security;

drop policy if exists admin_module_access_select_super_admin on public.admin_module_access;
create policy admin_module_access_select_super_admin on public.admin_module_access
  for select to authenticated
  using (exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.role = 'super_admin'
      and p.active
  ));

drop policy if exists admin_module_access_write_super_admin on public.admin_module_access;
create policy admin_module_access_write_super_admin on public.admin_module_access
  for all to authenticated
  using (exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.role = 'super_admin'
      and p.active
  ))
  with check (exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.role = 'super_admin'
      and p.active
  ));

grant select on table public.admin_module_access to authenticated;
