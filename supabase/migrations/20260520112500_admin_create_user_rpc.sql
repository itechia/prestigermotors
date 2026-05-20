create or replace function public.admin_create_user(
  p_email text,
  p_password text,
  p_nome text default '',
  p_role text default 'vendedor'
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth, extensions, pg_temp
as $$
declare
  v_actor public.profiles%rowtype;
  v_email text;
  v_role text;
  v_user_id uuid := gen_random_uuid();
  v_now timestamptz := now();
begin
  v_email := lower(trim(coalesce(p_email, '')));
  v_role := case when p_role = 'admin' then 'admin' else 'vendedor' end;

  select *
    into v_actor
  from public.profiles
  where id = auth.uid()
    and active = true
  limit 1;

  if v_actor.id is null or v_actor.role not in ('admin', 'super_admin') then
    raise exception 'Apenas administradores podem criar usuarios.';
  end if;

  if p_role = 'super_admin' then
    if v_actor.role <> 'super_admin' then
      raise exception 'Apenas super admin pode criar outro super admin.';
    end if;
    v_role := 'super_admin';
  end if;

  if v_actor.role <> 'super_admin' and not private.can_access_module('usuarios', array['admin']::text[]) then
    raise exception 'Modulo de usuarios bloqueado.';
  end if;

  if v_email = '' or coalesce(length(p_password), 0) < 6 then
    raise exception 'Informe e-mail e senha com no minimo 6 caracteres.';
  end if;

  if exists (
    select 1
    from auth.users
    where lower(email) = v_email
      and deleted_at is null
  ) then
    raise exception 'Ja existe um usuario com este e-mail.';
  end if;

  insert into auth.users (
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    is_super_admin,
    is_sso_user,
    is_anonymous
  ) values (
    v_user_id,
    'authenticated',
    'authenticated',
    v_email,
    crypt(p_password, gen_salt('bf')),
    v_now,
    v_now,
    jsonb_build_object('provider', 'email', 'providers', jsonb_build_array('email')),
    jsonb_build_object('nome', trim(coalesce(p_nome, '')), 'role', v_role),
    v_now,
    v_now,
    false,
    false,
    false
  );

  insert into auth.identities (
    provider_id,
    user_id,
    identity_data,
    provider,
    last_sign_in_at,
    created_at,
    updated_at,
    email
  ) values (
    v_user_id::text,
    v_user_id,
    jsonb_build_object(
      'sub', v_user_id::text,
      'email', v_email,
      'email_verified', true,
      'phone_verified', false
    ),
    'email',
    null,
    v_now,
    v_now,
    v_email
  );

  insert into public.profiles (
    id,
    email,
    nome,
    role,
    active,
    must_change_password,
    created_by,
    criado_em,
    updated_date
  ) values (
    v_user_id,
    v_email,
    trim(coalesce(p_nome, '')),
    v_role,
    true,
    true,
    v_actor.id,
    v_now,
    v_now
  );

  insert into public.admin_user_logs (
    actor_id,
    target_user_id,
    action,
    details
  ) values (
    v_actor.id,
    v_user_id,
    'usuario_criado',
    jsonb_build_object('email', v_email, 'nome', trim(coalesce(p_nome, '')), 'role', v_role)
  );

  return jsonb_build_object(
    'user',
    jsonb_build_object(
      'id', v_user_id,
      'email', v_email,
      'nome', trim(coalesce(p_nome, '')),
      'role', v_role,
      'active', true,
      'must_change_password', true
    )
  );
end;
$$;

revoke all on function public.admin_create_user(text, text, text, text) from public, anon;
grant execute on function public.admin_create_user(text, text, text, text) to authenticated;
