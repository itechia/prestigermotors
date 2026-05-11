import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ICON_CHOICES } from "@/lib/useStoreSettings";
import { IconFromName } from "@/components/IconPicker";
import { Label } from "@/components/ui/label";

export default function IconSelect({ value, onChange, label = "Ícone" }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-semibold">{label}</Label>
      <Select value={value || "shield"} onValueChange={onChange}>
        <SelectTrigger className="rounded-xl">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {ICON_CHOICES.map((c) => (
            <SelectItem key={c.value} value={c.value}>
              <div className="flex items-center gap-2">
                <IconFromName name={c.value} className="w-4 h-4" />
                <span>{c.label}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}