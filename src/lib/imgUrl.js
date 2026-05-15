// Transforms Supabase Storage URLs to use the image transformation API.
// Supabase serves resized/compressed images via /storage/v1/render/image/.
// Non-Supabase URLs pass through unchanged — no breakage on external images.
const BASE = import.meta.env.VITE_SUPABASE_URL ?? "";
const OBJ  = "/storage/v1/object/public/";
const REND = "/storage/v1/render/image/public/";

export function imgUrl(src, { w, h, q = 75 } = {}) {
  if (!src || !BASE || !src.startsWith(BASE + OBJ)) return src;
  const file = src.slice((BASE + OBJ).length);
  const p = new URLSearchParams({ quality: String(q), resize: "cover" });
  if (w) p.set("width",  String(w));
  if (h) p.set("height", String(h));
  return `${BASE}${REND}${file}?${p}`;
}
