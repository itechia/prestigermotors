import React, { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useStoreSettings } from "@/lib/useStoreSettings";
import { cn } from "@/lib/utils";
import { imgUrl } from "@/lib/imgUrl";

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

  const current = slides.length > 0 ? slides[index] : null;
  const desktopImg = current ? (current.image_desktop || current.image_mobile) : null;
  const mobileImg = current ? (current.image_mobile || current.image_desktop) : null;
  // Se qualquer slide tem imagem mobile dedicada usa aspect-[3/1] (900×300 px).
  // Caso contrário usa aspect-[5/1] em todos os breakpoints (só imagem desktop 1600×320).
  // Avaliado em todos os slides para evitar layout shift durante transições.
  const hasMobileImg = slides.some(s => Boolean(s.image_mobile));

  return (
    <div className={`relative overflow-hidden rounded-2xl md:rounded-3xl bg-secondary w-full md:aspect-[5/1] ${hasMobileImg ? "aspect-[3/1]" : "aspect-[5/1]"}`}>
      {current && (
        <>
          <AnimatePresence mode="sync">
            <motion.div
              key={index}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="absolute inset-0"
            >
              {current.link ? (
                <a
                  href={current.link}
                  target="_blank"
                  rel="noreferrer"
                  className="absolute inset-0 block"
                >
                  <picture>
                    {desktopImg && (
                      <source media="(min-width: 768px)" srcSet={imgUrl(desktopImg, { w: 1600, q: 82 })} />
                    )}
                    <img
                      src={imgUrl(mobileImg || desktopImg, { w: 900, q: 80 })}
                      onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = mobileImg || desktopImg; }}
                      alt=""
                      className="absolute inset-0 w-full h-full object-cover"
                      loading="eager"
                      fetchpriority="high"
                    />
                  </picture>
                </a>
              ) : (
                <picture>
                  {desktopImg && mobileImg && desktopImg !== mobileImg && (
                    <source media="(min-width: 768px)" srcSet={imgUrl(desktopImg, { w: 1600, q: 82 })} />
                  )}
                  <img
                    src={imgUrl(mobileImg || desktopImg, { w: 900, q: 80 })}
                    onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = mobileImg || desktopImg; }}
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover"
                    loading="eager"
                    fetchpriority="high"
                  />
                </picture>
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
            <div className="absolute bottom-2 md:bottom-3 left-1/2 -translate-x-1/2 z-10 flex gap-1.5">
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
        </>
      )}
    </div>
  );
}
