import React, { useState, useEffect, memo } from "react";
import { Link } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Gauge, Calendar, Flame, MessageCircle, RotateCw } from "lucide-react";
import { formatCurrency, formatMileage, formatYear } from "@/lib/formatters";
import { useStoreSettings } from "@/lib/useStoreSettings";
import InterestFormDialog from "@/components/vehicles/InterestFormDialog";
import { buildWhatsAppHref } from "@/lib/whatsappMessage";

function VehicleCard({ vehicle, index = 0 }) {
  const settings = useStoreSettings();
  const queryClient = useQueryClient();
  const [interestOpen, setInterestOpen] = useState(false);

  // Popula o cache da página de detalhe com os dados que já temos do catálogo.
  // Assim, clicar no card abre a página de detalhe instantaneamente.
  useEffect(() => {
    queryClient.setQueryData(["vehicle", vehicle.id], vehicle);
  }, [vehicle.id]);

  const hasEmbed  = Boolean(vehicle.embed_html?.trim());
  const mainImage = vehicle.images?.[0] || "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&q=80";

  const hasDiscount = Boolean(vehicle.price_old && vehicle.price_old > vehicle.price);
  const savings     = hasDiscount ? vehicle.price_old - vehicle.price : 0;
  const discountPct = hasDiscount ? Math.round((savings / vehicle.price_old) * 100) : 0;

  const handleInterest = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (settings.interest_webhook_enabled && settings.interest_webhook_url) {
      setInterestOpen(true);
    } else {
      window.open(buildWhatsAppHref(settings.whatsapp_number, vehicle), "_blank");
    }
  };

  const detailHref = `/veiculo/${vehicle.id}`;

  return (
    <div className="card-fade-in" style={{ animationDelay: `${Math.min(index * 40, 200)}ms` }}>
      <div className="group flex flex-col h-full bg-card rounded-3xl overflow-hidden border border-border/50 hover:border-border hover:shadow-xl transition-all duration-300">

        {/* ── Área de imagem ───────────────────────────── */}
        <div className="relative aspect-[4/3] overflow-hidden bg-secondary">
          <Link to={detailHref} className="block w-full h-full">
            {hasEmbed ? (
              /* 360° embed como capa — pointer-events-none para o clique ir para o Link */
              <iframe
                srcDoc={vehicle.embed_html}
                title={`${vehicle.brand} ${vehicle.model} 360°`}
                sandbox="allow-scripts allow-same-origin"
                scrolling="no"
                tabIndex={-1}
                className="w-full h-full border-0 block pointer-events-none"
              />
            ) : (
              <img
                src={mainImage}
                alt={`${vehicle.brand} ${vehicle.model}`}
                className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-500"
                loading="lazy"
              />
            )}
          </Link>

          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/50 to-transparent pointer-events-none" />

          <div className="absolute top-3 left-3 flex flex-col gap-1.5 items-start pointer-events-none">
            {hasDiscount && vehicle.status !== "vendido" && (
              <span className="px-2.5 py-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold uppercase tracking-wider shadow-sm">
                -{discountPct}% OFF
              </span>
            )}
            {vehicle.featured && (
              <span className="px-2.5 py-1 rounded-full bg-accent text-accent-foreground text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 shadow-sm">
                <Flame className="w-3 h-3" /> Destaque
              </span>
            )}
            {vehicle.status === "reservado" && (
              <span className="px-2.5 py-1 rounded-full bg-yellow-500 text-white text-[10px] font-bold uppercase tracking-wider">
                Reservado
              </span>
            )}
            {vehicle.status === "vendido" && (
              <span className="px-2.5 py-1 rounded-full bg-black/80 text-white text-[10px] font-bold uppercase tracking-wider">
                Vendido
              </span>
            )}
          </div>

          {hasEmbed && (
            <div className="absolute bottom-3 left-3 pointer-events-none">
              <span className="flex items-center gap-1 bg-black/60 backdrop-blur-sm text-white px-2.5 py-1 rounded-full text-[10px] font-bold">
                <RotateCw className="w-3 h-3" /> 360°
              </span>
            </div>
          )}
        </div>

        <Link to={detailHref} className="p-4 space-y-3 flex flex-col flex-1">
          <div>
            <h3 className="font-display font-bold text-base leading-tight truncate">
              {vehicle.brand} {vehicle.model}
            </h3>
            <p className="text-xs text-muted-foreground truncate mt-0.5">
              {vehicle.version || `${vehicle.year}`}
            </p>
          </div>

          <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              <span>{formatYear(vehicle.manufacture_year, vehicle.year) || vehicle.year}</span>
            </div>
            <div className="flex items-center gap-1">
              <Gauge className="w-3 h-3" />
              <span>{formatMileage(vehicle.mileage)}</span>
            </div>
          </div>

          <div className="pt-3 border-t border-border/50 mt-auto min-h-[64px] flex flex-col justify-end">
            {hasDiscount && (
              <div className="flex items-center gap-2 text-[11px] text-muted-foreground mb-0.5">
                <span className="line-through">{formatCurrency(vehicle.price_old)}</span>
                <span className="text-green-700 font-semibold">
                  Economize {formatCurrency(savings)}
                </span>
              </div>
            )}
            <div className="font-display font-bold text-xl price-gradient leading-tight">
              {formatCurrency(vehicle.price)}
            </div>
          </div>

          {vehicle.status !== "vendido" && (
            <button
              onClick={handleInterest}
              className="interest-btn w-full mt-2 h-10 rounded-full bg-secondary hover:bg-green-600 hover:text-white text-xs font-semibold uppercase tracking-wider transition-colors flex items-center justify-center gap-2"
            >
              <MessageCircle className="w-4 h-4" />
              Tenho interesse
            </button>
          )}
        </Link>
      </div>

      <InterestFormDialog
        open={interestOpen}
        onOpenChange={setInterestOpen}
        vehicle={vehicle}
      />
    </div>
  );
}

export default memo(VehicleCard);
