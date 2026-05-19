alter table public.profiles
  add column if not exists role text not null default 'admin',
  add column if not exists active boolean not null default true,
  add column if not exists must_change_password boolean not null default false,
  add column if not exists last_login_at timestamptz,
  add column if not exists created_by uuid;

alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check check (role in ('admin','vendedor'));

create table if not exists public.vehicle_sales (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references public.vehicles(id) on delete restrict,
  seller_id uuid references auth.users(id) on delete set null,
  quantity integer not null default 1 check (quantity > 0),
  sale_price numeric not null check (sale_price >= 0),
  customer_name text,
  customer_phone text,
  payment_method text,
  notes text,
  sold_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null,
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now()
);

create index if not exists vehicle_sales_vehicle_date_idx on public.vehicle_sales (vehicle_id, sold_at desc);
create index if not exists vehicle_sales_seller_date_idx on public.vehicle_sales (seller_id, sold_at desc);
create index if not exists vehicle_sales_created_date_idx on public.vehicle_sales (created_date desc);

alter table public.vehicle_sales enable row level security;

drop policy if exists vehicle_sales_select_authenticated on public.vehicle_sales;
create policy vehicle_sales_select_authenticated on public.vehicle_sales
  for select to authenticated using (true);

drop policy if exists vehicle_sales_insert_authenticated on public.vehicle_sales;
create policy vehicle_sales_insert_authenticated on public.vehicle_sales
  for insert to authenticated with check (true);

drop policy if exists vehicle_sales_update_admin on public.vehicle_sales;
create policy vehicle_sales_update_admin on public.vehicle_sales
  for update to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin' and p.active))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin' and p.active));

drop policy if exists vehicle_sales_delete_admin on public.vehicle_sales;
create policy vehicle_sales_delete_admin on public.vehicle_sales
  for delete to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin' and p.active));

create or replace function public.register_vehicle_sale_admin(
  p_actor_id uuid,
  p_vehicle_id uuid,
  p_seller_id uuid,
  p_quantity integer,
  p_sale_price numeric,
  p_customer_name text default null,
  p_customer_phone text default null,
  p_payment_method text default null,
  p_notes text default null,
  p_sold_at timestamptz default now()
)
returns public.vehicle_sales
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor public.profiles%rowtype;
  v_vehicle public.vehicles%rowtype;
  v_remaining integer;
  v_sale public.vehicle_sales%rowtype;
begin
  select * into v_actor from public.profiles where id = p_actor_id and active = true;
  if not found or v_actor.role not in ('admin','vendedor') then
    raise exception 'Usuário sem permissão para registrar venda';
  end if;

  if coalesce(p_quantity, 0) <= 0 then
    raise exception 'Quantidade inválida';
  end if;

  select * into v_vehicle from public.vehicles where id = p_vehicle_id for update;
  if not found then
    raise exception 'Veículo não encontrado';
  end if;

  if v_vehicle.stock_quantity < p_quantity then
    raise exception 'Estoque insuficiente. Disponível: %', v_vehicle.stock_quantity;
  end if;

  v_remaining := v_vehicle.stock_quantity - p_quantity;

  insert into public.vehicle_sales (
    vehicle_id, seller_id, quantity, sale_price, customer_name, customer_phone,
    payment_method, notes, sold_at, created_by
  ) values (
    p_vehicle_id,
    coalesce(p_seller_id, p_actor_id),
    p_quantity,
    p_sale_price,
    nullif(btrim(coalesce(p_customer_name, '')), ''),
    nullif(btrim(coalesce(p_customer_phone, '')), ''),
    nullif(btrim(coalesce(p_payment_method, '')), ''),
    nullif(btrim(coalesce(p_notes, '')), ''),
    coalesce(p_sold_at, now()),
    p_actor_id
  ) returning * into v_sale;

  update public.vehicles
  set stock_quantity = v_remaining,
      status = case when v_remaining <= 0 then 'vendido' else 'disponivel' end,
      updated_date = now()
  where id = p_vehicle_id;

  return v_sale;
end;
$$;

grant execute on function public.register_vehicle_sale_admin(uuid, uuid, uuid, integer, numeric, text, text, text, text, timestamptz) to service_role;

create table if not exists public.admin_user_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id) on delete set null,
  target_user_id uuid references auth.users(id) on delete set null,
  action text not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists admin_user_logs_actor_date_idx on public.admin_user_logs (actor_id, created_at desc);
create index if not exists admin_user_logs_target_date_idx on public.admin_user_logs (target_user_id, created_at desc);
create index if not exists admin_user_logs_created_at_idx on public.admin_user_logs (created_at desc);

alter table public.admin_user_logs enable row level security;

drop policy if exists admin_user_logs_select_admin on public.admin_user_logs;
create policy admin_user_logs_select_admin on public.admin_user_logs
  for select to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin' and p.active));

drop policy if exists admin_user_logs_insert_admin on public.admin_user_logs;
create policy admin_user_logs_insert_admin on public.admin_user_logs
  for insert to authenticated
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin' and p.active));
