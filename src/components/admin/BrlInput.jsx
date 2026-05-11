import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { maskBRLDisplay, parseBRLInput } from "@/lib/brl";

// BRL input: edição livre enquanto focado, formatação ao perder o foco.
// Evita o cursor pulando por causa da re-formatação a cada tecla.
export default function BrlInput({ value, onChange, placeholder = "0,00", className, ...rest }) {
  const [focused, setFocused] = useState(false);
  const [raw, setRaw] = useState("");

  // Atualiza exibição quando o valor externo muda (ex: reset do form)
  useEffect(() => {
    if (!focused) {
      setRaw(value ? maskBRLDisplay(value) : "");
    }
  }, [value, focused]);

  const handleFocus = (e) => {
    setFocused(true);
    // Mostra sem separadores de milhar para facilitar a edição
    if (value && value !== 0) {
      const reais = Math.floor(value);
      const cents = Math.round((value - reais) * 100);
      setRaw(cents > 0 ? `${reais},${String(cents).padStart(2, "0")}` : String(reais));
    } else {
      setRaw("");
    }
    setTimeout(() => e.target.select(), 0);
  };

  const handleChange = (e) => {
    // Permite apenas dígitos e vírgula
    const clean = e.target.value.replace(/[^\d,]/g, "");
    setRaw(clean);
  };

  const handleBlur = () => {
    setFocused(false);
    const parsed = parseBRLInput(raw);
    onChange(parsed);
    setRaw(parsed ? maskBRLDisplay(parsed) : "");
  };

  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground pointer-events-none">
        R$
      </span>
      <Input
        inputMode="numeric"
        value={raw}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={placeholder}
        className={cn("pl-10", className)}
        {...rest}
      />
    </div>
  );
}