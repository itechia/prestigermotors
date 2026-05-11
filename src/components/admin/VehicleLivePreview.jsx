import React from "react";
import VehicleCardPreview from "./VehicleCardPreview";

export default function VehicleLivePreview({ vehicle }) {
  return (
    <div className="space-y-3">
      <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">
        Pré-visualização
      </p>
      <div className="max-w-[280px] mx-auto lg:mx-0">
        <VehicleCardPreview vehicle={vehicle} />
      </div>
      <p className="text-[11px] text-muted-foreground leading-relaxed">
        Atualizado em tempo real conforme você edita.
      </p>
    </div>
  );
}
