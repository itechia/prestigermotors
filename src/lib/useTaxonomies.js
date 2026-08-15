import { useQuery } from "@tanstack/react-query";
import { useStoreSettings } from "@/lib/useStoreSettings";

// Reads normalized relational taxonomy tables. StoreSettings remains as a
// compatibility fallback for local mode and for first render during loading.

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
  { label: "Cupê", value: "cupe" },
  { label: "Conversível", value: "conversivel" },
  { label: "Minivan", value: "minivan" },
  { label: "Utilitário", value: "utilitario" },
];
const LEGACY_CONDITION = [
  { label: "Novo", value: "novo" },
  { label: "Seminovo", value: "seminovo" },
  { label: "Usado", value: "usado" },
];

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

export const VEHICLE_TAXONOMIES_QUERY_KEY = ["vehicle-taxonomies"];

async function fetchRelationalTaxonomies() {
  const response = await fetch("/api/public/taxonomies");
  if (!response.ok) throw new Error("Falha ao carregar taxonomias.");
  const payload = await response.json();

  const byKind = {
    vehicle_type: [],
    category: [],
    fuel: [],
    transmission: [],
    condition: [],
    color: [],
  };

  (payload.options || []).forEach((item) => {
    if (!byKind[item.kind]) return;
    byKind[item.kind].push({ label: item.label, value: item.value });
  });

  return {
    vehicle_types: byKind.vehicle_type,
    categories: byKind.category,
    fuels: byKind.fuel,
    transmissions: byKind.transmission,
    conditions: byKind.condition,
    colors: byKind.color,
    brands: (payload.brands || []).map((b) => ({
      label: b.label,
      value: b.value,
      logo_url: b.logo_url,
    })),
    models: (payload.models || []).map((m) => ({
      label: m.label,
      value: m.value,
      parent: m.parent || "",
    })),
  };
}

export function useTaxonomies() {
  const s = useStoreSettings();
  const { data: relational } = useQuery({
    queryKey: VEHICLE_TAXONOMIES_QUERY_KEY,
    queryFn: fetchRelationalTaxonomies,
    staleTime: 5 * 60 * 1000,
  });

  const vehicle_types = relational?.vehicle_types?.length
    ? relational.vehicle_types
    : normalizeSimpleList(s.tax_vehicle_types, []);
  const categories = relational?.categories?.length
    ? relational.categories
    : normalizeSimpleList(s.tax_categories, LEGACY_BODY);
  const fuels = relational?.fuels?.length
    ? relational.fuels
    : normalizeSimpleList(s.tax_fuels, LEGACY_FUEL);
  const transmissions = relational?.transmissions?.length
    ? relational.transmissions
    : normalizeSimpleList(s.tax_transmissions, LEGACY_TRANSMISSION);
  const conditions = relational?.conditions?.length
    ? relational.conditions
    : normalizeSimpleList(s.tax_conditions, LEGACY_CONDITION);
  const colors = relational?.colors?.length
    ? relational.colors
    : normalizeSimpleList(s.tax_colors, []);

  const models = relational?.models?.length
    ? relational.models
    : (Array.isArray(s.tax_models) ? s.tax_models : [])
        .map((m) => {
          if (!m) return null;
          if (typeof m === "string") return { label: m, value: slugify(m), parent: "" };
          return { label: m.label, value: slugify(m.label), parent: m.parent || "" };
        })
        .filter((x) => x && x.label);

  const brands = relational?.brands?.length
    ? relational.brands
    : (s.brands || []).map((b) => ({
        label: b.name,
        value: slugify(b.name),
        logo_url: b.logo_url,
      }));

  return { vehicle_types, categories, fuels, transmissions, conditions, colors, models, brands };
}
