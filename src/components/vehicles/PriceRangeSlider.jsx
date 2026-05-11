import React, { useMemo, useState, useEffect } from "react";
import { Slider } from "@/components/ui/slider";
import { formatCurrency } from "@/lib/formatters";
import { maskBRLDisplay, parseBRLInput } from "@/lib/brl";
import { Input } from "@/components/ui/input";

// Dual-handle range slider for the price filter, with editable inputs.
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

  // Local text state so users can type freely without each keystroke fighting the mask
  const [loText, setLoText] = useState(maskBRLDisplay(lo));
  const [hiText, setHiText] = useState(maskBRLDisplay(hi));
  useEffect(() => setLoText(maskBRLDisplay(lo)), [lo]);
  useEffect(() => setHiText(maskBRLDisplay(hi)), [hi]);

  const emit = (a, b) => {
    const clampedA = Math.max(lowerBound, Math.min(a, b));
    const clampedB = Math.min(upperBound, Math.max(b, clampedA));
    onChange({
      // When the lower handle is at the very bottom, store 0 (no bound)
      priceMin: clampedA <= lowerBound ? 0 : clampedA,
      // When the upper handle is at the very top, store 0 (no bound)
      priceMax: clampedB >= upperBound ? 0 : clampedB,
    });
  };

  const handleSlider = ([a, b]) => emit(a, b);

  const commitLo = () => {
    const parsed = parseBRLInput(loText) || lowerBound;
    emit(parsed, hi);
  };
  const commitHi = () => {
    const parsed = parseBRLInput(hiText) || upperBound;
    emit(lo, parsed);
  };

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
        <div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Mínimo</div>
          <Input
            value={loText}
            onChange={(e) => setLoText(maskBRLDisplay(parseBRLInput(e.target.value)))}
            onBlur={commitLo}
            onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
            inputMode="numeric"
            className="h-9 text-sm"
          />
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 text-right">
            Máximo {hi >= upperBound && <span className="opacity-60">(+)</span>}
          </div>
          <Input
            value={hiText}
            onChange={(e) => setHiText(maskBRLDisplay(parseBRLInput(e.target.value)))}
            onBlur={commitHi}
            onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
            inputMode="numeric"
            className="h-9 text-sm text-right"
          />
        </div>
      </div>
      <div className="flex justify-between text-[10px] text-muted-foreground">
        <span>{formatCurrency(lowerBound)}</span>
        <span>{formatCurrency(upperBound)}+</span>
      </div>
    </div>
  );
}