// Slug helpers for admin-created public pages (política de privacidade, termos, LGPD...).
// Used both client-side (auto-preencher o campo) e nas rotas admin (validação server-side).

export const RESERVED_SLUGS = [
  "veiculo",
  "vender",
  "admin",
  "api",
  "pagina",
];

const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;
// Combining diacritical marks (U+0300-U+036F) left behind by NFD normalization,
// built from char codes to avoid embedding literal combining characters in source.
const DIACRITICS_RANGE = `${String.fromCharCode(0x0300)}-${String.fromCharCode(0x036f)}`;
const DIACRITICS_PATTERN = new RegExp(`[${DIACRITICS_RANGE}]`, "g");

export function slugify(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(DIACRITICS_PATTERN, "") // remove acentos
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function isValidSlug(slug) {
  if (!slug || slug.length > 80) return false;
  if (!SLUG_PATTERN.test(slug)) return false;
  if (RESERVED_SLUGS.includes(slug)) return false;
  return true;
}
