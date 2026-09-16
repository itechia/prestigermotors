import { notFound, permanentRedirect } from "next/navigation";
import VehicleDetail from "@/views/VehicleDetail";
import JsonLd from "@/components/JsonLd";
import { buildVehicleJsonLd } from "@/lib/structuredData";
import { formatCurrency, formatMileage, formatYear } from "@/lib/formatters";
import { getBaseUrl, absoluteUrl } from "@/lib/siteUrl";
import { isUuid, vehiclePath } from "@/lib/vehicleUrl";
import {
  getCachedStoreName,
  getCachedVehicleDetail,
  getCachedVehicleBySlug,
  getCachedPublicSettings,
} from "@/lib/serverPublicData";

// A rota aceita a slug (novo formato) e o UUID (links antigos já compartilhados).
async function resolveVehicle(param) {
  const key = decodeURIComponent(param || "");
  if (!key) return null;
  return isUuid(key)
    ? await getCachedVehicleDetail(key)
    : await getCachedVehicleBySlug(key);
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const [vehicle, storeName] = await Promise.all([
    resolveVehicle(slug),
    getCachedStoreName(),
  ]);

  if (!vehicle) {
    return {
      title: "Veículo não encontrado",
      description: `Este anúncio saiu do ar. Confira os veículos disponíveis no catálogo da ${storeName}.`,
      robots: { index: false, follow: true },
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
    `${fullName} à venda na ${storeName}.`,
    specs.join(" • "),
    price ? `Por ${price}.` : "",
    "Veja as fotos, a ficha completa e fale com a equipe pelo WhatsApp.",
  ].filter(Boolean).join(" ");
  const pageUrl = `${getBaseUrl()}${vehiclePath(vehicle)}`;
  const image = absoluteUrl(vehicle.images?.[0]);
  const title = `${fullName}${year ? ` ${year}` : ""}${price ? ` | ${price}` : ""}`;

  return {
    title,
    description,
    alternates: { canonical: pageUrl },
    robots: vehicle.hidden ? { index: false, follow: false } : undefined,
    openGraph: {
      title: fullName,
      description,
      url: pageUrl,
      siteName: storeName,
      type: "website",
      locale: "pt_BR",
      images: image
        ? [{ url: image, width: 1200, height: 900, alt: `${fullName}, foto do veículo` }]
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

export default async function Page({ params, searchParams }) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const [vehicle, settings] = await Promise.all([
    resolveVehicle(slug),
    getCachedPublicSettings().catch(() => null),
  ]);

  if (!vehicle) notFound();

  // Rede de segurança: o 308 normalmente vem do middleware; se ele não rodar,
  // o link antigo (UUID) ainda assim vai parar na URL com slug.
  if (vehicle.slug && isUuid(decodeURIComponent(slug || ""))) {
    const path = vehiclePath(vehicle);
    const queryString = new URLSearchParams(query || {}).toString();
    permanentRedirect(queryString ? `${path}?${queryString}` : path);
  }

  return (
    <>
      <JsonLd data={buildVehicleJsonLd(vehicle, settings)} />
      <VehicleDetail initialVehicle={vehicle} />
    </>
  );
}
