import React from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { STORE_NAME_FONTS, getStoreNameFontStyle } from "@/lib/fonts";

export default function FontSelectField({ label, value, onChange, sampleText = "Sua marca", hint }) {
  return (
    <div className="space-y-2">
      {label && <Label className="text-xs font-semibold">{label}</Label>}

      <Select value={value || STORE_NAME_FONTS[0].value} onValueChange={onChange}>
        <SelectTrigger className="rounded-xl">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="max-h-72">
          {STORE_NAME_FONTS.map((f) => (
            <SelectItem key={f.value} value={f.value}>
              <span style={getStoreNameFontStyle(f.value)}>{f.label}</span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="rounded-xl border border-border bg-secondary/40 px-4 py-3">
        <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
          Prévia
        </div>
        <div
          className="text-2xl truncate"
          style={getStoreNameFontStyle(value || STORE_NAME_FONTS[0].value)}
        >
          {sampleText || "Sua marca"}
        </div>
      </div>

      {hint && <p className="text-[11px] text-muted-foreground leading-snug">{hint}</p>}
    </div>
  );
}