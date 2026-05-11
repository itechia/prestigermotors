import { supabase } from "@/api/supabaseClient";

export async function uploadFile({ file }) {
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
