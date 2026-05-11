import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/api/supabaseClient";
import { withDefaults, SETTINGS_SINGLETON_QUERY_KEY } from "@/lib/defaults";

async function fetchSettings() {
  const { data, error } = await supabase
    .from("store_settings")
    .select("*")
    .order("updated_date", { ascending: false })
    .limit(1);
  if (error) throw error;
  return data?.[0] ?? null;
}

// Fetches the single StoreSettings record (or returns defaults if none exists).
// Usage: const settings = useStoreSettings();
export function useStoreSettings() {
  const { data } = useQuery({
    queryKey: SETTINGS_SINGLETON_QUERY_KEY,
    queryFn: fetchSettings,
    staleTime: 5 * 60 * 1000,
  });
  return withDefaults(data);
}

// Returns the raw record plus merged values — used by the admin editor.
export function useStoreSettingsRaw() {
  return useQuery({
    queryKey: SETTINGS_SINGLETON_QUERY_KEY,
    queryFn: fetchSettings,
    staleTime: 5 * 60 * 1000,
  });
}

// Icon registry used across marketing sections so admins can pick from a short list.
export const ICON_CHOICES = [
  { value: "shield", label: "Escudo" },
  { value: "rotate", label: "Devolução" },
  { value: "file", label: "Laudo" },
  { value: "check", label: "Checagem" },
  { value: "star", label: "Estrela" },
  { value: "clock", label: "Relógio" },
  { value: "truck", label: "Caminhão" },
  { value: "heart", label: "Coração" },
  { value: "credit-card", label: "Cartão" },
];