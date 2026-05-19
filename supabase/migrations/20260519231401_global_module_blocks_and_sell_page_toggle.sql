begin;

alter table public.store_settings
  add column if not exists sell_page_enabled boolean not null default true;

alter table public.admin_module_access
  drop constraint if exists admin_module_access_role_check;

insert into public.admin_module_access (role, module_key, enabled, updated_at)
select
  'global',
  module_key,
  bool_and(enabled),
  now()
from public.admin_module_access
group by module_key
on conflict (role, module_key) do update
set enabled = excluded.enabled,
    updated_at = now();

delete from public.admin_module_access
where role <> 'global';

alter table public.admin_module_access
  add constraint admin_module_access_role_check
  check (role = 'global');

create or replace function private.can_access_module(
  p_module_key text,
  p_allowed_roles text[] default array['super_admin', 'admin', 'vendedor']::text[]
)
returns boolean
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  v_role text;
  v_enabled boolean;
begin
  select p.role
    into v_role
  from public.profiles p
  where p.id = auth.uid()
    and p.active = true
  limit 1;

  if v_role is null then
    return false;
  end if;

  if v_role = 'super_admin' then
    return true;
  end if;

  if not (v_role = any(p_allowed_roles)) then
    return false;
  end if;

  select ama.enabled
    into v_enabled
  from public.admin_module_access ama
  where ama.role = 'global'
    and ama.module_key = p_module_key
  limit 1;

  return coalesce(v_enabled, true);
end;
$$;

revoke all on function private.can_access_module(text, text[]) from public, anon, authenticated;
grant execute on function private.can_access_module(text, text[]) to authenticated;

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
  interest_form_success_message, interest_form_fields,
  created_date, updated_date, sell_page_enabled
from public.store_settings;

revoke all on table public.public_store_settings from anon, authenticated;
grant select on table public.public_store_settings to anon, authenticated;

commit;
