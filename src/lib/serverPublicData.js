import "server-only";

import { createClient } from "@supabase/supabase-js";
import { unstable_cache } from "next/cache";

const CATALOG_COLS = [
  "id", "brand", "model", "version",
  "year", "manufacture_year", "mileage",
  "price", "price_old", "images", "has_embed",
  "featured", "status", "hidden", "stock_quantity",
  "vehicle_type", "body_type", "fuel_type",
  "transmission", "condition", "color", "created_date",
].join(",");

const DETAIL_COLS = [
  "id", "brand", "model", "version",
  "year", "manufacture_year", "mileage",
  "price", "price_old", "images", "has_embed",
  "featured", "status", "hidden", "vehicle_type",
  "body_type", "fuel_type", "transmission", "condition",
  "color", "created_date", "listed_date", "stock_quantity",
  "description", "features", "doors", "engine",
].join(",");

function getPublicSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export const getCachedVehiclesCatalog = unstable_cache(
  async () => {
    const supabase = getPublicSupabase();
    if (!supabase) return [];

    const { data, error } = await supabase
      .from("vehicles")
      .select(CATALOG_COLS)
      .order("created_date", { ascending: false })
      .limit(200);

    if (error) throw error;
    return data ?? [];
  },
  ["public-vehicles-catalog-v2"],
  { revalidate: 60, tags: ["public-vehicles"] }
);

export const getCachedVehicleDetail = unstable_cache(
  async (id) => {
    const supabase = getPublicSupabase();
    if (!supabase || !id) return null;

    const { data, error } = await supabase
      .from("vehicles")
      .select(DETAIL_COLS)
      .eq("id", id)
      .maybeSingle();

    if (error) throw error;
    return data ?? null;
  },
  ["public-vehicle-detail-v2"],
  { revalidate: 60, tags: ["public-vehicles"] }
);

export const getCachedVehicleEmbed = unstable_cache(
  async (id) => {
    const supabase = getPublicSupabase();
    if (!supabase || !id) return "";

    const { data, error } = await supabase
      .from("vehicles")
      .select("embed_html")
      .eq("id", id)
      .maybeSingle();

    if (error) throw error;
    return data?.embed_html || "";
  },
  ["public-vehicle-embed-v2"],
  { revalidate: 300, tags: ["public-vehicles"] }
);

export const getCachedStoreName = unstable_cache(
  async () => {
    const supabase = getPublicSupabase();
    if (!supabase) return "Prestiger Motors";

    const { data, error } = await supabase
      .from("public_store_settings")
      .select("store_name")
      .order("updated_date", { ascending: false })
      .limit(1);

    if (error) throw error;
    return data?.[0]?.store_name || "Prestiger Motors";
  },
  ["public-store-name-v1"],
  { revalidate: 300, tags: ["public-settings"] }
);

export const getCachedPublicSettings = unstable_cache(
  async () => {
    const supabase = getPublicSupabase();
    if (!supabase) return null;

    const { data, error } = await supabase
      .from("public_store_settings")
      .select("*")
      .order("updated_date", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return data ?? null;
  },
  ["public-store-settings-v1"],
  { revalidate: 300, tags: ["public-settings"] }
);

export const getCachedPublicTaxonomies = unstable_cache(
  async () => {
    const supabase = getPublicSupabase();
    if (!supabase) return { options: [], brands: [], models: [] };

    const [optionsResult, brandsResult, modelsResult] = await Promise.all([
      supabase.from("public_vehicle_taxonomy_options").select("*"),
      supabase.from("public_vehicle_brands").select("*"),
      supabase.from("public_vehicle_models").select("*"),
    ]);

    if (optionsResult.error) throw optionsResult.error;
    if (brandsResult.error) throw brandsResult.error;
    if (modelsResult.error) throw modelsResult.error;

    return {
      options: optionsResult.data ?? [],
      brands: brandsResult.data ?? [],
      models: modelsResult.data ?? [],
    };
  },
  ["public-vehicle-taxonomies-v1"],
  { revalidate: 300, tags: ["public-taxonomies"] }
);
