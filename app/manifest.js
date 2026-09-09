import { getCachedPublicSettings } from "@/lib/serverPublicData";

export const revalidate = 3600;

// Manifesto PWA gerado a partir das configurações da loja (nome, logo).
// Servido em /manifest.webmanifest.
export default async function manifest() {
  const settings = await getCachedPublicSettings().catch(() => null);
  const name = settings?.store_name || "Prestiger Motors";
  const description =
    settings?.store_tagline ||
    settings?.footer_about ||
    "Catálogo de veículos selecionados com atendimento direto no WhatsApp.";

  const icons = [
    { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
    { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
    { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
  ];

  return {
    name,
    short_name: name.split(" ")[0] || name,
    description,
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#14181F",
    lang: "pt-BR",
    dir: "ltr",
    categories: ["shopping", "business"],
    icons,
  };
}
