-- Notificações push (Web Push / VAPID).
--
-- Não há cadastro de perfil: a inscrição é anônima. O navegador gera um
-- endpoint próprio quando o visitante clica em "Permitir", e é só isso que
-- guardamos. Nenhum dado pessoal (nome, e-mail, telefone) entra nesta tabela.
--
-- Como o site_events, nada aqui é lido ou escrito direto pelo cliente:
-- tudo passa pelas rotas /api/public/push/* e /api/admin/push/*, que usam a
-- service role.
begin;

create table if not exists public.push_subscriptions (
  id bigserial primary key,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  user_agent text,
  device text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  last_sent_at timestamptz,
  last_error text,
  constraint push_subscriptions_device_check
    check (device is null or device in ('mobile', 'tablet', 'desktop'))
);

create index if not exists push_subscriptions_active_idx
  on public.push_subscriptions (active, created_at desc);

alter table public.push_subscriptions enable row level security;
revoke all on table public.push_subscriptions from anon, authenticated;
revoke all on sequence public.push_subscriptions_id_seq from anon, authenticated;

-- Histórico de envios: o que foi mandado, para quantos, e quantos falharam.
create table if not exists public.push_campaigns (
  id bigserial primary key,
  title text not null,
  body text not null,
  url text,
  icon_url text,
  target_count integer not null default 0,
  sent_count integer not null default 0,
  failed_count integer not null default 0,
  expired_count integer not null default 0,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists push_campaigns_created_at_idx
  on public.push_campaigns (created_at desc);

alter table public.push_campaigns enable row level security;
revoke all on table public.push_campaigns from anon, authenticated;
revoke all on sequence public.push_campaigns_id_seq from anon, authenticated;

-- O módulo "notificacoes" precisa ser aceito pelo bloqueio global por módulo
-- (Admin → Usuários → Bloqueios globais).
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
    'analitico'::text,
    'notificacoes'::text
  ]));

commit;
