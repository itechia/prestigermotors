import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/api/supabaseClient";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  ArrowLeft, Share2, MessageCircle,
  Gauge, Fuel, Calendar, Settings, Palette, DoorOpen, Check,
  Clock, Flame, TrendingDown, ChevronLeft, ChevronRight, RotateCw,
  X, ZoomIn, ZoomOut, Maximize2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatCurrency, formatMileage, formatYear } from "@/lib/formatters";
import { getVehicleMeta } from "@/lib/vehicleMeta";
import { useStoreSettings } from "@/lib/useStoreSettings";
import { useTaxonomies } from "@/lib/useTaxonomies";
import { buildResolvers } from "@/lib/taxLabels";
import { IconFromName } from "@/components/IconPicker";
import SimilarVehicles from "../components/vehicles/SimilarVehicles";
import InterestFormDialog from "../components/vehicles/InterestFormDialog";
import { buildWhatsAppHref } from "@/lib/whatsappMessage";

export default function VehicleDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const settings = useStoreSettings();
  const tax = useTaxonomies();
  const labels = buildResolvers(tax);
  const [activeImage, setActiveImage] = useState(0);
  const [thumbOffset, setThumbOffset] = useState(0);
  const [interestOpen, setInterestOpen] = useState(false);
  // fsSlide: null = fechado, número = slide inicial (embed=0 quando existe, depois imagens)
  const [fsSlide, setFsSlide] = useState(null);

  // Always start at the top when opening a vehicle
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [id]);

  // Mantém a janela de thumbnails visível ao redor do slide ativo.
  // Deve ficar antes dos early returns para não violar a rules-of-hooks.
  const THUMB_COLS = 5;
  useEffect(() => {
    if (activeImage < thumbOffset) {
      setThumbOffset(activeImage);
    } else if (activeImage >= thumbOffset + THUMB_COLS) {
      setThumbOffset(activeImage - THUMB_COLS + 1);
    }
  }, [activeImage, thumbOffset]);

  const { data: vehicle, isLoading } = useQuery({
    queryKey: ["vehicle", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vehicles")
        .select("*")
        .eq("id", id)
        .single();
      if (error && error.code !== "PGRST116") throw error;
      return data ?? null;
    },
    // staleTime 0: se o cache tiver dados leves do catálogo, mostra imediatamente
    // e revalida em background para preencher description/features
    staleTime: 0,
  });

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-40 bg-secondary rounded-full" />
          <div className="aspect-[16/10] bg-secondary rounded-3xl" />
          <div className="h-10 w-2/3 bg-secondary rounded" />
        </div>
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <h2 className="font-display font-bold text-2xl">Veículo não encontrado</h2>
        <Button onClick={() => navigate("/")} className="mt-4 rounded-full">Voltar ao catálogo</Button>
      </div>
    );
  }

  const images = vehicle.images?.length > 0
    ? vehicle.images
    : ["https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=1200&q=80"];

  const hasEmbed = Boolean(vehicle.embed_html?.trim());

  const meta = getVehicleMeta(vehicle);
  // Coerce to boolean so JSX never renders the falsy `0` (e.g. when price_old=0).
  const hasDiscount = Boolean(vehicle.price_old && vehicle.price_old > vehicle.price);
  const savings = hasDiscount ? vehicle.price_old - vehicle.price : 0;
  const discountPct = hasDiscount ? Math.round((savings / vehicle.price_old) * 100) : 0;

  const handleShare = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: `${vehicle.brand} ${vehicle.model}`, url });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success("Link copiado!");
      }
    } catch {}
  };

  // Rich WhatsApp message: title + specs + price + direct link to the vehicle.
  // The link generates a preview card with cover image (Mercado Livre style).
  const whatsappHref = buildWhatsAppHref(settings.whatsapp_number, vehicle);

  // When the interest webhook is active, the "Tenho interesse" CTA opens the
  // customizable form modal instead of jumping straight to WhatsApp.
  const useInterestForm = Boolean(
    settings.interest_webhook_enabled && settings.interest_webhook_url
  );
  const handleInterestClick = () => {
    if (useInterestForm) {
      setInterestOpen(true);
    } else {
      window.open(whatsappHref, "_blank", "noopener,noreferrer");
    }
  };

  // Slide 0 = embed (quando existe); slides 1..N = images[0..N-1]
  const totalSlides = (hasEmbed ? 1 : 0) + images.length;
  const showingEmbed = hasEmbed && activeImage === 0;
  const imageIndex = hasEmbed ? activeImage - 1 : activeImage;
  const nextImage = () => setActiveImage(i => (i + 1) % totalSlides);
  const prevImage = () => setActiveImage(i => (i - 1 + totalSlides) % totalSlides);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Voltar
      </button>

      <div className="grid lg:grid-cols-5 gap-8">
        {/* Gallery */}
        <div className="lg:col-span-3 space-y-3">
          <motion.div
            key={activeImage}
            initial={{ opacity: 0.5 }}
            animate={{ opacity: 1 }}
            className="relative aspect-[16/11] rounded-3xl overflow-hidden bg-secondary"
          >
            {showingEmbed ? (
              <>
                <iframe
                  key="embed"
                  srcDoc={vehicle.embed_html}
                  title={`${vehicle.brand} ${vehicle.model} 360°`}
                  sandbox="allow-scripts allow-same-origin"
                  scrolling="no"
                  className="w-full h-full border-0 block"
                />
                {/* Abrir fullscreen no slide atual */}
                <button
                  onClick={() => setFsSlide(activeImage)}
                  className="absolute bottom-3 right-3 z-10 w-9 h-9 rounded-full bg-black/60 backdrop-blur-sm text-white flex items-center justify-center hover:bg-black/80 transition-colors"
                  title="Tela cheia"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
              </>
            ) : (
              <img
                src={images[imageIndex]}
                alt={vehicle.model}
                className="w-full h-full object-cover cursor-zoom-in"
                onClick={() => setFsSlide(activeImage)}
              />
            )}

            <div className="absolute top-4 left-4 flex gap-2">
              {hasDiscount && vehicle.status !== "vendido" && (
                <span className="px-3 py-1.5 rounded-full bg-destructive text-destructive-foreground text-xs font-bold uppercase tracking-wider shadow-md flex items-center gap-1.5">
                  <TrendingDown className="w-3.5 h-3.5" /> -{discountPct}% OFF
                </span>
              )}
              {vehicle.featured && (
                <span className="px-3 py-1.5 rounded-full bg-accent text-accent-foreground text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-md">
                  <Flame className="w-3.5 h-3.5" /> Destaque
                </span>
              )}
            </div>

            <div className="absolute top-4 right-4 flex gap-2">
              <button
                onClick={handleShare}
                className="w-11 h-11 rounded-full bg-white text-slate-900 dark:bg-slate-900/90 dark:text-white dark:border dark:border-white/20 backdrop-blur-sm flex items-center justify-center hover:scale-105 transition-transform shadow-md"
              >
                <Share2 className="w-5 h-5" />
              </button>
            </div>

            {totalSlides > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white text-slate-900 dark:bg-slate-900/90 dark:text-white dark:border dark:border-white/20 backdrop-blur-sm flex items-center justify-center hover:scale-105 transition-transform shadow-md"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white text-slate-900 dark:bg-slate-900/90 dark:text-white dark:border dark:border-white/20 backdrop-blur-sm flex items-center justify-center hover:scale-105 transition-transform shadow-md"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}
          </motion.div>

          {/* Thumbnails — grade fixa de 5 com botões de navegação */}
          {totalSlides > 1 && (
            <div className="flex items-center gap-2">
              {/* Seta esquerda */}
              <button
                onClick={() => setThumbOffset(o => Math.max(0, o - 1))}
                disabled={thumbOffset === 0}
                className="flex-shrink-0 w-8 h-8 rounded-full bg-secondary flex items-center justify-center transition-opacity disabled:opacity-20"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {/* Grade fixa de 5 colunas */}
              <div className="grid grid-cols-5 gap-2 flex-1">
                {Array.from({ length: THUMB_COLS }).map((_, col) => {
                  const slideIdx = thumbOffset + col;
                  if (slideIdx >= totalSlides) {
                    return <div key={col} className="aspect-square" />;
                  }
                  const isEmbed = hasEmbed && slideIdx === 0;
                  const imgIdx = hasEmbed ? slideIdx - 1 : slideIdx;
                  return isEmbed ? (
                    <button
                      key="embed"
                      onClick={() => setActiveImage(0)}
                      className={cn(
                        "aspect-square rounded-xl border-2 flex flex-col items-center justify-center gap-1 transition-all",
                        activeImage === 0
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-transparent bg-secondary text-muted-foreground opacity-60 hover:opacity-100"
                      )}
                    >
                      <RotateCw className="w-4 h-4" />
                      <span className="text-[9px] font-bold tracking-wider">360°</span>
                    </button>
                  ) : (
                    <button
                      key={imgIdx}
                      onClick={() => setActiveImage(slideIdx)}
                      className={cn(
                        "aspect-square rounded-xl overflow-hidden border-2 transition-all",
                        activeImage === slideIdx ? "border-primary" : "border-transparent opacity-60 hover:opacity-100"
                      )}
                    >
                      <img src={images[imgIdx]} alt="" className="w-full h-full object-cover" />
                    </button>
                  );
                })}
              </div>

              {/* Seta direita */}
              <button
                onClick={() => setThumbOffset(o => Math.min(totalSlides - THUMB_COLS, o + 1))}
                disabled={thumbOffset + THUMB_COLS >= totalSlides}
                className="flex-shrink-0 w-8 h-8 rounded-full bg-secondary flex items-center justify-center transition-opacity disabled:opacity-20"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="lg:col-span-2 space-y-5">
          <div>
            <h1 className="font-display font-bold text-3xl md:text-4xl leading-tight">
              {vehicle.brand} {vehicle.model}
            </h1>
            <p className="text-muted-foreground mt-1">{vehicle.version}</p>

            {meta && vehicle.status !== "vendido" && meta.daysOnLot > 0 && (
              <div className="flex items-center gap-1.5 mt-4 text-xs text-muted-foreground">
                <Clock className="w-3.5 h-3.5" />
                Anunciado há {meta.daysOnLot} dia{meta.daysOnLot !== 1 ? "s" : ""}
              </div>
            )}

            {/* Price: De / Por */}
            <div className="mt-5 pb-5 border-b border-border">
              {hasDiscount && (
                <div className="flex items-center gap-2 mb-1 text-sm">
                  <span className="text-muted-foreground">De</span>
                  <span className="text-muted-foreground line-through">{formatCurrency(vehicle.price_old)}</span>
                  <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-[10px] font-bold uppercase">
                    Você economiza {formatCurrency(savings)}
                  </span>
                </div>
              )}
              {hasDiscount && (
                <div className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Por</div>
              )}
              <div className="font-display font-bold text-4xl md:text-5xl price-gradient leading-none">
                {formatCurrency(vehicle.price)}
              </div>
              <div className="text-sm text-muted-foreground mt-2">
                Condição: <span className="font-semibold text-foreground">{labels.conditionLabel(vehicle.condition) || "-"}</span>
              </div>
            </div>
          </div>

          {meta?.lowStock && vehicle.status === "disponivel" && (
            <div className="flex items-start gap-3 p-3 rounded-2xl bg-orange-50 border border-orange-200">
              <Flame className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <div className="font-semibold text-orange-900">Última unidade disponível</div>
                <div className="text-orange-800 text-xs mt-0.5">Este é o único exemplar deste modelo no nosso estoque.</div>
              </div>
            </div>
          )}

          {/* Quick specs */}
          <div className="grid grid-cols-2 gap-3">
            <SpecCard icon={Calendar} label="Ano" value={formatYear(vehicle.manufacture_year, vehicle.year)} />
            <SpecCard icon={Gauge} label="Quilometragem" value={formatMileage(vehicle.mileage)} />
            <SpecCard icon={Fuel} label="Combustível" value={labels.fuelLabel(vehicle.fuel_type) || "-"} />
            <SpecCard icon={Settings} label="Câmbio" value={labels.transmissionLabel(vehicle.transmission) || "-"} />
            {vehicle.color && <SpecCard icon={Palette} label="Cor" value={labels.colorLabel(vehicle.color) || vehicle.color} />}
            {vehicle.doors && <SpecCard icon={DoorOpen} label="Portas" value={String(vehicle.doors)} />}
          </div>

          {/* CTA — hidden when vehicle is sold */}
          {vehicle.status !== "vendido" ? (
            <div className="pt-2">
              <button
                type="button"
                onClick={handleInterestClick}
                className="interest-btn w-full h-14 rounded-full bg-secondary hover:bg-green-600 hover:text-white text-sm font-semibold uppercase tracking-wider transition-colors flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-5 h-5" />
                Tenho interesse
              </button>
            </div>
          ) : (
            <div className="pt-2">
              <div className="w-full h-14 rounded-full bg-secondary text-muted-foreground text-sm font-semibold uppercase tracking-wider flex items-center justify-center">
                Veículo vendido
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Description & Features */}
      <div className="grid md:grid-cols-2 gap-8 mt-12">
        {vehicle.description && (
          <div>
            <h2 className="font-display font-bold text-2xl mb-4">Sobre este veículo</h2>
            <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
              {vehicle.description}
            </p>
          </div>
        )}

        {vehicle.features?.length > 0 && (
          <div>
            <h2 className="font-display font-bold text-2xl mb-4">Opcionais e equipamentos</h2>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {vehicle.features.map((f, i) => (
                <li key={i} className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Guarantees section (admin-editable) */}
      {settings.guarantees?.length > 0 && (
        <div className="mt-12 bg-primary text-primary-foreground dark:bg-card dark:text-foreground dark:border dark:border-border rounded-3xl p-6 md:p-10">
          <h2 className="font-display font-bold text-2xl md:text-3xl mb-2">{settings.guarantee_section_title}</h2>
          {settings.guarantee_section_subtitle && (
            <p className="text-primary-foreground/70 dark:text-muted-foreground text-sm max-w-xl">{settings.guarantee_section_subtitle}</p>
          )}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            {settings.guarantees.map((g, i) => (
              <div key={i}>
                <div className="w-10 h-10 rounded-xl bg-white/10 dark:bg-accent/15 flex items-center justify-center mb-3">
                  <IconFromName name={g.icon} className="w-5 h-5 text-accent" />
                </div>
                <div className="font-semibold text-sm">{g.title}</div>
                <div className="text-xs text-primary-foreground/60 dark:text-muted-foreground mt-1 leading-snug">{g.desc}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Ficha técnica */}
      <div className="mt-12 bg-secondary/50 rounded-3xl p-6 md:p-8">
        <h2 className="font-display font-bold text-2xl mb-5">Ficha técnica</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <DetailRow label="Marca" value={vehicle.brand} />
          <DetailRow label="Modelo" value={vehicle.model} />
          <DetailRow label="Ano modelo" value={vehicle.year} />
          <DetailRow label="Fabricação" value={vehicle.manufacture_year} />
          <DetailRow label="Categoria" value={labels.categoryLabel(vehicle.body_type)} />
          <DetailRow label="Condição" value={labels.conditionLabel(vehicle.condition)} />
          <DetailRow label="Motor" value={vehicle.engine} />
          <DetailRow label="Cor" value={labels.colorLabel(vehicle.color) || vehicle.color} />
        </div>
      </div>

      {/* Similar vehicles */}
      <SimilarVehicles vehicle={vehicle} />

      {/* Sticky mobile CTA */}
      {vehicle.status !== "vendido" && (
        <div className="md:hidden fixed bottom-16 left-0 right-0 z-30 bg-background/95 backdrop-blur-md border-t border-border p-3">
          <button
            type="button"
            onClick={handleInterestClick}
            className="interest-btn w-full h-12 rounded-full bg-secondary hover:bg-green-600 hover:text-white text-xs font-semibold uppercase tracking-wider transition-colors flex items-center justify-center gap-2"
          >
            <MessageCircle className="w-4 h-4" />
            Tenho interesse
          </button>
        </div>
      )}

      <InterestFormDialog
        open={interestOpen}
        onOpenChange={setInterestOpen}
        vehicle={vehicle}
      />

      {fsSlide !== null && (
        <FullscreenViewer
          slides={[
            ...(hasEmbed ? [{ type: "embed", html: vehicle.embed_html }] : []),
            ...images.map(src => ({ type: "image", src })),
          ]}
          initialSlide={fsSlide}
          onClose={() => setFsSlide(null)}
        />
      )}
    </div>
  );
}

function SpecCard({ icon: Icon, label, value }) {
  return (
    <div className="bg-secondary/70 rounded-2xl p-4">
      <Icon className="w-4 h-4 text-muted-foreground mb-2" />
      <div className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">{label}</div>
      <div className="font-semibold text-sm mt-0.5 truncate">{value}</div>
    </div>
  );
}

function DetailRow({ label, value }) {
  if (!value) return null;
  return (
    <div>
      <div className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">{label}</div>
      <div className="font-semibold text-sm mt-0.5">{value}</div>
    </div>
  );
}

// ─── Visualizador em tela cheia — carrossel unificado (embed + fotos) ──────
// slides = [{ type:'embed', html }, { type:'image', src }, ...]
// Usa inline styles para garantir cobertura total independente de stacking contexts.
function FullscreenViewer({ slides, initialSlide, onClose }) {
  const [idx, setIdx] = useState(initialSlide);
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragOrigin = useRef({ x: 0, y: 0 });
  const panAtStart = useRef({ x: 0, y: 0 });
  const pinchDist = useRef(null);
  const pinchScale = useRef(1);

  // Bloqueia scroll do body
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  // Reset zoom ao trocar imagem
  useEffect(() => { setScale(1); setPan({ x: 0, y: 0 }); }, [idx]);

  // Teclado
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") setIdx(i => (i - 1 + slides.length) % slides.length);
      if (e.key === "ArrowRight") setIdx(i => (i + 1) % slides.length);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [slides.length, onClose]);

  const zoom = (factor) =>
    setScale(s => {
      const next = Math.min(Math.max(s * factor, 1), 6);
      if (next === 1) setPan({ x: 0, y: 0 });
      return next;
    });

  // Mouse wheel
  const onWheel = (e) => {
    e.preventDefault();
    zoom(e.deltaY < 0 ? 1.15 : 1 / 1.15);
  };

  // Mouse drag
  const onMouseDown = (e) => {
    if (scale <= 1) return;
    e.preventDefault();
    setIsDragging(true);
    dragOrigin.current = { x: e.clientX, y: e.clientY };
    panAtStart.current = { ...pan };
  };
  const onMouseMove = (e) => {
    if (!isDragging) return;
    setPan({
      x: panAtStart.current.x + (e.clientX - dragOrigin.current.x),
      y: panAtStart.current.y + (e.clientY - dragOrigin.current.y),
    });
  };
  const onMouseUp = () => setIsDragging(false);

  // Touch: pinch zoom + drag
  const onTouchStart = (e) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      pinchDist.current = Math.sqrt(dx * dx + dy * dy);
      pinchScale.current = scale;
    } else if (e.touches.length === 1 && scale > 1) {
      setIsDragging(true);
      dragOrigin.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      panAtStart.current = { ...pan };
    }
  };
  const onTouchMove = (e) => {
    e.preventDefault();
    if (e.touches.length === 2 && pinchDist.current) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      setScale(Math.min(Math.max(pinchScale.current * (dist / pinchDist.current), 1), 6));
    } else if (e.touches.length === 1 && isDragging) {
      setPan({
        x: panAtStart.current.x + (e.touches[0].clientX - dragOrigin.current.x),
        y: panAtStart.current.y + (e.touches[0].clientY - dragOrigin.current.y),
      });
    }
  };
  const onTouchEnd = () => { setIsDragging(false); pinchDist.current = null; };

  // Duplo clique: alternar zoom 1x / 2.5x
  const onDblClick = () => {
    if (scale > 1) { setScale(1); setPan({ x: 0, y: 0 }); }
    else setScale(2.5);
  };

  const prev = (e) => { e.stopPropagation(); setIdx(i => (i - 1 + slides.length) % slides.length); };
  const next = (e) => { e.stopPropagation(); setIdx(i => (i + 1) % slides.length); };

  const current = slides[idx];
  const isImage = current?.type === "image";

  const overlay = {
    position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
    zIndex: 2147483647,
    backgroundColor: "#000",
    display: "flex", alignItems: "center", justifyContent: "center",
    userSelect: "none",
  };
  const btnBase = {
    display: "flex", alignItems: "center", justifyContent: "center",
    borderRadius: "50%", border: "none", cursor: "pointer",
    backgroundColor: "rgba(255,255,255,0.15)", color: "#fff",
  };

  return createPortal(
    <div style={overlay} onClick={isImage && scale <= 1 ? onClose : undefined}>

      {/* ── Barra superior ────────────────────────────────────── */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, zIndex: 2,
        padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between",
        background: "linear-gradient(to bottom, rgba(0,0,0,0.7), transparent)",
      }}>
        <span style={{ color: "rgba(255,255,255,0.65)", fontSize: 14, fontWeight: 600 }}>
          {slides.length > 1 ? `${idx + 1} / ${slides.length}` : ""}
        </span>
        <button onClick={onClose}
          style={{ ...btnBase, width: 44, height: 44, backgroundColor: "rgba(255,255,255,0.2)",
                   border: "1.5px solid rgba(255,255,255,0.25)" }}>
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* ── Slide atual ───────────────────────────────────────── */}
      {isImage ? (
        <div
          style={{ width: "100%", height: "100%", display: "flex", alignItems: "center",
                   justifyContent: "center", overflow: "hidden", touchAction: "none" }}
          onWheel={onWheel}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          <img
            src={current.src}
            alt={`Imagem ${idx + 1}`}
            draggable={false}
            onDoubleClick={onDblClick}
            onClick={e => e.stopPropagation()}
            style={{
              maxHeight: "85vh", maxWidth: "92vw", objectFit: "contain", userSelect: "none",
              cursor: scale > 1 ? (isDragging ? "grabbing" : "grab") : "zoom-in",
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
              transition: isDragging ? "none" : "transform 0.12s ease",
            }}
          />
        </div>
      ) : (
        /* Embed 360° — ocupa tela inteira, totalmente interativo */
        <iframe
          srcDoc={current.html}
          sandbox="allow-scripts allow-same-origin"
          scrolling="no"
          style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: "none" }}
        />
      )}

      {/* ── Setas de navegação (ambos os tipos) ────────────────── */}
      {slides.length > 1 && (
        <>
          <button onClick={prev}
            style={{ ...btnBase, position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)",
                     width: 44, height: 44, zIndex: 2 }}>
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button onClick={next}
            style={{ ...btnBase, position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                     width: 44, height: 44, zIndex: 2 }}>
            <ChevronRight className="w-6 h-6" />
          </button>
        </>
      )}

      {/* ── Zoom — apenas para fotos, acima do nav mobile (80px) ── */}
      {isImage && (
        <div style={{
          position: "absolute", bottom: 80, left: "50%", transform: "translateX(-50%)", zIndex: 2,
          display: "flex", alignItems: "center", gap: 12,
          backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)",
          borderRadius: 999, padding: "10px 20px",
        }}>
          <button onClick={() => zoom(1 / 1.3)} style={{ ...btnBase, width: 36, height: 36, backgroundColor: "transparent" }}>
            <ZoomOut className="w-5 h-5" />
          </button>
          <span style={{ color: "#fff", fontSize: 14, fontWeight: 600, minWidth: 48, textAlign: "center" }}>
            {Math.round(scale * 100)}%
          </span>
          <button onClick={() => zoom(1.3)} style={{ ...btnBase, width: 36, height: 36, backgroundColor: "transparent" }}>
            <ZoomIn className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>,
    document.body
  );
}