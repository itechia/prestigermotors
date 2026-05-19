import { useEffect, useState } from "react";

const NAME_KEYS = ["nome", "name", "cliente"];
const PHONE_KEYS = ["tel", "telefone", "phone", "whatsapp", "celular"];

function firstParam(searchParams, keys) {
  for (const key of keys) {
    const value = searchParams?.get?.(key);
    if (value && String(value).trim()) return String(value).trim();
  }
  return "";
}

export function getLeadPrefillFromSearchParams(searchParams) {
  const phone = firstParam(searchParams, PHONE_KEYS);
  return {
    name: firstParam(searchParams, NAME_KEYS),
    phone: normalizePrefillPhone(phone),
  };
}

function normalizePrefillPhone(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (raw.startsWith("+")) return raw;

  const digits = raw.replace(/\D/g, "");
  if (!digits) return "";
  if ((digits.length === 12 || digits.length === 13) && digits.startsWith("55")) {
    return `+${digits}`;
  }
  return digits;
}

export function getLeadPrefillFromSearch(search) {
  return getLeadPrefillFromSearchParams(new URLSearchParams(search || ""));
}

export function useLeadPrefillFromLocation() {
  const [prefill, setPrefill] = useState({ name: "", phone: "" });

  useEffect(() => {
    setPrefill(getLeadPrefillFromSearch(window.location.search));
  }, []);

  return prefill;
}

export function toInterestDefaults(prefill) {
  const defaults = {};
  if (prefill?.name) defaults.name = prefill.name;
  if (prefill?.phone) {
    defaults.phone = prefill.phone;
    defaults.phone__confirm = prefill.phone;
  }
  return defaults;
}

export function withLeadPrefill(href, prefill) {
  if (!prefill?.name && !prefill?.phone) return href;

  const [path, query = ""] = String(href).split("?");
  const params = new URLSearchParams(query);
  if (prefill.name && !params.has("nome")) params.set("nome", prefill.name);
  if (prefill.phone && !params.has("tel")) params.set("tel", prefill.phone);
  const qs = params.toString();
  return qs ? `${path}?${qs}` : path;
}
