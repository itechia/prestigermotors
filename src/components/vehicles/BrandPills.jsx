import React, { useEffect, useRef, useState, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useStoreSettings } from "@/lib/useStoreSettings";

// `selected` is an array of selected brand names. Empty array = "Todas".
export default function BrandPills({ selected = [], onToggle, onClear }) {
  const s = useStoreSettings();
  const brands = s.brands || [];
  const scrollerRef = useRef(null);
  const [overflowing, setOverflowing] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollState = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const isOverflowing = el.scrollWidth > el.clientWidth + 1;
    setOverflowing(isOverflowing);
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    updateScrollState();
    const el = scrollerRef.current;
    if (!el) return;
    el.addEventListener("scroll", updateScrollState, { passive: true });
    window.addEventListener("resize", updateScrollState);
    return () => {
      el.removeEventListener("scroll", updateScrollState);
      window.removeEventListener("resize", updateScrollState);
    };
  }, [updateScrollState, brands.length]);

  const scrollBy = (dir) => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * Math.round(el.clientWidth * 0.8), behavior: "smooth" });
  };

  if (brands.length === 0) return null;

  const allActive = !selected || selected.length === 0;

  // "Todas" pill resets the brand filter; the others toggle individually.
  const items = [
    { name: "all", label: "Todas", logo_url: s.logo_url, fallbackChar: (s.store_name || "T").charAt(0).toUpperCase() },
    ...brands.map((b) => ({ ...b, label: b.name })),
  ];

  return (
    <div className="relative">
      {overflowing && canScrollLeft && (
        <button
          type="button"
          onClick={() => scrollBy(-1)}
          aria-label="Rolar para a esquerda"
          className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-background border border-border shadow-md items-center justify-center hover:bg-secondary"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      )}
      {overflowing && canScrollRight && (
        <button
          type="button"
          onClick={() => scrollBy(1)}
          aria-label="Rolar para a direita"
          className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-background border border-border shadow-md items-center justify-center hover:bg-secondary"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      )}

      {overflowing && canScrollLeft && (
        <div className="hidden md:block absolute left-0 top-0 bottom-0 w-10 bg-gradient-to-r from-background to-transparent pointer-events-none z-[1]" />
      )}
      {overflowing && canScrollRight && (
        <div className="hidden md:block absolute right-0 top-0 bottom-0 w-10 bg-gradient-to-l from-background to-transparent pointer-events-none z-[1]" />
      )}

      <div
        ref={scrollerRef}
        className={cn(
          "flex gap-3 md:gap-5 overflow-x-auto scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0 py-1",
          overflowing ? "justify-start" : "justify-start md:justify-center",
          overflowing && "md:px-12"
        )}
      >
        {items.map((b) => {
          const isAll = b.name === "all";
          const isActive = isAll ? allActive : selected.includes(b.name);
          return (
            <button
              key={isAll ? "all" : b.name}
              onClick={() => (isAll ? onClear?.() : onToggle?.(b.name))}
              className="flex flex-col items-center gap-1.5 flex-shrink-0 group"
            >
              <div
                className={cn(
                  "w-14 h-14 md:w-16 md:h-16 rounded-full bg-card border flex items-center justify-center overflow-hidden transition-all",
                  isActive
                    ? "border-primary border-2 shadow-md"
                    : "border-border/60 group-hover:border-border"
                )}
              >
                {b.logo_url ? (
                  <img
                    src={b.logo_url}
                    alt={b.label}
                    className="w-9 h-9 md:w-10 md:h-10 object-contain"
                    loading="lazy"
                  />
                ) : (
                  <span className="font-display font-bold text-sm">
                    {(b.fallbackChar || b.label.charAt(0)).toUpperCase()}
                  </span>
                )}
              </div>
              <span
                className={cn(
                  "text-[11px] md:text-xs font-medium transition-colors",
                  isActive ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"
                )}
              >
                {b.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}