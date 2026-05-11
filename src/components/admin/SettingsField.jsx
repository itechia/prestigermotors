import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export function SettingsField({ label, hint, children }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-semibold text-foreground">{label}</Label>
      {children}
      {hint && <p className="text-[11px] text-muted-foreground leading-snug">{hint}</p>}
    </div>
  );
}

export function TextField({ label, hint, value, onChange, placeholder, type = "text" }) {
  return (
    <SettingsField label={label} hint={hint}>
      <Input
        type={type}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="rounded-xl"
      />
    </SettingsField>
  );
}

export function TextAreaField({ label, hint, value, onChange, placeholder, rows = 3 }) {
  return (
    <SettingsField label={label} hint={hint}>
      <Textarea
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="rounded-xl resize-none"
      />
    </SettingsField>
  );
}

export function SettingsSection({ title, desc, children }) {
  return (
    <div className="bg-card rounded-3xl p-5 md:p-6 border border-border/50">
      <div className="mb-5">
        <h3 className="font-display font-bold text-base">{title}</h3>
        {desc && <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>}
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}