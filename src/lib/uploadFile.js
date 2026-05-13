import { supabase } from "@/api/supabaseClient";

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

export async function uploadFile({ file, maxBytes }) {
  if (maxBytes && file.size > maxBytes) {
    throw new Error(`Arquivo muito grande. Máximo permitido: ${formatBytes(maxBytes)}.`);
  }

  const ext = file.name.split(".").pop();
  const safeName = file.name
    .replace(/\.[^/.]+$/, "")
    .replace(/[^a-zA-Z0-9]/g, "_")
    .slice(0, 60);
  const path = `${Date.now()}-${safeName}.${ext}`;

  const { error } = await supabase.storage
    .from("uploads")
    .upload(path, file, { cacheControl: "3600", upsert: false });

  if (error) throw error;

  const { data } = supabase.storage.from("uploads").getPublicUrl(path);
  return { file_url: data.publicUrl };
}
