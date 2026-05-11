import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { withDefaults, SETTINGS_SINGLETON_QUERY_KEY } from "@/lib/defaults";

// Fetches the single StoreSettings record (or returns defaults if none exists).
// Usage: const settings = useStoreSettings();
export function useStoreSettings() {
  const { data } = useQuery({
    queryKey: SETTINGS_SINGLETON_QUERY_KEY,
    queryFn: async () => {
      const list = await base44.entities.StoreSettings.list("-updated_date", 1);
      return list[0] || null;
    },
    staleTime: 30_000,
  });
  return withDefaults(data);
}

// Returns the raw record plus merged values — used by the admin editor.
export function useStoreSettingsRaw() {
  return useQuery({
    queryKey: SETTINGS_SINGLETON_QUERY_KEY,
    queryFn: async () => {
      const list = await base44.entities.StoreSettings.list("-updated_date", 1);
      return list[0] || null;
    },
    staleTime: 30_000,
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