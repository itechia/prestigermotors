-- O módulo "analitico" precisa ser aceito pelo bloqueio global por módulo
-- (Admin → Usuários → Bloqueios globais).
begin;

alter table public.admin_module_access
  drop constraint if exists admin_module_access_module_key_check;

alter table public.admin_module_access
  add constraint admin_module_access_module_key_check
  check (module_key = any (array[
    'dashboard'::text,
    'veiculos'::text,
    'vendas'::text,
    'propostas'::text,
    'usuarios'::text,
    'configuracoes'::text,
    'analitico'::text
  ]));

commit;
