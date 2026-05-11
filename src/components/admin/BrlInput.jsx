import React from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { maskBRLDisplay, parseBRLInput } from "@/lib/brl";

// Input that always shows the value formatted as BRL (R$ 40.000,00).
// Stores a numeric value (e.g. 40000) and emits numbers via onChange.
export default function BrlInput({ value, onChange, placeholder = "0,00", className, ...rest }) {
  const display = value || value === 0 ? maskBRLDisplay(value) : "";

  const handleChange = (e) => {
    const next = parseBRLInput(e.target.value);
    onChange(next);
  };

  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground pointer-events-none">
        R$
      </span>
      <Input
        inputMode="numeric"
        value={display}
        onChange={handleChange}
        placeholder={placeholder}
        className={cn("pl-10", className)}
        {...rest}
      />
    </div>
  );
}