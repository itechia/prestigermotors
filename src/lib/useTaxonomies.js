import { useStoreSettings } from "@/lib/useStoreSettings";

// Reads taxonomy lists from StoreSettings, falling back to legacy defaults so
// existing data keeps rendering even before admin populates the new lists.
//
// All lists are arrays of { label, value }, where `value` is the slug stored
// on the Vehicle entity.

const LEGACY_FUEL = [
  { label: "Flex", value: "flex" },
  { label: "Gasolina", value: "gasolina" },
  { label: "Etanol", value: "etanol" },
  { label: "Diesel", value: "diesel" },
  { label: "Elétrico", value: "eletrico" },
  { label: "Híbrido", value: "hibrido" },
];
const LEGACY_TRANSMISSION = [
  { label: "Manual", value: "manual" },
  { label: "Automático", value: "automatico" },
  { label: "Automatizado", value: "automatizado" },
  { label: "CVT", value: "cvt" },
];
const LEGACY_BODY = [
  { label: "Sedan", value: "sedan" },
  { label: "Hatch", value: "hatch" },
  { label: "SUV", value: "suv" },
  { label: "Picape", value: "picape" },
  { label: "Cupê", value: "cupê" },
  { label: "Conversível", value: "conversivel" },
  { label: "Minivan", value: "minivan" },
  { label: "Utilitário", value: "utilitario" },
];
const LEGACY_CONDITION = [
  { label: "Novo", value: "novo" },
  { label: "Seminovo", value: "seminovo" },
  { label: "Usado", value: "usado" },
];

// Slugify pt-BR label into a stable value used for storing on entities and
// matching filters. Keeps it simple and predictable.
export function slugify(s) {
  if (!s) return "";
  return String(s)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
}

function normalizeSimpleList(arr, fallback) {
  if (!Array.isArray(arr) || arr.length === 0) return fallback;
  return arr
    .map((it) => {
      if (typeof it === "string") return { label: it, value: slugify(it) };
      if (it && typeof it === "object") return { label: it.label, value: slugify(it.label), parent: it.parent };
      return null;
    })
    .filter((x) => x && x.label);
}

export function useTaxonomies() {
  const s = useStoreSettings();

  const vehicle_types = normalizeSimpleList(s.tax_vehicle_types, []); // empty default — admin must add to enable
  const categories = normalizeSimpleList(s.tax_categories, LEGACY_BODY);
  const fuels = normalizeSimpleList(s.tax_fuels, LEGACY_FUEL);
  const transmissions = normalizeSimpleList(s.tax_transmissions, LEGACY_TRANSMISSION);
  const conditions = normalizeSimpleList(s.tax_conditions, LEGACY_CONDITION);
  const colors = normalizeSimpleList(s.tax_colors, []);

  // Models are stored as { label, parent } where parent is the brand slug.
  const modelsRaw = Array.isArray(s.tax_models) ? s.tax_models : [];
  const models = modelsRaw
    .map((m) => {
      if (!m) return null;
      if (typeof m === "string") return { label: m, value: slugify(m), parent: "" };
      return { label: m.label, value: slugify(m.label), parent: m.parent || "" };
    })
    .filter((x) => x && x.label);

  const brands = (s.brands || []).map((b) => ({
    label: b.name,
    value: slugify(b.name),
    logo_url: b.logo_url,
  }));

  return { vehicle_types, categories, fuels, transmissions, conditions, colors, models, brands };
}