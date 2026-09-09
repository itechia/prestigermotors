import VehicleDetail from "@/views/VehicleDetail";
import { formatCurrency, formatMileage, formatYear } from "@/lib/formatters";
import { getCachedStoreName, getCachedVehicleDetail } from "@/lib/serverPublicData";

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

export async function generateMetadata({ params }) {
  const [vehicle, storeName] = await Promise.all([
    getCachedVehicleDetail(params.id),
    getCachedStoreName(),
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

export default async function Page({ params }) {
  const vehicle = await getCachedVehicleDetail(params.id);
  return <VehicleDetail initialVehicle={vehicle} />;
}
