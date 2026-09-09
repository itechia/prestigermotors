import Catalog from "@/views/Catalog";
import JsonLd from "@/components/JsonLd";
import { buildDealerJsonLd } from "@/lib/structuredData";
import { getCachedVehiclesCatalog, getCachedPublicSettings } from "@/lib/serverPublicData";

export async function generateMetadata() {
  const [settings, vehicles] = await Promise.all([
    getCachedPublicSettings().catch(() => null),
    getCachedVehiclesCatalog().catch(() => []),
  ]);

  const storeName = settings?.store_name || "Prestiger Motors";
  const total = (vehicles || []).filter((v) => !v?.hidden).length;
  const description = total
    ? `${total} veículo${total > 1 ? "s" : ""} disponíve${total > 1 ? "is" : "l"} na ${storeName}. Compare preço, ano e quilometragem, veja as fotos e fale com a equipe pelo WhatsApp.`
    : `Confira o catálogo de veículos da ${storeName}: fotos, ficha completa e atendimento direto pelo WhatsApp.`;

  return {
    title: "Catálogo de veículos",
    description,
    alternates: { canonical: "/" },
    openGraph: {
      title: `Catálogo de veículos | ${storeName}`,
      description,
      url: "/",
      type: "website",
      images: [{ url: "/opengraph-image.png", width: 1200, height: 630, alt: storeName }],
    },
    twitter: {
      card: "summary_large_image",
      title: `Catálogo de veículos | ${storeName}`,
      description,
      images: ["/opengraph-image.png"],
    },
  };
}

export default async function Page() {
  const [vehicles, settings] = await Promise.all([
    getCachedVehiclesCatalog(),
    getCachedPublicSettings().catch(() => null),
  ]);

  return (
    <>
      <JsonLd data={buildDealerJsonLd(settings)} />
      <Catalog initialVehicles={vehicles} />
    </>
  );
}
