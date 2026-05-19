// Default content used when StoreSettings has no value for a field.
// Keeps the site fully functional on first render, even if admin hasn't
// customised anything yet.

export const DEFAULT_SETTINGS = {
  store_name: "Automatizei AI",
  store_name_font: "Plus Jakarta Sans",
  store_tagline: "Veículos selecionados com inteligência.",
  logo_url: "",
  whatsapp_number: "",
  phone_number: "",
  address: "",
  instagram_url: "",
  facebook_url: "",
  youtube_url: "",
  tiktok_url: "",
  social_show_instagram: true,
  social_show_facebook: true,
  social_show_youtube: true,
  social_show_tiktok: true,
  social_show_whatsapp: true,

  hero_eyebrow: "",
  hero_title: "",
  hero_highlight: "",
  hero_subtitle: "",
  hero_image_url: "",
  hero_image_url_mobile: "",
  hero_slides: [],
  hero_slide_interval: 5,
  brands: [],
  hero_stat_rating: "",
  hero_stat_rating_label: "",
  hero_stat_2_value: "",
  hero_stat_2_label: "",
  hero_stat_3_value: "",
  hero_stat_3_label: "",

  trust_items: [],

  guarantee_section_title: "",
  guarantee_section_subtitle: "",
  guarantees: [],

  reviews_rating: "",
  reviews_count: "",
  reviews_title: "",
  reviews_visible: true,
  reviews: [],

  lead_form_title: "Tenho interesse neste veículo",
  lead_form_subtitle: "Preencha seus dados e nossa equipe entra em contato em poucos minutos.",
  lead_form_message: "Olá! Sou {name}. Tenho interesse no {vehicle} ({price}). Meu telefone: {phone}",

  footer_text: "",
  footer_about: "Plataforma inteligente para compra e venda de veículos. Transparência, segurança e agilidade em cada negócio.",
  footer_institutional: [],
  footer_help: [],
  footer_payment: [],

  // Configurable taxonomies (admin > Categorias). Empty by default — useTaxonomies()
  // applies legacy fallbacks for the lists that already had hard-coded enums.
  tax_vehicle_types: [],
  tax_categories: [],
  tax_models: [],
  tax_colors: [],
  tax_fuels: [],
  tax_transmissions: [],
  tax_conditions: [],

  // Webhooks & automations (opt-in)
  interest_webhook_enabled: false,
  interest_webhook_url: "",
  interest_webhook_secret: "",
  interest_webhook_auth_enabled: false,
  interest_webhook_auth_user: "",
  interest_webhook_auth_pass: "",
  interest_form_title: "Tenho interesse neste veículo",
  interest_form_subtitle: "Preencha seus dados e nossa equipe entra em contato em poucos minutos.",
  interest_form_submit_label: "Enviar interesse",
  interest_form_success_message: "Recebemos seu interesse! Nossa equipe vai te chamar em instantes.",
  interest_form_fields: [],

  sell_webhook_enabled: false,
  sell_page_enabled: true,
  sell_webhook_url: "",
  sell_webhook_secret: "",
  sell_webhook_auth_enabled: false,
  sell_webhook_auth_user: "",
  sell_webhook_auth_pass: "",

  // Footer column titles/descs
  footer_institutional_title: "Institucional",
  footer_institutional_desc: "",
  footer_help_title: "Atendimento",
  footer_help_desc: "",
  footer_payment_title: "Negócios",
  footer_payment_desc: "",

  // Social custom logos
  social_logo_instagram: "",
  social_logo_facebook: "",
  social_logo_youtube: "",
  social_logo_tiktok: "",
  social_logo_whatsapp: "",
};

// Merge admin-provided settings with defaults.
// Cache por referência: evita criar novo objeto a cada renderização.
let _lastInput = null;
let _lastOutput = null;
export function withDefaults(settings) {
  if (!settings) return DEFAULT_SETTINGS;
  if (settings === _lastInput) return _lastOutput;
  _lastInput  = settings;
  _lastOutput = { ...DEFAULT_SETTINGS, ...settings };
  return _lastOutput;
}

export const SETTINGS_SINGLETON_QUERY_KEY = ["store-settings"];
export const SETTINGS_RAW_QUERY_KEY = ["store-settings", "raw"];
