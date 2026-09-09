import { getBaseUrl } from "@/lib/siteUrl";
import { getCachedVehiclesCatalog, getCachedSitePages } from "@/lib/serverPublicData";
import { vehiclePath } from "@/lib/vehicleUrl";

export const revalidate = 3600;

function toDate(value) {
  const date = value ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime()) ? date : new Date();
}

// /sitemap.xml — páginas fixas + cada veículo publicado + páginas do site (admin).
export default async function sitemap() {
  const base = getBaseUrl();

  const staticRoutes = [
    { url: `${base}/`, changeFrequency: "daily", priority: 1 },
    { url: `${base}/vender`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/privacidade`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/termos`, changeFrequency: "yearly", priority: 0.3 },
  ].map((route) => ({ ...route, lastModified: new Date() }));

  const [vehicles, pages] = await Promise.all([
    getCachedVehiclesCatalog().catch(() => []),
    getCachedSitePages().catch(() => []),
  ]);

  const vehicleRoutes = (vehicles || [])
    .filter((v) => v && !v.hidden)
    .map((v) => ({
      url: `${base}${vehiclePath(v)}`,
      lastModified: toDate(v.updated_date || v.created_date),
      changeFrequency: "weekly",
      priority: 0.7,
    }));

  const pageRoutes = (pages || [])
    .filter((p) => p && p.kind !== "link" && p.slug)
    .map((p) => ({
      url: `${base}/pagina/${p.slug}`,
      lastModified: toDate(p.updated_date),
      changeFrequency: "monthly",
      priority: 0.4,
    }));

  return [...staticRoutes, ...vehicleRoutes, ...pageRoutes];
}
