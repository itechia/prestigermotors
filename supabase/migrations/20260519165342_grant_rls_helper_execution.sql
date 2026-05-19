begin;

grant usage on schema private to authenticated;
grant execute on function private.current_user_role() to authenticated;
grant execute on function private.can_access_module(text, text[]) to authenticated;

commit;
