import { getBaseUrl } from "@/lib/siteUrl";

// /robots.txt — libera o site público e bloqueia áreas internas.
export default function robots() {
  const base = getBaseUrl();

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/admin/", "/api/"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
