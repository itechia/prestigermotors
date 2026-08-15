import { useQuery } from "@tanstack/react-query";
import { adminFetch } from "@/lib/adminApi";
import { withDefaults, SETTINGS_RAW_QUERY_KEY, SETTINGS_SINGLETON_QUERY_KEY } from "@/lib/defaults";

async function fetchSettings() {
  const response = await fetch("/api/public/settings");
  if (!response.ok) throw new Error("Falha ao carregar configuracoes publicas.");
  const payload = await response.json();
  return payload.settings ?? null;
}

async function fetchSettingsRaw() {
  const payload = await adminFetch("/api/admin/settings");
  return payload.settings ?? null;
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
    queryKey: SETTINGS_RAW_QUERY_KEY,
    queryFn: fetchSettingsRaw,
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
