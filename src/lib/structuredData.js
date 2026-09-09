import { getBaseUrl, absoluteUrl } from "@/lib/siteUrl";
import { vehiclePath } from "@/lib/vehicleUrl";
import { formatYear } from "@/lib/formatters";

// Perfil da loja: nome, logo, telefone, endereço e redes sociais.
export function buildDealerJsonLd(settings) {
  const base = getBaseUrl();
  const name = settings?.store_name || "Prestiger Motors";
  const sameAs = [
    settings?.instagram_url,
    settings?.facebook_url,
    settings?.youtube_url,
    settings?.tiktok_url,
  ].filter(Boolean);

  return {
    "@context": "https://schema.org",
    "@type": "AutoDealer",
    "@id": `${base}/#loja`,
    name,
    url: base,
    ...(settings?.logo_url ? { logo: absoluteUrl(settings.logo_url) } : {}),
    ...(settings?.store_tagline ? { slogan: settings.store_tagline } : {}),
    ...(settings?.footer_about ? { description: settings.footer_about } : {}),
    ...(settings?.phone_number || settings?.whatsapp_number
      ? { telephone: settings.phone_number || settings.whatsapp_number }
      : {}),
    ...(settings?.address
      ? {
          address: {
            "@type": "PostalAddress",
            streetAddress: settings.address,
            addressCountry: "BR",
          },
        }
      : {}),
    ...(sameAs.length > 0 ? { sameAs } : {}),
    areaServed: "BR",
  };
}

// Anúncio de um veículo — habilita rich results de produto/oferta.
export function buildVehicleJsonLd(vehicle, settings) {
  if (!vehicle) return null;
  const base = getBaseUrl();
  const name = [vehicle.brand, vehicle.model, vehicle.version].filter(Boolean).join(" ");
  const year = formatYear(vehicle.manufacture_year, vehicle.year);
  const images = (vehicle.images || []).slice(0, 6).map((img) => absoluteUrl(img));
  const available = vehicle.status === "vendido"
    ? "https://schema.org/SoldOut"
    : "https://schema.org/InStock";

  return {
    "@context": "https://schema.org",
    "@type": "Car",
    name,
    url: `${base}${vehiclePath(vehicle)}`,
    ...(vehicle.description ? { description: vehicle.description } : {}),
    ...(images.length > 0 ? { image: images } : {}),
    ...(vehicle.brand ? { brand: { "@type": "Brand", name: vehicle.brand } } : {}),
    ...(vehicle.model ? { model: vehicle.model } : {}),
    ...(vehicle.color ? { color: vehicle.color } : {}),
    ...(year ? { vehicleModelDate: String(year).slice(-4) } : {}),
    ...(vehicle.fuel_type ? { fuelType: vehicle.fuel_type } : {}),
    ...(vehicle.transmission ? { vehicleTransmission: vehicle.transmission } : {}),
    ...(vehicle.doors ? { numberOfDoors: vehicle.doors } : {}),
    ...(vehicle.mileage
      ? {
          mileageFromOdometer: {
            "@type": "QuantitativeValue",
            value: vehicle.mileage,
            unitCode: "KMT",
          },
        }
      : {}),
    ...(vehicle.price
      ? {
          offers: {
            "@type": "Offer",
            price: vehicle.price,
            priceCurrency: "BRL",
            availability: available,
            url: `${base}${vehiclePath(vehicle)}`,
            ...(settings?.store_name
              ? { seller: { "@type": "AutoDealer", name: settings.store_name } }
              : {}),
          },
        }
      : {}),
  };
}
