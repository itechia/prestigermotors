import SellMyVehicle from "@/views/SellMyVehicle";
import { getCachedPublicSettings } from "@/lib/serverPublicData";

export async function generateMetadata() {
  const settings = await getCachedPublicSettings().catch(() => null);
  const storeName = settings?.store_name || "Prestiger Motors";
  const description = `Venda seu carro, moto ou utilitário para a ${storeName}. Envie fotos e dados do veículo, receba uma proposta sem compromisso e negocie à vista ou na troca.`;

  return {
    title: "Venda seu veículo",
    description,
    alternates: { canonical: "/vender" },
    openGraph: {
      title: `Venda seu veículo | ${storeName}`,
      description,
      url: "/vender",
      type: "website",
      images: [{ url: "/opengraph-image.png", width: 1200, height: 630, alt: storeName }],
    },
    twitter: {
      card: "summary_large_image",
      title: `Venda seu veículo | ${storeName}`,
      description,
      images: ["/opengraph-image.png"],
    },
  };
}

export default function Page() {
  return <SellMyVehicle />;
}
