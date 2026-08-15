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
  "stock_quantity",
  "vehicle_type", "body_type", "fuel_type",
  "transmission", "condition", "color",
  "created_date",
].join(",");

export const VEHICLES_QUERY_KEY = ["vehicles"];
export const VEHICLES_ADMIN_QUERY_KEY = ["vehicles", "admin"];
export const FIVE_MIN = 5 * 60 * 1000;

export async function fetchVehiclesCatalog() {
  const response = await fetch("/api/public/vehicles");
  if (!response.ok) throw new Error("Falha ao carregar o catalogo.");
  const payload = await response.json();
  return payload.vehicles ?? [];
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
  const response = await fetch(`/api/public/vehicles/${encodeURIComponent(id)}`);
  if (response.status === 404) return null;
  if (!response.ok) throw new Error("Falha ao carregar o veiculo.");
  const payload = await response.json();
  return payload.vehicle ?? null;
}

export async function fetchVehicleEmbed(id) {
  const response = await fetch(`/api/public/vehicles/${encodeURIComponent(id)}/embed`);
  if (response.status === 404) return "";
  if (!response.ok) throw new Error("Falha ao carregar a visualizacao 360.");
  const payload = await response.json();
  return payload.embed_html || "";
}
