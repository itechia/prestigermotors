import React, { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useStoreSettings } from "@/lib/useStoreSettings";
import { cn } from "@/lib/utils";

export default function HeroBanner() {
  const s = useStoreSettings();

  const slides = useMemo(() => {
    const arr = (s.hero_slides || []).filter(
      (slide) => slide?.image_desktop || slide?.image_mobile
    );
    if (arr.length > 0) return arr;
    if (s.hero_image_url || s.hero_image_url_mobile) {
      return [{
        image_desktop: s.hero_image_url,
        image_mobile: s.hero_image_url_mobile || s.hero_image_url,
      }];
    }
    return [];
  }, [s.hero_slides, s.hero_image_url, s.hero_image_url_mobile]);

  const [index, setIndex] = useState(0);
  const timerRef = useRef(null);
  const intervalMs = (s.hero_slide_interval || 5) * 1000;

  const startTimer = () => {
    clearInterval(timerRef.current);
    if (slides.length > 1) {
      timerRef.current = setInterval(
        () => setIndex((i) => (i + 1) % slides.length),
        intervalMs
      );
    }
  };

  useEffect(() => {
    startTimer();
    return () => clearInterval(timerRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slides.length, intervalMs]);

  const goTo = (i) => {
    setIndex(i);
    startTimer();
  };

  if (slides.length === 0) return null;

  const current = slides[index];
  const desktopImg = current.image_desktop || current.image_mobile;
  const mobileImg  = current.image_mobile  || current.image_desktop;

  const Inner = (
    <>
      {/* Mobile: altura natural, sem corte */}
      {mobileImg && (
        <img
          src={mobileImg}
          alt=""
          className="block md:hidden w-full h-auto max-h-56 object-cover"
          loading="eager"
        />
      )}
      {/* Desktop: altura fixa evita layout shift */}
      {desktopImg && (
        <div className="hidden md:block w-full h-56 lg:h-64 bg-secondary">
          <img
            src={desktopImg}
            alt=""
            className="w-full h-full object-cover"
            loading="eager"
          />
        </div>
      )}
    </>
  );

  return (
    <div className="relative overflow-hidden rounded-2xl md:rounded-3xl bg-secondary">
      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
        >
          {current.link ? (
            <a href={current.link} target="_blank" rel="noreferrer" className="block">
              {Inner}
            </a>
          ) : (
            Inner
          )}
        </motion.div>
      </AnimatePresence>

      {slides.length > 1 && (
        <>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); goTo((index - 1 + slides.length) % slides.length); }}
            aria-label="Slide anterior"
            className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-black/40 text-white flex items-center justify-center transition-all opacity-70 hover:opacity-100 hover:bg-black/60"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); goTo((index + 1) % slides.length); }}
            aria-label="Próximo slide"
            className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-black/40 text-white flex items-center justify-center transition-all opacity-70 hover:opacity-100 hover:bg-black/60"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </>
      )}

      {slides.length > 1 && (
        <div className="absolute bottom-2 md:bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              aria-label={`Ir para slide ${i + 1}`}
              className={cn(
                "h-1.5 rounded-full transition-all",
                i === index ? "w-6 bg-white" : "w-1.5 bg-white/60 hover:bg-white/80"
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}
