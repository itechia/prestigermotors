import React from "react";
import { useStoreSettings } from "@/lib/useStoreSettings";
import { IconFromName } from "@/components/IconPicker";

export default function TrustBar() {
  const s = useStoreSettings();
  const items = s.trust_items || [];

  if (items.length === 0) return null;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-4">
      {items.map((item, i) => (
        <div
          key={i}
          className="bg-secondary/60 rounded-xl md:rounded-2xl p-2.5 md:p-5 flex items-center md:items-start gap-2 md:gap-3"
        >
          <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-background flex items-center justify-center flex-shrink-0">
            <IconFromName name={item.icon} className="w-4 h-4 md:w-5 md:h-5 text-primary" strokeWidth={2.2} />
          </div>
          <div className="min-w-0">
            <div className="font-semibold text-xs md:text-sm leading-tight">{item.title}</div>
            <div className="hidden md:block text-xs text-muted-foreground mt-0.5 leading-snug">{item.desc}</div>
          </div>
        </div>
      ))}
    </div>
  );
}