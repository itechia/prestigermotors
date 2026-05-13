import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useStoreSettings } from "@/lib/useStoreSettings";
import { cn } from "@/lib/utils";

export default function HeroBanner() {
  const s = useStoreSettings();

  // Build slides: prefer hero_slides; fallback to legacy single hero_image_url(_mobile)
  const slides = useMemo(() => {
    const arr = (s.hero_slides || []).filter(
      (slide) => slide?.image_desktop || slide?.image_mobile
    );
    if (arr.length > 0) return arr;
    if (s.hero_image_url || s.hero_image_url_mobile) {
      return [
      {
        image_desktop: s.hero_image_url,
        image_mobile: s.hero_image_url_mobile || s.hero_image_url
      }];

    }
    return [];
  }, [s.hero_slides, s.hero_image_url, s.hero_image_url_mobile]);

  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (slides.length <= 1) return;
    const t = setInterval(() => {
      setIndex((i) => (i + 1) % slides.length);
    }, 5000);
    return () => clearInterval(t);
  }, [slides.length]);

  if (slides.length === 0) return null;

  const current = slides[index];
  const desktopImg = current.image_desktop || current.image_mobile;
  const mobileImg = current.image_mobile || current.image_desktop;

  const Inner =
  <>
      {mobileImg &&
    <img
      src={mobileImg}
      alt="" className="block md:hidden w-full h-44 sm:h-52 object-cover object-center" />


    }
      {desktopImg &&
    <img
      src={desktopImg}
      alt=""
      className="hidden md:block w-full h-56 lg:h-64 object-cover" />

    }
    </>;


  return (
    <div className="relative overflow-hidden rounded-2xl md:rounded-3xl bg-secondary">
      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}>
          
          {current.link ?
          <a href={current.link} target="_blank" rel="noreferrer" className="block">
              {Inner}
            </a> :

          Inner
          }
        </motion.div>
      </AnimatePresence>

      {slides.length > 1 &&
      <div className="absolute bottom-2 md:bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
          {slides.map((_, i) =>
        <button
          key={i}
          onClick={() => setIndex(i)}
          aria-label={`Ir para slide ${i + 1}`}
          className={cn(
            "h-1.5 rounded-full transition-all",
            i === index ? "w-6 bg-white" : "w-1.5 bg-white/60 hover:bg-white/80"
          )} />

        )}
        </div>
      }
    </div>);

}