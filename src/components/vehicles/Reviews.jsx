import React, { useEffect, useRef, useState } from "react";
import { Star, Quote, ChevronLeft, ChevronRight } from "lucide-react";
import { useStoreSettings } from "@/lib/useStoreSettings";

export default function Reviews() {
  const s = useStoreSettings();
  const reviews = s.reviews || [];

  const scrollerRef = useRef(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

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
  }, [reviews.length]);

  const scrollByCard = (dir) => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.9, behavior: "smooth" });
  };

  if (reviews.length === 0) return null;
  if (s.reviews_visible === false) return null;

  return (
    <section>
      <div className="flex items-end justify-between mb-5 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-accent text-accent" />
              ))}
            </div>
            <span className="font-semibold text-sm">{s.reviews_rating} de 5</span>
            {s.reviews_count && (
              <span className="text-xs text-muted-foreground">· {s.reviews_count} avaliações</span>
            )}
          </div>
          <h2 className="font-display font-bold text-2xl md:text-3xl">{s.reviews_title}</h2>
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
        className="flex gap-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory -mx-4 px-4 sm:mx-0 sm:px-0 pb-2"
      >
        {reviews.map((r, i) => (
          <div
            key={i}
            className="snap-start flex-shrink-0 w-[85%] sm:w-[60%] md:w-[calc((100%-2rem)/3)] bg-card border border-border/50 rounded-3xl p-5 relative"
          >
            <Quote className="w-5 h-5 text-muted-foreground/30 absolute top-5 right-5" />
            <div className="flex items-center gap-3 mb-3">
              {r.avatar ? (
                <img src={r.avatar} alt={r.name} className="w-10 h-10 rounded-full object-cover" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-sm font-semibold">
                  {r.name?.[0]?.toUpperCase()}
                </div>
              )}
              <div>
                <div className="font-semibold text-sm">{r.name}</div>
                {r.city && <div className="text-xs text-muted-foreground">{r.city}</div>}
              </div>
            </div>
            <div className="flex mb-2">
              {[...Array(r.rating || 5)].map((_, j) => (
                <Star key={j} className="w-3.5 h-3.5 fill-accent text-accent" />
              ))}
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">"{r.text}"</p>
            {r.photo && (
              <img
                src={r.photo}
                alt=""
                className="mt-3 w-full aspect-[4/3] object-cover rounded-2xl"
                loading="lazy"
              />
            )}
          </div>
        ))}
      </div>
    </section>
  );
}