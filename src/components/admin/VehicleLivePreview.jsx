import React, { useState, useEffect } from "react";
import { RotateCw, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import VehicleCardPreview from "./VehicleCardPreview";

export default function VehicleLivePreview({ vehicle }) {
  const v = vehicle || {};
  const hasEmbed  = Boolean(v.embed_html?.trim());
  const images    = v.images || [];
  const totalSlides = (hasEmbed ? 1 : 0) + images.length;

  const [activeIdx, setActiveIdx] = useState(0);

  // Volta ao slide 0 quando o embed muda
  useEffect(() => { setActiveIdx(0); }, [hasEmbed]);

  const showEmbed = hasEmbed && activeIdx === 0;
  const imageIdx  = hasEmbed ? activeIdx - 1 : activeIdx;

  const prev = () => setActiveIdx(i => (i - 1 + totalSlides) % totalSlides);
  const next = () => setActiveIdx(i => (i + 1) % totalSlides);

  return (
    <div className="space-y-4">
      <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">
        Pré-visualização
      </p>

      {/* ── Galeria interativa ─────────────────────────── */}
      {totalSlides > 0 && (
        <div className="space-y-2">
          {/* Slide principal */}
          <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-secondary border border-border/50">
            {showEmbed ? (
              <iframe
                key="embed-preview"
                srcDoc={v.embed_html}
                title="360° preview"
                sandbox="allow-scripts allow-same-origin"
                scrolling="no"
                className="w-full h-full border-0 block"
              />
            ) : images[imageIdx] ? (
              <img
                src={images[imageIdx]}
                alt=""
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
                Sem imagem
              </div>
            )}

            {/* Indicador */}
            <span className="absolute top-2 left-2 z-10 text-[10px] bg-black/60 text-white px-2 py-0.5 rounded-full">
              {showEmbed ? "360°" : `${imageIdx + 1} / ${images.length}`}
            </span>

            {/* Setas de navegação */}
            {totalSlides > 1 && (
              <>
                <button
                  type="button"
                  onClick={prev}
                  className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={next}
                  className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </>
            )}
          </div>

          {/* Thumbnails */}
          {totalSlides > 1 && (
            <div className="flex gap-1.5 overflow-x-auto pb-0.5">
              {hasEmbed && (
                <button
                  type="button"
                  onClick={() => setActiveIdx(0)}
                  className={cn(
                    "flex-shrink-0 w-12 h-12 rounded-lg border-2 flex flex-col items-center justify-center gap-0.5 transition-all",
                    activeIdx === 0
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-transparent bg-secondary text-muted-foreground opacity-60 hover:opacity-100"
                  )}
                >
                  <RotateCw className="w-4 h-4" />
                  <span className="text-[9px] font-bold">360°</span>
                </button>
              )}
              {images.map((img, i) => {
                const slideIdx = hasEmbed ? i + 1 : i;
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setActiveIdx(slideIdx)}
                    className={cn(
                      "flex-shrink-0 w-12 h-12 rounded-lg border-2 overflow-hidden transition-all",
                      activeIdx === slideIdx
                        ? "border-primary"
                        : "border-transparent opacity-60 hover:opacity-100"
                    )}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Card público (miniatura) ────────────────────── */}
      <div className="max-w-[280px] mx-auto lg:mx-0">
        <VehicleCardPreview vehicle={vehicle} />
      </div>

      <p className="text-[11px] text-muted-foreground leading-relaxed">
        Atualizado em tempo real conforme você edita.
      </p>
    </div>
  );
}
