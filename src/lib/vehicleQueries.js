import { supabase } from "@/api/supabaseClient";

// Colunas necessárias para o catálogo.
// NÃO inclui 'description' nem 'features' — podem ser textos/arrays grandes.
// A página de detalhe faz select(*) separado para obter o registro completo.
const CATALOG_COLS = [
  "id", "brand", "model", "version",
  "year", "manufacture_year", "mileage",
  "price", "price_old",
  "images", "embed_html",
  "featured", "status", "hidden",
  "vehicle_type", "body_type", "fuel_type",
  "transmission", "condition", "color",
  "created_date",
].join(",");

export const VEHICLES_QUERY_KEY = ["vehicles"];
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
