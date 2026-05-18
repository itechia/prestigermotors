begin;

create or replace function public.pm_slugify(input text)
returns text
language sql
immutable
as $$
  select nullif(
    trim(both '_' from regexp_replace(
      lower(translate(coalesce(input, ''),
        'ÁÀÃÂÄáàãâäÉÈÊËéèêëÍÌÎÏíìîïÓÒÕÔÖóòõôöÚÙÛÜúùûüÇç',
        'AAAAAaaaaaEEEEeeeeIIIIiiiiOOOOOoooooUUUUuuuuCc'
      )),
      '[^a-z0-9]+', '_', 'g'
    )),
    ''
  );
$$;

update public.vehicles
set
  vehicle_type = case
    when public.pm_slugify(vehicle_type) in ('caminhao', 'caminho') then 'caminhao'
    else public.pm_slugify(vehicle_type)
  end,
  body_type = public.pm_slugify(body_type),
  fuel_type = public.pm_slugify(fuel_type),
  transmission = public.pm_slugify(transmission),
  condition = public.pm_slugify(condition),
  color = public.pm_slugify(color),
  updated_date = now();

update public.store_settings
set
  tax_vehicle_types = '["Carro", "Moto", "Caminhão", "Van / Utilitário"]'::jsonb,
  tax_categories = '["Hatch", "Sedan", "SUV", "Picape", "Caçamba", "Cavalo mecânico", "Street", "Naked", "Trail", "Esportiva"]'::jsonb,
  tax_fuels = '["Flex", "Gasolina", "Etanol", "Diesel", "Elétrico", "Híbrido", "Híbrido Plug-in (PHEV)", "GNV"]'::jsonb,
  tax_transmissions = '["Automático", "Automático 6M", "Automático 7M", "Automático 8M", "Automático 9M", "Automático 10M", "Automático CVT", "Automático Allison 6M", "Automático HI-TRONIX 12M", "Automático Opticruise", "Automático Opticruise 12M", "Automático PowerShift 3", "Automático TipMatic 12M", "Manual 5M", "Manual 6M", "CVT", "Automatizado", "Dupla Embreagem (DCT)"]'::jsonb,
  tax_conditions = '["Novo", "Seminovo", "Usado"]'::jsonb,
  tax_colors = '["Branco", "Branco Ártico", "Branco Summit", "Branco Pérola", "Preto", "Preto Grafite", "Preto Ninja", "Preto Safira", "Prata", "Prata Estrela", "Prata Metálico", "Cinza", "Cinza Granite", "Cinza Platinum", "Grafite", "Vermelho", "Vermelho Chama", "Vermelho Chili", "Vermelho Fiery", "Vermelho Iveco", "Vermelho Rallye", "Azul", "Azul Escuro", "Azul Metálico", "Azul Performance", "Azul Riva", "Azul Scania", "Azul Yamaha", "Verde", "Verde Kawasaki", "Laranja", "Laranja Atacama", "Laranja Sol", "Amarelo", "Bege", "Marrom", "Champanhe", "Vinho", "Dourado", "Bronze", "Roxo"]'::jsonb,
  interest_form_fields = case
    when interest_form_fields is null or jsonb_array_length(interest_form_fields) = 0 then
      '[{"key":"name","type":"text","label":"Nome completo","required":true,"placeholder":"Como prefere ser chamado?"},{"key":"phone","type":"phone","label":"WhatsApp / Telefone","required":true,"placeholder":"(11) 99999-9999"},{"key":"message","type":"textarea","label":"Mensagem (opcional)","required":false,"placeholder":"Quero negociar, agendar uma visita ou receber mais informações."}]'::jsonb
    else interest_form_fields
  end,
  updated_date = now();

create index if not exists vehicles_public_catalog_idx
  on public.vehicles (created_date desc)
  where hidden = false;

create index if not exists vehicles_public_filters_idx
  on public.vehicles (vehicle_type, body_type, fuel_type, transmission, condition, price, manufacture_year)
  where hidden = false;

create index if not exists sell_leads_status_created_idx
  on public.sell_leads (status, created_date desc);

create unique index if not exists store_settings_singleton_idx
  on public.store_settings ((true));

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'vehicles_price_nonnegative'
      and conrelid = 'public.vehicles'::regclass
  ) then
    alter table public.vehicles
      add constraint vehicles_price_nonnegative
      check (price >= 0 and coalesce(price_old, 0) >= 0 and mileage >= 0 and stock_quantity >= 0);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'sell_leads_asking_price_nonnegative'
      and conrelid = 'public.sell_leads'::regclass
  ) then
    alter table public.sell_leads
      add constraint sell_leads_asking_price_nonnegative
      check (asking_price is null or asking_price >= 0);
  end if;
end $$;

drop policy if exists veiculos_leitura_publica on public.vehicles;
drop policy if exists veiculos_select_publicos on public.vehicles;
drop policy if exists veiculos_select_admin on public.vehicles;

create policy veiculos_select_publicos on public.vehicles
  for select
  to anon
  using (hidden = false);

create policy veiculos_select_admin on public.vehicles
  for select
  to authenticated
  using (true);

create or replace view public.public_store_settings as
select
  id, store_name, store_name_font, store_tagline, logo_url, whatsapp_number,
  phone_number, address, instagram_url, facebook_url, youtube_url, tiktok_url,
  social_show_instagram, social_show_facebook, social_show_youtube,
  social_show_tiktok, social_show_whatsapp, social_logo_instagram,
  social_logo_facebook, social_logo_youtube, social_logo_tiktok,
  social_logo_whatsapp, hero_eyebrow, hero_title, hero_highlight,
  hero_subtitle, hero_image_url, hero_image_url_mobile, hero_slides,
  hero_slide_interval, hero_stat_rating, hero_stat_rating_label,
  hero_stat_2_value, hero_stat_2_label, hero_stat_3_value,
  hero_stat_3_label, brands, trust_items, guarantee_section_title,
  guarantee_section_subtitle, guarantees, reviews_title, reviews_rating,
  reviews_count, reviews_visible, reviews, lead_form_title,
  lead_form_subtitle, lead_form_message, footer_text, footer_about,
  footer_institutional, footer_institutional_title, footer_institutional_desc,
  footer_help, footer_help_title, footer_help_desc, footer_payment,
  footer_payment_title, footer_payment_desc, tax_vehicle_types,
  tax_categories, tax_models, tax_colors, tax_fuels, tax_transmissions,
  tax_conditions, interest_webhook_enabled, interest_form_title,
  interest_form_subtitle, interest_form_submit_label,
  interest_form_success_message, interest_form_fields, created_date,
  updated_date
from public.store_settings;

revoke all on table public.public_store_settings from anon, authenticated;
grant select on table public.public_store_settings to anon, authenticated;

revoke all on table public.store_settings from anon;
grant select, insert, update, delete on table public.store_settings to authenticated;

revoke insert, update, delete, truncate, references, trigger on table public.vehicles from anon;
grant select on table public.vehicles to anon;
grant select, insert, update, delete on table public.vehicles to authenticated;

revoke all on table public.sell_leads from anon;
grant insert on table public.sell_leads to anon;
grant select, insert, update, delete on table public.sell_leads to authenticated;

revoke all on table public.profiles from anon;
grant select, insert, update, delete on table public.profiles to authenticated;

comment on view public.public_store_settings is
  'Configurações públicas da loja sem URLs, usuários, senhas ou segredos de webhooks.';

commit;
