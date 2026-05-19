import React, { useMemo, useRef, useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchVehiclesCatalog, VEHICLES_QUERY_KEY } from "@/lib/vehicleQueries";
import { ChevronLeft, ChevronRight } from "lucide-react";
import VehicleCard from "./VehicleCard";

// Score similarity inside the same category (body_type).
// Higher is more similar: brand match > fuel/transmission match > price proximity.
function scoreSimilar(target, v) {
  let score = 0;
  if (v.brand === target.brand) score += 4;
  if (v.fuel_type && v.fuel_type === target.fuel_type) score += 2;
  if (v.transmission && v.transmission === target.transmission) score += 1;
  if (target.price && v.price) {
    const diffPct = Math.abs(v.price - target.price) / target.price;
    if (diffPct <= 0.1) score += 3;
    else if (diffPct <= 0.25) score += 2;
    else if (diffPct <= 0.5) score += 1;
  }
  return score;
}

export default function SimilarVehicles({ vehicle, leadPrefill = {}, defaultValues = {} }) {
  const scrollerRef = useRef(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const { data: vehicles = [] } = useQuery({
    queryKey: VEHICLES_QUERY_KEY,
    queryFn: fetchVehiclesCatalog,
  });

  const similar = useMemo(() => {
    if (!vehicle) return [];
    return vehicles
      .filter(
        (v) =>
          v.id !== vehicle.id &&
          v.status !== "vendido" &&
          !v.hidden &&
          // Same category (body_type) only — falls back gracefully if target has no body_type
          (vehicle.body_type ? v.body_type === vehicle.body_type : true)
      )
      .map((v) => ({ v, s: scoreSimilar(vehicle, v) }))
      .sort((a, b) => b.s - a.s)
      .map((x) => x.v);
  }, [vehicles, vehicle]);

  const updateArrows = () => {
    const el = scrollerRef.current;
    if (!el) return;
    setCanPrev(el.scrollLeft > 4);
    setCanNext(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  };

  useEffect(() => {
    updateArrows();
    const el = scrollerRef.current;
    if (!el) return;
    el.addEventListener("scroll", updateArrows, { passive: true });
    window.addEventListener("resize", updateArrows);
    return () => {
      el.removeEventListener("scroll", updateArrows);
      window.removeEventListener("resize", updateArrows);
    };
  }, [similar.length]);

  const scrollByCard = (dir) => {
    const el = scrollerRef.current;
    if (!el) return;
    // Scroll roughly one card width (matches min-w on items below + gap)
    const amount = el.clientWidth * 0.85;
    el.scrollBy({ left: dir * amount, behavior: "smooth" });
  };

  if (similar.length === 0) return null;

  return (
    <section className="mt-12">
      <div className="flex items-end justify-between mb-5 gap-4">
        <div>
          <h2 className="font-display font-bold text-2xl md:text-3xl">Você também pode gostar</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Outros veículos da mesma categoria que podem te interessar.
          </p>
        </div>
        <div className="hidden md:flex items-center gap-2">
          <button
            onClick={() => scrollByCard(-1)}
            disabled={!canPrev}
            aria-label="Anterior"
            className="w-10 h-10 rounded-full border border-border bg-card flex items-center justify-center hover:bg-secondary transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => scrollByCard(1)}
            disabled={!canNext}
            aria-label="Próximo"
            className="w-10 h-10 rounded-full border border-border bg-card flex items-center justify-center hover:bg-secondary transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div
        ref={scrollerRef}
        className="flex gap-4 md:gap-6 overflow-x-auto scrollbar-hide snap-x snap-mandatory -mx-4 px-4 sm:mx-0 sm:px-0 pb-2"
      >
        {similar.map((v, i) => (
          <div
            key={v.id}
            className="snap-start flex-shrink-0 w-[78%] sm:w-[46%] lg:w-[31%] xl:w-[23.5%]"
          >
            <VehicleCard
              vehicle={v}
              index={i}
              leadPrefill={leadPrefill}
              defaultValues={defaultValues}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
