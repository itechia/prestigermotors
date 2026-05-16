'use client';
import React, { useState, useEffect, useRef, useMemo } from "react";
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

  const goTo = (i) => { setIndex(i); startTimer(); };

  if (slides.length === 0) return null;

  const first = slides[0];
  const firstMobile  = first.image_mobile  || first.image_desktop;
  const firstDesktop = first.image_desktop || first.image_mobile;

  return (
    <div className="relative overflow-hidden rounded-2xl md:rounded-3xl bg-secondary">

      {/*
        Phantom permanente baseado no PRIMEIRO slide.
        Nunca sai do DOM → container nunca colapsa entre transições.
        Invisible — só serve para definir a altura.
      */}
      <div aria-hidden="true" className="pointer-events-none select-none">
        {firstMobile && (
          <img
            src={firstMobile}
            alt=""
            className="block md:hidden w-full h-auto max-h-56 opacity-0"
          />
        )}
        <div className="hidden md:block w-full h-56 lg:h-64" />
      </div>

      {/*
        Todos os slides ficam sempre no DOM (absolute inset-0).
        Só a opacidade muda — transição CSS pura, zero colapso.
      */}
      {slides.map((slide, i) => {
        const dm = slide.image_desktop || slide.image_mobile;
        const mm = slide.image_mobile  || slide.image_desktop;
        const content = (
          <>
            {mm && (
              <img
                src={mm}
                alt=""
                className="block md:hidden absolute inset-0 w-full h-full object-cover"
                loading={i === 0 ? "eager" : "lazy"}
              />
            )}
            {dm && (
              <img
                src={dm}
                alt=""
                className="hidden md:block absolute inset-0 w-full h-full object-cover"
                loading={i === 0 ? "eager" : "lazy"}
              />
            )}
          </>
        );
        return (
          <div
            key={i}
            aria-hidden={i !== index}
            style={{
              position: "absolute",
              inset: 0,
              opacity: i === index ? 1 : 0,
              transition: "opacity 0.5s ease",
              pointerEvents: i === index ? "auto" : "none",
            }}
          >
            {slide.link ? (
              <a
                href={slide.link}
                target="_blank"
                rel="noreferrer"
                style={{ position: "absolute", inset: 0, display: "block" }}
              >
                {content}
              </a>
            ) : content}
          </div>
        );
      })}

      {/* Setas de navegação */}
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

      {/* Dots */}
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
    </div>
  );
}
