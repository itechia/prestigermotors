import React, { useMemo, useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import MobileSearchableSelect from "@/components/vehicles/MobileSearchableSelect";
import PriceRangeSlider from "@/components/vehicles/PriceRangeSlider";
import { useTaxonomies, slugify } from "@/lib/useTaxonomies";

// Inside the filters sheet we use MobileSearchableSelect (inline expanding list)
// instead of SearchableSelect (popover). Popover-inside-Sheet causes a "double
// tap to open" bug on mobile and prevents proper scrolling on long lists.
const SearchableSelect = MobileSearchableSelect;

// Multi-select fields use arrays. Empty array = "Todos".
export const DEFAULT_FILTERS = {
  vehicle_type: [],
  body_type: [],
  brand: [],
  model: [],
  fuel_type: [],
  transmission: [],
  condition: [],
  color: [],
  priceMin: 0,
  priceMax: 0,       // 0 = no upper bound
  yearMin: 0,
  yearMax: 0,
};

const NEXT_YEAR = new Date().getFullYear() + 1;

// Sort { label, value } options alphabetically (pt-BR aware).
const sortAlpha = (arr) =>
  [...arr].sort((a, b) => a.label.localeCompare(b.label, "pt-BR", { sensitivity: "base" }));

// Applies all active filters, optionally skipping one or more keys.
// Mirrors the Catalog.jsx filter logic so availability is always accurate.
function applyFilters(vehicles, filters, selectedBrands, search, skipKeys = []) {
  const skip = new Set(skipKeys);
  const matchAny = (arr, val) => !arr || arr.length === 0 || arr.includes(val);
  return vehicles.filter((v) => {
    if (v.hidden) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!`${v.brand} ${v.model} ${v.version || ""}`.toLowerCase().includes(q)) return false;
    }
    if (selectedBrands.length > 0) {
      const vBrand = (v.brand || "").toLowerCase();
      if (!selectedBrands.some((b) => String(b).toLowerCase() === vBrand)) return false;
    }
    if (!skip.has("vehicle_type") && !matchAny(filters.vehicle_type, v.vehicle_type || "")) return false;
    if (!skip.has("body_type") && !matchAny(filters.body_type, v.body_type)) return false;
    if (!skip.has("fuel_type") && !matchAny(filters.fuel_type, v.fuel_type)) return false;
    if (!skip.has("transmission") && !matchAny(filters.transmission, v.transmission)) return false;
    if (!skip.has("condition") && !matchAny(filters.condition, v.condition)) return false;
    if (!skip.has("color") && !matchAny(filters.color, slugify(v.color))) return false;
    if (!skip.has("model") && !matchAny(filters.model, slugify(v.model))) return false;
    if (!skip.has("brand") && !matchAny(filters.brand, slugify(v.brand))) return false;
    if (!skip.has("price")) {
      if (filters.priceMin > 0 && v.price < filters.priceMin) return false;
      if (filters.priceMax > 0 && v.price > filters.priceMax) return false;
    }
    if (!skip.has("year")) {
      const vehicleYear = v.manufacture_year || v.year || 0;
      if (filters.yearMin > 0 && vehicleYear < filters.yearMin) return false;
      if (filters.yearMax > 0 && vehicleYear > filters.yearMax) return false;
    }
    return true;
  });
}

// Keeps only taxonomy options that exist in the available pool.
// Always preserves already-selected values so selections don't vanish.
function smartOpts(taxOptions, availableSet, selectedValues) {
  const selected = new Set(selectedValues);
  return sortAlpha(
    taxOptions.filter((o) => selected.has(o.value) || availableSet.has(o.value))
  );
}

export default function VehicleFilters({ filters, setFilters, search, setSearch, selectedBrands = [], vehicles = [] }) {
  const tax = useTaxonomies();
  const [localFilters, setLocalFilters] = useState(filters);
  const [open, setOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(() => typeof window !== "undefined" ? window.innerWidth < 768 : false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  useEffect(() => setLocalFilters(filters), [filters]);

  // For each dimension, compute which values actually have vehicles in stock
  // while all OTHER local filters are already applied. This makes selecting
  // "Carro" immediately narrow down models/categories/etc. to car stock only.
  const available = useMemo(() => {
    const pool = (key) => applyFilters(vehicles, localFilters, selectedBrands, search, [key]);
    return {
      vehicle_type: new Set(pool("vehicle_type").map((v) => v.vehicle_type || "")),
      body_type:    new Set(pool("body_type").map((v) => v.body_type || "")),
      fuel_type:    new Set(pool("fuel_type").map((v) => v.fuel_type || "")),
      transmission: new Set(pool("transmission").map((v) => v.transmission || "")),
      condition:    new Set(pool("condition").map((v) => v.condition || "")),
      color:        new Set(pool("color").map((v) => slugify(v.color))),
      model:        new Set(pool("model").map((v) => slugify(v.model))),
      brand:        new Set(pool("brand").map((v) => slugify(v.brand))),
    };
  }, [vehicles, localFilters, selectedBrands, search]);

  // Smart option lists — only values with stock (plus any already selected)
  const opt = useMemo(() => ({
    types:         smartOpts(tax.vehicle_types, available.vehicle_type, localFilters.vehicle_type),
    categories:    smartOpts(tax.categories,    available.body_type,    localFilters.body_type),
    fuels:         smartOpts(tax.fuels,         available.fuel_type,    localFilters.fuel_type),
    transmissions: smartOpts(tax.transmissions, available.transmission, localFilters.transmission),
    conditions:    smartOpts(tax.conditions,    available.condition,    localFilters.condition),
    colors:        smartOpts(tax.colors,        available.color,        localFilters.color),
  }), [tax, available, localFilters]);

  // Models: filtered by brand pills AND smart availability
  const modelOptions = useMemo(() => {
    const base = (!selectedBrands || selectedBrands.length === 0)
      ? tax.models
      : tax.models.filter((m) => !m.parent || selectedBrands.some((b) => slugify(b) === m.parent));
    return sortAlpha(
      base.filter((m) => localFilters.model.includes(m.value) || available.model.has(m.value))
    );
  }, [tax.models, selectedBrands, available.model, localFilters.model]);

  // Price slider sees only vehicles that pass all non-price filters
  const vehiclesForPrice = useMemo(
    () => applyFilters(vehicles, localFilters, selectedBrands, search, ["price"]),
    [vehicles, localFilters, selectedBrands, search]
  );

  const apply = () => { setFilters(localFilters); setOpen(false); };
  const clear = () => { setLocalFilters(DEFAULT_FILTERS); setFilters(DEFAULT_FILTERS); };

  const activeCount = useMemo(() => {
    let n = 0;
    Object.entries(filters).forEach(([k, v]) => {
      if (k === "priceMin" || k === "priceMax" || k === "yearMin" || k === "yearMax") {
        if (v && v > 0) n += 1;
      } else if (Array.isArray(v) && v.length > 0) {
        n += 1;
      }
    });
    return n;
  }, [filters]);

  return (
    <div className="flex items-center gap-2">
      <div className="relative flex-1 min-w-0">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por marca ou modelo..."
          className="pl-11 h-12 rounded-full bg-secondary border-0 focus-visible:ring-2"
        />
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" className="h-12 w-12 md:w-auto md:px-5 rounded-full flex-shrink-0 relative border-border">
            <SlidersHorizontal className="w-4 h-4" />
            <span className="hidden md:inline md:ml-2">Filtros</span>
            {activeCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                {activeCount}
              </span>
            )}
          </Button>
        </SheetTrigger>
        <SheetContent
          side={isMobile ? "bottom" : "right"}
          className={isMobile
            ? "w-full max-h-[88vh] rounded-t-2xl overflow-y-auto p-5"
            : "w-full sm:max-w-md overflow-y-auto p-5"
          }
        >
          <SheetHeader className="pb-3">
            <SheetTitle className="font-display text-xl">Filtros</SheetTitle>
          </SheetHeader>

          <div className="space-y-3">
            <FilterField label="Tipo de veículo">
              <SearchableSelect
                multiple
                value={localFilters.vehicle_type}
                onChange={(v) => setLocalFilters({ ...localFilters, vehicle_type: v })}
                options={opt.types}
                placeholder={opt.types.length === 0 ? "Nenhum tipo em estoque" : "Todos"}
                disabled={opt.types.length === 0}
              />
            </FilterField>

            <FilterField label="Categoria">
              <SearchableSelect
                multiple
                value={localFilters.body_type}
                onChange={(v) => setLocalFilters({ ...localFilters, body_type: v })}
                options={opt.categories}
                placeholder={opt.categories.length === 0 ? "Nenhuma em estoque" : "Todas"}
                disabled={opt.categories.length === 0}
              />
            </FilterField>

            <FilterField label="Modelo">
              <SearchableSelect
                multiple
                value={localFilters.model}
                onChange={(v) => setLocalFilters({ ...localFilters, model: v })}
                options={modelOptions}
                placeholder={modelOptions.length === 0 ? "Nenhum em estoque" : "Todos"}
                disabled={modelOptions.length === 0}
              />
            </FilterField>

            <div className="grid grid-cols-2 gap-3">
              <FilterField label="Combustível">
                <SearchableSelect
                  multiple
                  value={localFilters.fuel_type}
                  onChange={(v) => setLocalFilters({ ...localFilters, fuel_type: v })}
                  options={opt.fuels}
                  placeholder={opt.fuels.length === 0 ? "—" : "Todos"}
                  disabled={opt.fuels.length === 0}
                />
              </FilterField>

              <FilterField label="Câmbio">
                <SearchableSelect
                  multiple
                  value={localFilters.transmission}
                  onChange={(v) => setLocalFilters({ ...localFilters, transmission: v })}
                  options={opt.transmissions}
                  placeholder={opt.transmissions.length === 0 ? "—" : "Todos"}
                  disabled={opt.transmissions.length === 0}
                />
              </FilterField>

              <FilterField label="Condição">
                <SearchableSelect
                  multiple
                  value={localFilters.condition}
                  onChange={(v) => setLocalFilters({ ...localFilters, condition: v })}
                  options={opt.conditions}
                  placeholder={opt.conditions.length === 0 ? "—" : "Todos"}
                  disabled={opt.conditions.length === 0}
                />
              </FilterField>

              <FilterField label="Cor">
                <SearchableSelect
                  multiple
                  value={localFilters.color}
                  onChange={(v) => setLocalFilters({ ...localFilters, color: v })}
                  options={opt.colors}
                  placeholder={opt.colors.length === 0 ? "Nenhuma em estoque" : "Todas"}
                  disabled={opt.colors.length === 0}
                />
              </FilterField>
            </div>

            <FilterField label="Intervalo de preço">
              <PriceRangeSlider
                min={localFilters.priceMin}
                max={localFilters.priceMax}
                vehicles={vehiclesForPrice}
                onChange={({ priceMin, priceMax }) =>
                  setLocalFilters({ ...localFilters, priceMin, priceMax })
                }
              />
            </FilterField>

            <FilterField label="Ano de fabricação">
              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="number"
                  inputMode="numeric"
                  min={1950}
                  max={NEXT_YEAR}
                  placeholder="De"
                  value={localFilters.yearMin || ""}
                  onChange={(e) =>
                    setLocalFilters({ ...localFilters, yearMin: Number(e.target.value) || 0 })
                  }
                  className="h-9"
                />
                <Input
                  type="number"
                  inputMode="numeric"
                  min={1950}
                  max={NEXT_YEAR}
                  placeholder="Até"
                  value={localFilters.yearMax || ""}
                  onChange={(e) =>
                    setLocalFilters({ ...localFilters, yearMax: Number(e.target.value) || 0 })
                  }
                  className="h-9"
                />
              </div>
            </FilterField>

            <div className="flex gap-2 pt-3 sticky bottom-0 bg-background pb-1">
              <Button variant="outline" onClick={clear} className="flex-1 rounded-full h-11">
                <X className="w-4 h-4 mr-2" /> Limpar
              </Button>
              <Button onClick={apply} className="flex-1 rounded-full h-11">
                Aplicar filtros
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

function FilterField({ label, children }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

// Re-export slug helper so callers can normalize stored values consistently.
export { slugify };
