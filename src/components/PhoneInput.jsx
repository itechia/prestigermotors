import React, { useMemo, useState } from "react";
import { ChevronDown, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

// A compact list of common countries with dial codes. Editable as the app grows.
export const COUNTRIES = [
  { code: "BR", flag: "🇧🇷", name: "Brasil", dial: "+55" },
  { code: "PT", flag: "🇵🇹", name: "Portugal", dial: "+351" },
  { code: "US", flag: "🇺🇸", name: "Estados Unidos", dial: "+1" },
  { code: "AR", flag: "🇦🇷", name: "Argentina", dial: "+54" },
  { code: "CL", flag: "🇨🇱", name: "Chile", dial: "+56" },
  { code: "CO", flag: "🇨🇴", name: "Colômbia", dial: "+57" },
  { code: "MX", flag: "🇲🇽", name: "México", dial: "+52" },
  { code: "PY", flag: "🇵🇾", name: "Paraguai", dial: "+595" },
  { code: "UY", flag: "🇺🇾", name: "Uruguai", dial: "+598" },
  { code: "PE", flag: "🇵🇪", name: "Peru", dial: "+51" },
  { code: "ES", flag: "🇪🇸", name: "Espanha", dial: "+34" },
  { code: "FR", flag: "🇫🇷", name: "França", dial: "+33" },
  { code: "DE", flag: "🇩🇪", name: "Alemanha", dial: "+49" },
  { code: "IT", flag: "🇮🇹", name: "Itália", dial: "+39" },
  { code: "GB", flag: "🇬🇧", name: "Reino Unido", dial: "+44" },
  { code: "JP", flag: "🇯🇵", name: "Japão", dial: "+81" },
  { code: "CN", flag: "🇨🇳", name: "China", dial: "+86" },
];

// `value` is the full E.164-style string (e.g. "+5511999999999"). The component
// splits it visually into [dial code | local number] but stores it joined.
export default function PhoneInput({ value = "", onChange, placeholder, required }) {
  const initial = useMemo(() => parsePhone(value), [value]);
  const [country, setCountry] = useState(initial.country);
  const [local, setLocal] = useState(initial.local);
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");

  const update = (nextCountry, nextLocal) => {
    setCountry(nextCountry);
    setLocal(nextLocal);
    const digits = nextLocal.replace(/\D/g, "");
    onChange?.(digits ? `${nextCountry.dial}${digits}` : "");
  };

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return COUNTRIES;
    return COUNTRIES.filter(
      (c) =>
        c.name.toLowerCase().includes(t) ||
        c.dial.includes(t) ||
        c.code.toLowerCase().includes(t)
    );
  }, [q]);

  return (
    <div className="flex gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="h-11 px-3 rounded-xl border border-input bg-background flex items-center gap-1.5 hover:border-foreground/30 transition-colors flex-shrink-0"
          >
            <span className="text-base leading-none">{country.flag}</span>
            <span className="text-sm font-medium">{country.dial}</span>
            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="p-0 w-72" align="start">
          <div className="p-2 border-b border-border">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="País ou código..."
                className="h-8 pl-8 text-sm"
              />
            </div>
          </div>
          <div className="max-h-64 overflow-y-auto py-1">
            {filtered.map((c) => (
              <button
                key={c.code}
                type="button"
                onClick={() => {
                  update(c, local);
                  setOpen(false);
                  setQ("");
                }}
                className={cn(
                  "w-full px-3 py-2 text-left text-sm hover:bg-secondary flex items-center gap-2",
                  c.code === country.code && "bg-secondary/60"
                )}
              >
                <span className="text-base">{c.flag}</span>
                <span className="flex-1 truncate">{c.name}</span>
                <span className="text-muted-foreground text-xs">{c.dial}</span>
              </button>
            ))}
            {filtered.length === 0 && (
              <div className="px-3 py-4 text-xs text-muted-foreground text-center">
                Nenhum país encontrado
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>

      <Input
        type="tel"
        inputMode="tel"
        required={required}
        value={local}
        onChange={(e) => update(country, e.target.value)}
        placeholder={placeholder || "(11) 99999-9999"}
        className="h-11 rounded-xl flex-1"
      />
    </div>
  );
}

function parsePhone(value) {
  const v = (value || "").trim();
  if (!v) return { country: COUNTRIES[0], local: "" };
  // Try to find a country whose dial code prefixes the value (longest match first).
  const sorted = [...COUNTRIES].sort((a, b) => b.dial.length - a.dial.length);
  const found = sorted.find((c) => v.startsWith(c.dial));
  if (found) {
    return { country: found, local: v.slice(found.dial.length) };
  }
  return { country: COUNTRIES[0], local: v.replace(/^\+/, "") };
}