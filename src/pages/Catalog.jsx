// Catalog page — public store front.
import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchVehiclesCatalog, VEHICLES_QUERY_KEY } from "@/lib/vehicleQueries";

import HeroBanner from "../components/vehicles/HeroBanner";
import EmptyState from "../components/vehicles/EmptyState";
import BrandPills from "../components/vehicles/BrandPills";
import VehicleFilters, { DEFAULT_FILTERS } from "../components/vehicles/VehicleFilters";
import VehicleCard from "../components/vehicles/VehicleCard";
import Reviews from "../components/vehicles/Reviews";
import { slugify } from "@/lib/useTaxonomies";

export default function Catalog() {
  const [search, setSearch] = useState("");
  // Multiple brands can be selected at once; empty array = "Todas".
  const [selectedBrands, setSelectedBrands] = useState([]);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);

  const toggleBrand = (name) => {
    setSelectedBrands((prev) =>
      prev.includes(name) ? prev.filter((b) => b !== name) : [...prev, name]
    );
  };

  const { data: vehicles = [], isLoading } = useQuery({
    queryKey: VEHICLES_QUERY_KEY,
    queryFn: fetchVehiclesCatalog,
  });

  const filtered = useMemo(() => {
    return vehicles.filter((v) => {
      // Hide vehicles flagged as hidden by admin from the public catalog
      if (v.hidden) return false;

      if (search) {
        const q = search.toLowerCase();
        const match = `${v.brand} ${v.model} ${v.version || ""}`.toLowerCase().includes(q);
        if (!match) return false;
      }

      // Multi-select filters: empty array means "all"
      const matchAny = (arr, val) => !arr || arr.length === 0 || arr.includes(val);
      if (!matchAny(filters.vehicle_type, v.vehicle_type || "")) return false;

      // Brand pills: when one or more are selected, vehicle must match any of them.
      if (selectedBrands.length > 0) {
        const vBrand = (v.brand || "").toLowerCase();
        const match = selectedBrands.some((b) => String(b).toLowerCase() === vBrand);
        if (!match) return false;
      }

      if (!matchAny(filters.body_type, v.body_type)) return false;
      if (!matchAny(filters.fuel_type, v.fuel_type)) return false;
      if (!matchAny(filters.transmission, v.transmission)) return false;
      if (!matchAny(filters.condition, v.condition)) return false;
      if (!matchAny(filters.color, slugify(v.color))) return false;

      // Filter brand/model from the sheet (slug) — applied in addition to the pill
      if (!matchAny(filters.brand, slugify(v.brand))) return false;
      if (!matchAny(filters.model, slugify(v.model))) return false;

      // Price range — 0 means "no bound"
      if (filters.priceMin > 0 && v.price < filters.priceMin) return false;
      if (filters.priceMax > 0 && v.price > filters.priceMax) return false;

      // Year range — uses manufacture_year, falls back to year
      const vehicleYear = v.manufacture_year || v.year || 0;
      if (filters.yearMin > 0 && vehicleYear < filters.yearMin) return false;
      if (filters.yearMax > 0 && vehicleYear > filters.yearMax) return false;

      return true;
    });
  }, [vehicles, search, selectedBrands, filters]);

  const featured = filtered.filter((v) => v.featured);
  const regular = filtered.filter((v) => !v.featured);

  return (
    <div>
      {/* Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-3 md:pt-4">
        <HeroBanner />
      </div>

      {/* Sticky search + brands — sem margem negativa */}
      <div className="sticky top-16 z-30 bg-background/80 backdrop-blur-md border-b border-border/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 space-y-3">
          <VehicleFilters
            filters={filters}
            setFilters={setFilters}
            search={search}
            setSearch={setSearch}
            selectedBrands={selectedBrands}
            vehicles={vehicles}
          />
          <BrandPills
            selected={selectedBrands}
            onToggle={toggleBrand}
            onClear={() => setSelectedBrands([])}
          />
        </div>
      </div>

      {/* Vehicle grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 pt-4 pb-0">
        {isLoading ? (
          <LoadingGrid />
        ) : filtered.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            {featured.length > 0 && (
              <section>
                <SectionHeader title="Em destaque" subtitle="Seleção especial da nossa loja" />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                  {featured.map((v, i) => (
                    <VehicleCard key={v.id} vehicle={v} index={i} />
                  ))}
                </div>
              </section>
            )}

            {regular.length > 0 && (
              <section>
                <SectionHeader
                  title="Todos os veículos"
                  subtitle={`${filtered.length} opção${filtered.length > 1 ? "es" : ""} pronta${filtered.length > 1 ? "s" : ""} para entrega`}
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                  {regular.map((v, i) => (
                    <VehicleCard key={v.id} vehicle={v} index={i} />
                  ))}
                </div>
              </section>
            )}

            <Reviews />
          </>
        )}
      </div>
    </div>
  );
}

function SectionHeader({ title, subtitle }) {
  return (
    <div className="flex items-end justify-between mb-5">
      <div>
        <h2 className="font-display font-bold text-2xl md:text-3xl">{title}</h2>
        <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
      </div>
    </div>
  );
}

function LoadingGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
      {Array(8).fill(0).map((_, i) => (
        <div key={i} className="bg-card rounded-3xl overflow-hidden border border-border/50 animate-pulse">
          <div className="aspect-[4/3] bg-secondary" />
          <div className="p-4 space-y-3">
            <div className="h-4 bg-secondary rounded w-2/3" />
            <div className="h-3 bg-secondary rounded w-1/2" />
            <div className="h-6 bg-secondary rounded w-1/2 mt-4" />
          </div>
        </div>
      ))}
    </div>
  );
}