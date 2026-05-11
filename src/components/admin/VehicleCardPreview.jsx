import React from "react";
import { Gauge, Calendar, Flame, MessageCircle, RotateCw } from "lucide-react";
import { formatCurrency, formatMileage, formatYear } from "@/lib/formatters";

// Read-only preview of how a vehicle will appear on the public catalog card.
// Intentionally NOT a Link — clicks do nothing here.
export default function VehicleCardPreview({ vehicle }) {
  const v = vehicle || {};
  const hasEmbed = Boolean(v.embed_html?.trim());
  const mainImage =
    v.images?.[0] ||
    "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&q=80";

  const hasDiscount = Boolean(v.price_old && v.price_old > v.price);
  const savings = hasDiscount ? v.price_old - v.price : 0;
  const discountPct = hasDiscount
    ? Math.round((savings / v.price_old) * 100)
    : 0;

  return (
    <div className="flex flex-col bg-card rounded-3xl overflow-hidden border border-border/50 shadow-sm">
      <div className="relative aspect-[4/3] overflow-hidden bg-secondary">
        {hasEmbed ? (
          <>
            <iframe
              srcDoc={v.embed_html}
              title="preview 360°"
              sandbox="allow-scripts allow-same-origin"
              scrolling="no"
              className="w-full h-full border-0 block"
              style={{ pointerEvents: 'none' }}
            />
            <div className="absolute bottom-3 left-3 z-10 flex items-center gap-1 bg-black/60 backdrop-blur-sm text-white px-2.5 py-1 rounded-full text-[10px] font-bold">
              <RotateCw className="w-3 h-3" /> 360°
            </div>
          </>
        ) : (
          <img
            src={mainImage}
            alt={`${v.brand || ""} ${v.model || ""}`}
            className="w-full h-full object-cover"
          />
        )}
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/50 to-transparent pointer-events-none" />

        <div className="absolute top-3 left-3 flex flex-col gap-1.5 items-start">
          {hasDiscount && v.status !== "vendido" && (
            <span className="px-2.5 py-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold uppercase tracking-wider shadow-sm">
              -{discountPct}% OFF
            </span>
          )}
          {v.featured && (
            <span className="px-2.5 py-1 rounded-full bg-accent text-accent-foreground text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 shadow-sm">
              <Flame className="w-3 h-3" /> Destaque
            </span>
          )}
          {v.status === "reservado" && (
            <span className="px-2.5 py-1 rounded-full bg-yellow-500 text-white text-[10px] font-bold uppercase tracking-wider">
              Reservado
            </span>
          )}
          {v.status === "vendido" && (
            <span className="px-2.5 py-1 rounded-full bg-black/80 text-white text-[10px] font-bold uppercase tracking-wider">
              Vendido
            </span>
          )}
        </div>
      </div>

      <div className="p-4 space-y-3 flex flex-col flex-1">
        <div>
          <h3 className="font-display font-bold text-base leading-tight truncate">
            {v.brand || "Marca"} {v.model || "Modelo"}
          </h3>
          <p className="text-xs text-muted-foreground truncate mt-0.5">
            {v.version || (v.year ? String(v.year) : "Versão")}
          </p>
        </div>

        <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            <span>{formatYear(v.manufacture_year, v.year) || v.year || "—"}</span>
          </div>
          <div className="flex items-center gap-1">
            <Gauge className="w-3 h-3" />
            <span>{formatMileage(v.mileage || 0)}</span>
          </div>
        </div>

        <div className="pt-3 border-t border-border/50 mt-auto min-h-[64px] flex flex-col justify-end">
          {hasDiscount && (
            <div className="flex items-center gap-2 text-[11px] text-muted-foreground mb-0.5">
              <span className="line-through">{formatCurrency(v.price_old)}</span>
              <span className="text-green-700 font-semibold">
                Economize {formatCurrency(savings)}
              </span>
            </div>
          )}
          <div className="font-display font-bold text-xl price-gradient leading-tight">
            {formatCurrency(v.price || 0)}
          </div>
        </div>

        {v.status !== "vendido" && (
          <div className="interest-btn w-full mt-2 h-10 rounded-full bg-secondary text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-2">
            <MessageCircle className="w-4 h-4" />
            Tenho interesse
          </div>
        )}
      </div>
    </div>
  );
}