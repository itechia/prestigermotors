// Consentimento de cookies — guardado no próprio navegador do visitante.
export const CONSENT_KEY = "pm:cookie-consent";
export const CONSENT_EVENT = "pm:cookie-consent-change";

export function readConsent() {
  if (typeof window === "undefined") return null;
  try {
    const value = window.localStorage.getItem(CONSENT_KEY);
    return value === "granted" || value === "denied" ? value : null;
  } catch {
    // Navegador com armazenamento bloqueado — tratamos como "ainda não decidiu".
    return null;
  }
}

export function writeConsent(value) {
  try {
    window.localStorage.setItem(CONSENT_KEY, value);
  } catch {
    // Sem storage: a escolha vale apenas para esta sessão.
  }
  window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: value }));
}
