// URL base canônica do site — usada em metadados, sitemap, robots e Open Graph.
// Ordem: variável explícita > domínio de produção da Vercel > deploy atual > localhost.
export function getBaseUrl() {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit.replace(/\/$/, "");

  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;
  if (vercel) return `https://${vercel}`.replace(/\/$/, "");

  return "http://localhost:3000";
}

// Converte um caminho relativo em URL absoluta (necessário para Open Graph).
export function absoluteUrl(url) {
  if (!url) return "";
  if (/^https?:\/\//i.test(url)) return url;
  return `${getBaseUrl()}${url.startsWith("/") ? "" : "/"}${url}`;
}
