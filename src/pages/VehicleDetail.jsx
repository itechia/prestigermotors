import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  ArrowLeft, Share2, MessageCircle,
  Gauge, Fuel, Calendar, Settings, Palette, DoorOpen, Check,
  Clock, Flame, TrendingDown, ChevronLeft, ChevronRight, RotateCw
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
  const [showEmbed, setShowEmbed] = useState(false);
  const [interestOpen, setInterestOpen] = useState(false);

  // Always start at the top when opening a vehicle
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [id]);

  const { data: vehicle, isLoading } = useQuery({
    queryKey: ["vehicle", id],
    queryFn: async () => {
      const list = await base44.entities.Vehicle.filter({ id });
      return list[0];
    },
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
  const phoneHref = settings.phone_number ? `tel:${settings.phone_number.replace(/\s/g, "")}` : "tel:";

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

  const nextImage = () => { setShowEmbed(false); setActiveImage(i => (i + 1) % images.length); };
  const prevImage = () => { setShowEmbed(false); setActiveImage(i => (i - 1 + images.length) % images.length); };

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
            key={showEmbed ? "embed" : activeImage}
            initial={{ opacity: 0.5 }}
            animate={{ opacity: 1 }}
            className="relative aspect-[16/11] rounded-3xl overflow-hidden bg-secondary"
          >
            {showEmbed ? (
              <iframe
                srcDoc={vehicle.embed_html}
                title={`${vehicle.brand} ${vehicle.model} 360°`}
                sandbox="allow-scripts allow-same-origin"
                scrolling="no"
                className="w-full h-full border-0 block"
              />
            ) : (
              <img src={images[activeImage]} alt={vehicle.model} className="w-full h-full object-cover" />
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

            {images.length > 1 && !showEmbed && (
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

          {/* Thumbnails — scroll horizontal, sem limite de fotos */}
          {(images.length > 1 || hasEmbed) && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => { setActiveImage(i); setShowEmbed(false); }}
                  className={cn(
                    "flex-shrink-0 w-[72px] h-[72px] rounded-xl overflow-hidden border-2 transition-all",
                    activeImage === i && !showEmbed ? "border-primary" : "border-transparent opacity-60 hover:opacity-100"
                  )}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
              {hasEmbed && (
                <button
                  onClick={() => setShowEmbed(true)}
                  className={cn(
                    "flex-shrink-0 w-[72px] h-[72px] rounded-xl border-2 flex flex-col items-center justify-center gap-1 transition-all",
                    showEmbed
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-transparent bg-secondary text-muted-foreground opacity-60 hover:opacity-100"
                  )}
                >
                  <RotateCw className="w-5 h-5" />
                  <span className="text-[10px] font-bold tracking-wider">360°</span>
                </button>
              )}
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