// Uses Supabase image transformations only when explicitly enabled.
// Projects without that paid feature keep the original public Storage URL.
// Non-Supabase URLs pass through unchanged — no breakage on external images.
const BASE = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const ENABLED = process.env.NEXT_PUBLIC_SUPABASE_IMAGE_TRANSFORMATIONS === "true";
const OBJ  = "/storage/v1/object/public/";
const REND = "/storage/v1/render/image/public/";

export function imgUrl(src, { w, h, q = 75 } = {}) {
  if (!src || !ENABLED || !BASE || !src.startsWith(BASE + OBJ)) return src;
  const file = src.slice((BASE + OBJ).length);
  const p = new URLSearchParams({ quality: String(q) });
  if (w) p.set("width",  String(w));
  if (h) p.set("height", String(h));
  // resize=cover só quando ambas as dimensões são fornecidas (ex: thumbnails quadrados).
  // Com apenas largura, o Supabase já mantém proporção sem recortar.
  if (w && h) p.set("resize", "cover");
  return `${BASE}${REND}${file}?${p}`;
}
