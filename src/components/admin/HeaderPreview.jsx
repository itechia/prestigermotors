import React from "react";
import { Car } from "lucide-react";
import { getStoreNameFontStyle } from "@/lib/fonts";

// Mostra como o cabeçalho do site vai ficar com a logo/nome/fonte escolhidos.
export default function HeaderPreview({ name, logoUrl, fontFamily }) {
  return (
    <div className="rounded-2xl border border-border bg-gradient-to-br from-secondary/60 to-background overflow-hidden">
      <div className="px-4 py-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider border-b border-border/60 bg-background/60">
        Prévia do cabeçalho do site
      </div>
      <div className="px-4 py-4 flex items-center gap-2">
        {logoUrl ? (
          <img
            src={logoUrl}
            alt={name || "Logo"}
            className="h-9 w-auto object-contain max-w-[120px]"
          />
        ) : (
          <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center flex-shrink-0">
            <Car className="w-5 h-5 text-primary-foreground" strokeWidth={2.5} />
          </div>
        )}
        <span
          className="text-xl tracking-tight truncate"
          style={getStoreNameFontStyle(fontFamily)}
        >
          {name || "Sua loja"}
        </span>
      </div>
    </div>
  );
}