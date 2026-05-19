import { supabase } from "@/api/supabaseClient";

export const SIMULATED_USER_STORAGE_KEY = "pm_simulated_user_id";

export function getSimulatedUserId() {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(SIMULATED_USER_STORAGE_KEY) || "";
}

export async function adminFetch(path, options = {}) {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;

  if (!token) {
    throw new Error("Sessão administrativa expirada.");
  }

  const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;
  const headers = {
    ...(!isFormData ? { "Content-Type": "application/json" } : {}),
    Authorization: `Bearer ${token}`,
    ...(getSimulatedUserId() ? { "X-Simulated-User-Id": getSimulatedUserId() } : {}),
    ...(options.headers || {}),
  };

  const response = await fetch(path, { ...options, headers });
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.error || "Falha na operação administrativa.");
  }

  return payload;
}

export async function downloadAdminFile(path, filename) {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;

  if (!token) {
    throw new Error("Sessao administrativa expirada.");
  }

  const response = await fetch(path, {
    headers: {
      Authorization: `Bearer ${token}`,
      ...(getSimulatedUserId() ? { "X-Simulated-User-Id": getSimulatedUserId() } : {}),
    },
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.error || "Falha ao baixar arquivo.");
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
