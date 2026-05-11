import React from "react";
import { cn } from "@/lib/utils";
import { useTaxonomies } from "@/lib/useTaxonomies";

// First-level filter on the catalog. Only renders if the admin configured
// at least one vehicle type — otherwise the store sells a single type (cars)
// and we hide the row entirely to keep the UI clean.
export default function VehicleTypePills({ active, onSelect }) {
  const { vehicle_types } = useTaxonomies();
  if (vehicle_types.length === 0) return null;

  const items = [{ label: "Todos", value: "all" }, ...vehicle_types];

  return (
    <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 -mx-4 px-4 sm:mx-0 sm:px-0">
      {items.map((t) => {
        const isActive = active === t.value;
        return (
          <button
            key={t.value}
            onClick={() => onSelect(t.value)}
            className={cn(
              "px-5 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all",
              isActive
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-secondary text-muted-foreground hover:text-foreground"
            )}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}