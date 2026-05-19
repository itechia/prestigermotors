drop policy if exists profiles_select_visible on public.profiles;
create policy profiles_select_visible on public.profiles
  for select to authenticated
  using (
    id = auth.uid()
    or role <> 'super_admin'
  );
