import { supabase } from "@/api/supabaseClient";

// Colunas necessarias para o catalogo.
// Nao inclui description/features nem embed_html: o HTML 360 pode ser muito
// grande e deve ser baixado somente na pagina de detalhe.
const CATALOG_COLS = [
  "id", "brand", "model", "version",
  "year", "manufacture_year", "mileage",
  "price", "price_old",
  "images", "has_embed",
  "featured", "status", "hidden",
  "vehicle_type", "body_type", "fuel_type",
  "transmission", "condition", "color",
  "created_date",
].join(",");

const DETAIL_COLS = [
  "id", "brand", "model", "version",
  "year", "manufacture_year", "mileage",
  "price", "price_old",
  "images", "has_embed",
  "featured", "status", "hidden",
  "vehicle_type", "body_type", "fuel_type",
  "transmission", "condition", "color",
  "created_date", "listed_date", "stock_quantity",
  "description", "features", "doors", "engine",
].join(",");

export const VEHICLES_QUERY_KEY = ["vehicles"];
export const VEHICLES_ADMIN_QUERY_KEY = ["vehicles", "admin"];
export const FIVE_MIN = 5 * 60 * 1000;

export async function fetchVehiclesCatalog() {
  const { data, error } = await supabase
    .from("vehicles")
    .select(CATALOG_COLS)
    .order("created_date", { ascending: false })
    .limit(200);
  if (error) throw error;
  return data ?? [];
}

// Admin: mesmas colunas do catalogo mas sem limite de 200 e inclui ocultos.
export async function fetchVehiclesAdmin() {
  const { data, error } = await supabase
    .from("vehicles")
    .select(CATALOG_COLS)
    .order("created_date", { ascending: false })
    .limit(500);
  if (error) throw error;
  return data ?? [];
}

export async function fetchVehicleDetail(id) {
  const { data, error } = await supabase
    .from("vehicles")
    .select(DETAIL_COLS)
    .eq("id", id)
    .single();
  if (error && error.code !== "PGRST116") throw error;
  return data ?? null;
}

export async function fetchVehicleEmbed(id) {
  const { data, error } = await supabase
    .from("vehicles")
    .select("embed_html")
    .eq("id", id)
    .single();
  if (error && error.code !== "PGRST116") throw error;
  return data?.embed_html || "";
}
