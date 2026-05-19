import { createClient } from "@supabase/supabase-js";
import VehicleDetail from "@/views/VehicleDetail";
import { formatCurrency, formatMileage, formatYear } from "@/lib/formatters";

const VEHICLE_META_COLS = [
  "id", "brand", "model", "version",
  "year", "manufacture_year", "price", "mileage",
  "fuel_type", "transmission", "images",
].join(",");

function getBaseUrl() {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit.replace(/\/$/, "");

  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;
  if (vercel) return `https://${vercel}`.replace(/\/$/, "");

  return "http://localhost:3000";
}

function absoluteUrl(url) {
  if (!url) return "";
  if (/^https?:\/\//i.test(url)) return url;
  return `${getBaseUrl()}${url.startsWith("/") ? "" : "/"}${url}`;
}

async function fetchVehicleMeta(id) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key || !id) return null;

  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data } = await supabase
    .from("vehicles")
    .select(VEHICLE_META_COLS)
    .eq("id", id)
    .single();

  return data || null;
}

async function fetchStoreName() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return "Prestiger Motors";

  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data } = await supabase
    .from("public_store_settings")
    .select("store_name")
    .order("updated_date", { ascending: false })
    .limit(1);

  return data?.[0]?.store_name || "Prestiger Motors";
}

export async function generateMetadata({ params }) {
  const [vehicle, storeName] = await Promise.all([
    fetchVehicleMeta(params.id),
    fetchStoreName(),
  ]);

  if (!vehicle) {
    return {
      title: `Veículo não encontrado | ${storeName}`,
      description: `Confira o catálogo da ${storeName}.`,
    };
  }

  const name = `${vehicle.brand || ""} ${vehicle.model || ""}`.trim();
  const fullName = `${name}${vehicle.version ? ` ${vehicle.version}` : ""}`.trim();
  const year = formatYear(vehicle.manufacture_year, vehicle.year);
  const specs = [
    year ? `Ano ${year}` : "",
    vehicle.mileage ? formatMileage(vehicle.mileage) : "",
    vehicle.fuel_type || "",
    vehicle.transmission || "",
  ].filter(Boolean);
  const price = vehicle.price ? formatCurrency(vehicle.price) : "";
  const description = [
    `Olha o que eu encontrei no site da ${storeName}.`,
    specs.join(" • "),
    price,
  ].filter(Boolean).join(" ");
  const pageUrl = `${getBaseUrl()}/veiculo/${vehicle.id}`;
  const image = absoluteUrl(vehicle.images?.[0]);

  return {
    title: `${fullName} | ${storeName}`,
    description,
    alternates: { canonical: pageUrl },
    openGraph: {
      title: fullName,
      description,
      url: pageUrl,
      siteName: storeName,
      type: "website",
      locale: "pt_BR",
      images: image
        ? [{ url: image, width: 1200, height: 900, alt: fullName }]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: fullName,
      description,
      images: image ? [image] : undefined,
    },
  };
}

export default function Page() {
  return <VehicleDetail />;
}
