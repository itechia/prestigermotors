-- Analítico do site: eventos de navegação do catálogo público.
-- Os eventos só são gravados quando o visitante aceita os cookies (aviso LGPD),
-- e sempre pela API /api/track, que usa a service role. Nenhum cliente anônimo
-- escreve ou lê esta tabela diretamente.
begin;

create table if not exists public.site_events (
  id bigserial primary key,
  created_at timestamptz not null default now(),
  session_id text not null,
  visitor_id text,
  event_type text not null,
  vehicle_id uuid,
  path text,
  referrer text,
  device text,
  duration_ms integer,
  metadata jsonb not null default '{}'::jsonb,
  constraint site_events_event_type_check check (event_type in (
    'page_view',
    'vehicle_view',
    'vehicle_time',
    'interest_click',
    'interest_submit',
    'whatsapp_click',
    'share_click',
    'gallery_open',
    'search',
    'filter',
    'sell_lead_submit'
  ))
);

create index if not exists site_events_created_at_idx on public.site_events (created_at desc);
create index if not exists site_events_type_created_idx on public.site_events (event_type, created_at desc);
create index if not exists site_events_vehicle_idx on public.site_events (vehicle_id, created_at desc)
  where vehicle_id is not null;
create index if not exists site_events_session_idx on public.site_events (session_id);

alter table public.site_events enable row level security;
revoke all on table public.site_events from anon, authenticated;
revoke all on sequence public.site_events_id_seq from anon, authenticated;

-- Consolida todas as métricas do painel em uma única chamada.
create or replace function public.admin_analytics(p_days integer default 30)
returns jsonb
language sql
security definer
set search_path = public
as $$
with params as (
  select now() - make_interval(days => greatest(coalesce(p_days, 30), 1)) as since
),
ev as (
  select e.* from public.site_events e, params p where e.created_at >= p.since
),
sess_vehicle as (
  select distinct session_id from ev where event_type = 'vehicle_view'
),
sess_interest as (
  select distinct session_id from ev
  where event_type in ('interest_click', 'interest_submit', 'whatsapp_click')
),
summary as (
  select
    count(distinct session_id)                                             as sessions,
    count(distinct visitor_id) filter (where visitor_id is not null)       as visitors,
    count(*) filter (where event_type = 'page_view')                       as page_views,
    count(*) filter (where event_type = 'vehicle_view')                    as vehicle_views,
    count(*) filter (where event_type = 'interest_click')                  as interest_clicks,
    count(*) filter (where event_type = 'interest_submit')                 as interest_submits,
    count(*) filter (where event_type = 'whatsapp_click')                  as whatsapp_clicks,
    count(*) filter (where event_type = 'share_click')                     as shares,
    count(*) filter (where event_type = 'sell_lead_submit')                as sell_leads,
    count(*) filter (where event_type = 'search')                          as searches,
    coalesce(avg(duration_ms) filter (
      where event_type = 'vehicle_time' and duration_ms between 1000 and 3600000
    ), 0)::bigint                                                          as avg_vehicle_time_ms,
    coalesce(sum(duration_ms) filter (
      where event_type = 'vehicle_time' and duration_ms between 1000 and 3600000
    ), 0)::bigint                                                          as total_vehicle_time_ms
  from ev
),
by_day as (
  select
    to_char(date_trunc('day', created_at), 'YYYY-MM-DD')                   as dia,
    count(distinct session_id)                                             as sessions,
    count(*) filter (where event_type = 'vehicle_view')                    as vehicle_views,
    count(*) filter (where event_type in ('interest_click', 'interest_submit')) as interest_clicks
  from ev
  group by 1
  order by 1
),
top_vehicles as (
  select
    e.vehicle_id,
    coalesce(
      nullif(btrim(concat_ws(' ', v.brand, v.model, v.version)), ''),
      max(e.metadata->>'label'),
      'Veículo removido'
    )                                                                      as label,
    max(v.slug)                                                            as slug,
    count(*) filter (where e.event_type = 'vehicle_view')                  as views,
    count(distinct e.session_id) filter (where e.event_type = 'vehicle_view') as sessions,
    count(*) filter (where e.event_type = 'interest_click')                as interest_clicks,
    count(*) filter (where e.event_type = 'interest_submit')               as interest_submits,
    count(*) filter (where e.event_type = 'whatsapp_click')                as whatsapp_clicks,
    count(*) filter (where e.event_type = 'gallery_open')                  as gallery_opens,
    coalesce(avg(e.duration_ms) filter (
      where e.event_type = 'vehicle_time' and e.duration_ms between 1000 and 3600000
    ), 0)::bigint                                                          as avg_time_ms
  from ev e
  left join public.vehicles v on v.id = e.vehicle_id
  where e.vehicle_id is not null
  group by e.vehicle_id, v.brand, v.model, v.version
  order by views desc, interest_clicks desc
  limit 25
),
top_pages as (
  select path, count(*) as views, count(distinct session_id) as sessions
  from ev
  where event_type = 'page_view' and path is not null
  group by path
  order by views desc
  limit 10
),
top_searches as (
  select lower(btrim(metadata->>'term')) as term, count(*) as total
  from ev
  where event_type = 'search' and coalesce(btrim(metadata->>'term'), '') <> ''
  group by 1
  order by total desc
  limit 15
),
top_filters as (
  select
    coalesce(metadata->>'field', 'filtro')                                 as field,
    coalesce(metadata->>'value', '')                                       as value,
    count(*)                                                               as total
  from ev
  where event_type = 'filter'
  group by 1, 2
  order by total desc
  limit 15
),
devices as (
  select coalesce(nullif(device, ''), 'desconhecido') as device,
         count(distinct session_id) as sessions
  from ev
  group by 1
  order by sessions desc
),
referrers as (
  select
    coalesce(nullif(metadata->>'referrer_host', ''), 'direto')             as origem,
    count(distinct session_id)                                             as sessions
  from ev
  where event_type = 'page_view'
  group by 1
  order by sessions desc
  limit 10
)
select jsonb_build_object(
  'days', greatest(coalesce(p_days, 30), 1),
  'generated_at', now(),
  'summary', (
    select to_jsonb(s) || jsonb_build_object(
      'sessions_with_vehicle', (select count(*) from sess_vehicle),
      'sessions_with_interest', (select count(*) from sess_interest),
      'sessions_without_interest', greatest(
        (select count(*) from sess_vehicle) - (select count(*) from sess_interest), 0
      )
    )
    from summary s
  ),
  'by_day', coalesce((select jsonb_agg(to_jsonb(d)) from by_day d), '[]'::jsonb),
  'top_vehicles', coalesce((select jsonb_agg(to_jsonb(t)) from top_vehicles t), '[]'::jsonb),
  'top_pages', coalesce((select jsonb_agg(to_jsonb(p)) from top_pages p), '[]'::jsonb),
  'top_searches', coalesce((select jsonb_agg(to_jsonb(s)) from top_searches s), '[]'::jsonb),
  'top_filters', coalesce((select jsonb_agg(to_jsonb(f)) from top_filters f), '[]'::jsonb),
  'devices', coalesce((select jsonb_agg(to_jsonb(d)) from devices d), '[]'::jsonb),
  'referrers', coalesce((select jsonb_agg(to_jsonb(r)) from referrers r), '[]'::jsonb)
);
$$;

revoke all on function public.admin_analytics(integer) from public, anon, authenticated;

-- Limpeza opcional: mantém o histórico dos últimos 400 dias.
create or replace function public.purge_old_site_events()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_deleted integer;
begin
  delete from public.site_events where created_at < now() - interval '400 days';
  get diagnostics v_deleted = row_count;
  return v_deleted;
end;
$$;

revoke all on function public.purge_old_site_events() from public, anon, authenticated;

commit;
