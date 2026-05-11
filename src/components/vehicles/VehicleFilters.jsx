import React, { useMemo, useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import MobileSearchableSelect from "@/components/vehicles/MobileSearchableSelect";
import PriceRangeSlider from "@/components/vehicles/PriceRangeSlider";

// Inside the filters sheet we use MobileSearchableSelect (inline expanding list)
// instead of SearchableSelect (popover). Popover-inside-Sheet causes a "double
// tap to open" bug on mobile and prevents proper scrolling on long lists.
const SearchableSelect = MobileSearchableSelect;
import { useTaxonomies, slugify } from "@/lib/useTaxonomies";

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

export default function VehicleFilters({ filters, setFilters, search, setSearch, selectedBrands = [], vehicles = [] }) {
  const tax = useTaxonomies();
  const [localFilters, setLocalFilters] = useState(filters);
  const [open, setOpen] = useState(false);
  useEffect(() => setLocalFilters(filters), [filters]);

  // Models are filtered by the brands selected on the home (BrandPills), not by an in-sheet brand.
  const localModelOptions = useMemo(() => {
    const base = (!selectedBrands || selectedBrands.length === 0)
      ? tax.models
      : tax.models.filter((m) => !m.parent || selectedBrands.some((b) => slugify(b) === m.parent));
    return sortAlpha(base.map((m) => ({ label: m.label, value: m.value })));
  }, [tax.models, selectedBrands]);

  const opt = {
    types: useMemo(() => sortAlpha(tax.vehicle_types), [tax.vehicle_types]),
    categories: useMemo(() => sortAlpha(tax.categories), [tax.categories]),
    fuels: useMemo(() => sortAlpha(tax.fuels), [tax.fuels]),
    transmissions: useMemo(() => sortAlpha(tax.transmissions), [tax.transmissions]),
    conditions: useMemo(() => sortAlpha(tax.conditions), [tax.conditions]),
    colors: useMemo(() => sortAlpha(tax.colors), [tax.colors]),
  };

  const apply = () => {
    setFilters(localFilters);
    setOpen(false);
  };
  const clear = () => {
    setLocalFilters(DEFAULT_FILTERS);
    setFilters(DEFAULT_FILTERS);
    // Keep the sheet open so the user can continue refining filters
  };

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
      <div className="relative flex-1">
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
          <Button variant="outline" className="h-12 rounded-full px-5 relative border-border">
            <SlidersHorizontal className="w-4 h-4 mr-0 md:mr-2" />
            <span className="hidden md:inline">Filtros</span>
            {activeCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                {activeCount}
              </span>
            )}
          </Button>
        </SheetTrigger>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto p-5">
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
                placeholder={opt.types.length === 0 ? "Cadastre tipos no admin" : "Todos"}
                disabled={opt.types.length === 0}
              />
            </FilterField>

            <FilterField label="Categoria">
              <SearchableSelect
                multiple
                value={localFilters.body_type}
                onChange={(v) => setLocalFilters({ ...localFilters, body_type: v })}
                options={opt.categories}
              />
            </FilterField>

            <FilterField label="Modelo">
              <SearchableSelect
                multiple
                value={localFilters.model}
                onChange={(v) => setLocalFilters({ ...localFilters, model: v })}
                options={localModelOptions}
                placeholder={localModelOptions.length === 0 ? "Cadastre modelos no admin" : "Todos"}
                disabled={localModelOptions.length === 0}
              />
            </FilterField>

            <div className="grid grid-cols-2 gap-3">
              <FilterField label="Combustível">
                <SearchableSelect
                  multiple
                  value={localFilters.fuel_type}
                  onChange={(v) => setLocalFilters({ ...localFilters, fuel_type: v })}
                  options={opt.fuels}
                />
              </FilterField>

              <FilterField label="Câmbio">
                <SearchableSelect
                  multiple
                  value={localFilters.transmission}
                  onChange={(v) => setLocalFilters({ ...localFilters, transmission: v })}
                  options={opt.transmissions}
                />
              </FilterField>

              <FilterField label="Condição">
                <SearchableSelect
                  multiple
                  value={localFilters.condition}
                  onChange={(v) => setLocalFilters({ ...localFilters, condition: v })}
                  options={opt.conditions}
                />
              </FilterField>

              <FilterField label="Cor">
                <SearchableSelect
                  multiple
                  value={localFilters.color}
                  onChange={(v) => setLocalFilters({ ...localFilters, color: v })}
                  options={opt.colors}
                  placeholder={opt.colors.length === 0 ? "Cadastre cores no admin" : "Todas"}
                  disabled={opt.colors.length === 0}
                />
              </FilterField>
            </div>

            <FilterField label="Intervalo de preço">
              <PriceRangeSlider
                min={localFilters.priceMin}
                max={localFilters.priceMax}
                vehicles={vehicles}
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