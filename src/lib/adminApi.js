import { supabase } from "@/api/supabaseClient";

export const SIMULATED_USER_STORAGE_KEY = "pm_simulated_user_id";

export function getSimulatedUserId() {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(SIMULATED_USER_STORAGE_KEY) || "";
}

function parsePayload(rawBody) {
  if (!rawBody) return {};
  try {
    return JSON.parse(rawBody);
  } catch {
    return {};
  }
}

function formatHttpError(response, payload, rawBody) {
  if (payload.detail || payload.error) {
    return payload.detail || payload.error;
  }
  if (rawBody?.trim().startsWith("<!DOCTYPE")) {
    return `Servidor retornou erro HTML (${response.status}). Verifique as variaveis e os logs da Function na Vercel.`;
  }
  return rawBody || `Falha na operacao administrativa (${response.status}).`;
}

export async function adminFetch(path, options = {}) {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;

  if (!token) {
    throw new Error("Sessao administrativa expirada.");
  }

  const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;
  const headers = {
    ...(!isFormData ? { "Content-Type": "application/json" } : {}),
    Authorization: `Bearer ${token}`,
    ...(getSimulatedUserId() ? { "X-Simulated-User-Id": getSimulatedUserId() } : {}),
    ...(options.headers || {}),
  };

  const response = await fetch(path, { ...options, headers });
  const rawBody = await response.text().catch(() => "");
  const payload = parsePayload(rawBody);

  if (!response.ok) {
    throw new Error(formatHttpError(response, payload, rawBody));
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
    const rawBody = await response.text().catch(() => "");
    const payload = parsePayload(rawBody);
    throw new Error(formatHttpError(response, payload, rawBody) || "Falha ao baixar arquivo.");
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
