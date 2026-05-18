alter table public.vehicles
add column if not exists has_embed boolean
generated always as (nullif(btrim(coalesce(embed_html, '')), '') is not null) stored;

create index if not exists vehicles_has_embed_idx
on public.vehicles (has_embed)
where has_embed = true;

create index if not exists vehicles_model_id_idx on public.vehicles (model_id);
create index if not exists vehicles_body_type_id_idx on public.vehicles (body_type_id);
create index if not exists vehicles_fuel_type_id_idx on public.vehicles (fuel_type_id);
create index if not exists vehicles_transmission_id_idx on public.vehicles (transmission_id);
create index if not exists vehicles_condition_id_idx on public.vehicles (condition_id);
create index if not exists vehicles_color_id_idx on public.vehicles (color_id);
