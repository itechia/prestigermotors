import { supabase } from "@/api/supabaseClient";
import { compressImage } from "@/lib/compressImage";

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

// Pastas do bucket. O visitante anônimo (formulário "vender meu veículo") só
// tem permissão de escrita em "propostas/" — a policy do Storage recusa
// qualquer outro caminho. A equipe logada envia para "catalogo/".
const PASTA_PUBLICA = "propostas";
const PASTA_INTERNA = "catalogo";
const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

function formatBytes(bytes) {
  if (bytes >= 1_048_576) return `${(bytes / 1_048_576).toFixed(0)} MB`;
  return `${Math.round(bytes / 1024)} KB`;
}

// Extracts the storage path from a Supabase public URL for the "uploads" bucket.
function storagePathFromUrl(url) {
  if (!url) return null;
  const marker = "/storage/v1/object/public/uploads/";
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  return decodeURIComponent(url.slice(idx + marker.length));
}

// Deletes a file from the "uploads" bucket. Silently ignores non-storage URLs.
export async function deleteStorageFile(url) {
  const path = storagePathFromUrl(url);
  if (!path) return;
  try {
    await supabase.storage.from("uploads").remove([path]);
  } catch {
    // Non-critical — orphaned file cleanup should never break the UI
  }
}

export async function uploadFile({ file: original, maxBytes, compress = true }) {
  if (!ALLOWED_IMAGE_TYPES.has(original.type)) {
    throw new Error("Formato de imagem nao permitido. Use JPG, PNG, WebP ou GIF.");
  }

  // Redimensiona e recomprime no navegador antes de subir: catálogo mais leve
  // e menos fotos recusadas por tamanho.
  const file = compress ? await compressImage(original) : original;

  const effectiveMaxBytes = maxBytes || MAX_UPLOAD_BYTES;
  if (file.size > effectiveMaxBytes) {
    throw new Error(`Arquivo muito grande. Máximo permitido: ${formatBytes(effectiveMaxBytes)}.`);
  }

  const ext = file.name.split(".").pop();
  const safeName = file.name
    .replace(/\.[^/.]+$/, "")
    .replace(/[^a-zA-Z0-9]/g, "_")
    .slice(0, 60);

  const { data: sessao } = await supabase.auth.getSession();
  const pasta = sessao?.session ? PASTA_INTERNA : PASTA_PUBLICA;
  const path = `${pasta}/${Date.now()}-${crypto.randomUUID()}-${safeName}.${ext}`;

  const { error } = await supabase.storage
    .from("uploads")
    .upload(path, file, {
      cacheControl: "31536000",
      upsert: false,
      contentType: file.type,
    });

  if (error) throw error;

  const { data } = supabase.storage.from("uploads").getPublicUrl(path);
  return { file_url: data.publicUrl };
}
