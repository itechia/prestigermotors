import React, { useState } from "react";
import { SettingsSection, TextField } from "../SettingsField";
import ImageUploadField from "../ImageUploadField";
import ArrayFieldEditor from "../ArrayFieldEditor";
import { Monitor, Smartphone, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { deleteStorageFile } from "@/lib/uploadFile";

const BANNER_MAX_BYTES = 5_242_880; // 5 MB

function BannerPreview({ slides }) {
  const [idx, setIdx] = useState(0);
  const [mode, setMode] = useState("desktop"); // "desktop" | "mobile"

  const current = slides[Math.min(idx, slides.length - 1)];
  const img = mode === "mobile"
    ? (current?.image_mobile || current?.image_desktop)
    : (current?.image_desktop || current?.image_mobile);

  return (
    <div className="space-y-2">
      {/* Mode toggle */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Prévia — como aparece no site
        </span>
        <div className="flex items-center gap-1 bg-secondary rounded-lg p-1">
          <button
            type="button"
            onClick={() => setMode("desktop")}
            className={cn(
              "flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-all",
              mode === "desktop"
                ? "bg-background shadow text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Monitor className="w-3 h-3" /> Desktop
          </button>
          <button
            type="button"
            onClick={() => setMode("mobile")}
            className={cn(
              "flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-all",
              mode === "mobile"
                ? "bg-background shadow text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Smartphone className="w-3 h-3" /> Mobile
          </button>
        </div>
      </div>

      {/* Banner preview frame */}
      <div
        className={cn(
          "mx-auto rounded-2xl overflow-hidden bg-secondary border border-border/60 relative",
          mode === "desktop" ? "w-full aspect-[5/1]" : "w-48 aspect-[3/1]"
        )}
      >
        {img ? (
          <img src={img} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
            Sem imagem para este slide
          </div>
        )}

        {/* Dots */}
        {slides.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => setIdx(i => (i - 1 + slides.length) % slides.length)}
              className="absolute left-1.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setIdx(i => (i + 1) % slides.length)}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
            <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 flex gap-1">
              {slides.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setIdx(i)}
                  className={cn(
                    "h-1 rounded-full transition-all",
                    i === idx ? "w-4 bg-white" : "w-1 bg-white/60 hover:bg-white/80"
                  )}
                />
              ))}
            </div>
          </>
        )}

        {/* Slide counter */}
        {slides.length > 1 && (
          <span className="absolute top-1.5 right-1.5 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded-full">
            {idx + 1} / {slides.length}
          </span>
        )}
      </div>

      {mode === "desktop" && (
        <p className="text-[11px] text-muted-foreground">
          Proporção 5:1 — recomendado 1600 × 320 px
        </p>
      )}
      {mode === "mobile" && (
        <p className="text-[11px] text-muted-foreground">
          Proporção 3:1 — recomendado 900 × 300 px. Se vazio, usa a imagem desktop.
        </p>
      )}
    </div>
  );
}

export default function SettingsHero({ form, update }) {
  const slides = form.hero_slides || [];

  return (
    <SettingsSection
      title="Banners"
      desc="Adicione uma ou mais imagens para o banner principal do catálogo. Com múltiplos slides, o banner troca automaticamente no intervalo configurado abaixo."
    >
      {slides.length > 0 && (
        <div className="mb-6">
          <BannerPreview slides={slides} />
        </div>
      )}

      <ArrayFieldEditor
        items={slides}
        onChange={(v) => update("hero_slides", v)}
        newItem={() => ({ image_desktop: "", image_mobile: "", link: "" })}
        addLabel="Adicionar slide"
        itemLabel="Slide"
        onRemove={(slide) => {
          deleteStorageFile(slide.image_desktop);
          deleteStorageFile(slide.image_mobile);
        }}
        renderItem={(item, onItemChange) => (
          <div className="space-y-4">
            <ImageUploadField
              label="Imagem Desktop"
              value={item.image_desktop}
              onChange={(v) => onItemChange({ ...item, image_desktop: v })}
              aspectClass="aspect-[5/1]"
              maxBytes={BANNER_MAX_BYTES}
              hint="Tamanho ideal: 1600 × 320 px (proporção 5:1, JPG, PNG ou GIF, máximo 5 MB)"
            />
            <ImageUploadField
              label="Imagem Mobile (opcional)"
              value={item.image_mobile}
              onChange={(v) => onItemChange({ ...item, image_mobile: v })}
              aspectClass="aspect-[3/1]"
              maxBytes={BANNER_MAX_BYTES}
              hint="Tamanho ideal: 900 × 300 px (proporção 3:1, JPG, PNG ou GIF, máximo 5 MB). Se vazio, usa a imagem desktop."
            />
            <TextField
              label="Link ao clicar (opcional)"
              value={item.link}
              onChange={(v) => onItemChange({ ...item, link: v })}
              placeholder="https://..."
            />
          </div>
        )}
      />

      {slides.length > 1 && (
        <TextField
          label="Intervalo entre slides (segundos)"
          type="number"
          value={form.hero_slide_interval ?? 5}
          onChange={(v) => update("hero_slide_interval", Number(v) || 5)}
          placeholder="5"
          hint="Tempo em segundos que cada slide fica visível antes de avançar automaticamente."
        />
      )}
    </SettingsSection>
  );
}
