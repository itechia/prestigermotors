import React, { useMemo, useState, useEffect } from "react";
import { Slider } from "@/components/ui/slider";
import { formatCurrency } from "@/lib/formatters";
import { maskBRLDisplay, parseBRLInput } from "@/lib/brl";
import { Input } from "@/components/ui/input";

// Dual-handle range slider for the price filter, with editable BRL inputs.
// Input behavior mirrors BrlInput: free typing while focused, formatted on blur.
// Stores 0 to mean "no bound". Bounds are derived from the vehicles list.
export default function PriceRangeSlider({ min, max, onChange, vehicles = [] }) {
  const { lowerBound, upperBound, step } = useMemo(() => {
    const prices = vehicles.map((v) => Number(v.price) || 0).filter((p) => p > 0);
    if (prices.length === 0) {
      return { lowerBound: 0, upperBound: 500000, step: 5000 };
    }
    const top = Math.max(...prices);
    const bottom = Math.min(...prices);
    const stepValue = top > 200000 ? 5000 : 1000;
    const roundUp = top > 200000 ? 50000 : 10000;
    const roundDown = top > 200000 ? 50000 : 10000;
    return {
      lowerBound: Math.max(0, Math.floor(bottom / roundDown) * roundDown),
      upperBound: Math.ceil(top / roundUp) * roundUp,
      step: stepValue,
    };
  }, [vehicles]);

  const lo = min > 0 ? Math.max(min, lowerBound) : lowerBound;
  const hi = max > 0 ? Math.min(max, upperBound) : upperBound;

  // Local raw text while focused — avoids cursor-jump on every keystroke
  const [loRaw, setLoRaw] = useState("");
  const [hiRaw, setHiRaw] = useState("");
  const [loFocused, setLoFocused] = useState(false);
  const [hiFocused, setHiFocused] = useState(false);

  // Keep formatted display in sync when slider moves (only when not focused)
  useEffect(() => { if (!loFocused) setLoRaw(maskBRLDisplay(lo)); }, [lo, loFocused]);
  useEffect(() => { if (!hiFocused) setHiRaw(maskBRLDisplay(hi)); }, [hi, hiFocused]);

  const emit = (a, b) => {
    onChange({
      priceMin: a <= lowerBound ? 0 : a,
      priceMax: b >= upperBound ? 0 : b,
    });
  };

  const handleSlider = ([a, b]) => emit(a, b);

  return (
    <div className="space-y-2.5 px-1">
      <Slider
        min={lowerBound}
        max={upperBound}
        step={step}
        value={[lo, hi]}
        onValueChange={handleSlider}
      />
      <div className="grid grid-cols-2 gap-2">
        {/* Mínimo */}
        <div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Mínimo</div>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground pointer-events-none">R$</span>
            <Input
              value={loFocused ? loRaw : maskBRLDisplay(lo)}
              inputMode="numeric"
              className="h-9 pl-9"
              onFocus={() => {
                setLoFocused(true);
                setLoRaw(lo > lowerBound ? String(Math.round(lo)) : "");
              }}
              onChange={(e) => setLoRaw(e.target.value.replace(/[^\d,]/g, ""))}
              onBlur={() => {
                setLoFocused(false);
                const parsed = parseBRLInput(loRaw) || lowerBound;
                emit(parsed, hi);
              }}
              onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
              placeholder={maskBRLDisplay(lowerBound)}
            />
          </div>
        </div>

        {/* Máximo */}
        <div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 text-right">
            Máximo {hi >= upperBound && <span className="opacity-60">(+)</span>}
          </div>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground pointer-events-none">R$</span>
            <Input
              value={hiFocused ? hiRaw : maskBRLDisplay(hi)}
              inputMode="numeric"
              className="h-9 pl-9 text-right"
              onFocus={() => {
                setHiFocused(true);
                setHiRaw(hi < upperBound ? String(Math.round(hi)) : "");
              }}
              onChange={(e) => setHiRaw(e.target.value.replace(/[^\d,]/g, ""))}
              onBlur={() => {
                setHiFocused(false);
                const parsed = parseBRLInput(hiRaw) || upperBound;
                emit(lo, parsed);
              }}
              onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
              placeholder={maskBRLDisplay(upperBound)}
            />
          </div>
        </div>
      </div>
      <div className="flex justify-between text-[10px] text-muted-foreground">
        <span>{formatCurrency(lowerBound)}</span>
        <span>{formatCurrency(upperBound)}+</span>
      </div>
    </div>
  );
}
