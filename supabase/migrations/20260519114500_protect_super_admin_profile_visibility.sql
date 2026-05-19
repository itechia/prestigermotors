alter table public.profiles enable row level security;

revoke insert, update, delete on table public.profiles from authenticated;
grant select on table public.profiles to authenticated;

drop policy if exists profiles_select_visible on public.profiles;
create policy profiles_select_visible on public.profiles
  for select to authenticated
  using (
    id = auth.uid()
    or role <> 'super_admin'
    or exists (
      select 1
      from public.profiles viewer
      where viewer.id = auth.uid()
        and viewer.role = 'super_admin'
        and viewer.active
    )
  );
