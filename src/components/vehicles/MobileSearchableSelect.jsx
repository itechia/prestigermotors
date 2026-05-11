import React, { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, ChevronUp, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

// Mobile-friendly version of SearchableSelect that expands INLINE (no Popover).
// Solves two issues that happen with Popover-inside-Sheet on mobile:
//  - "double tap to open" (the first tap closes the sheet's outside-detector)
//  - inability to scroll the full list while a global drawer is also scrollable
//
// Visual API matches SearchableSelect, but only `multiple` mode is implemented
// here because the filters sheet uses multi-select everywhere.
export default function MobileSearchableSelect({
  value,
  onChange,
  options = [],
  placeholder = "Todos",
  disabled,
  className,
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const inputRef = useRef(null);

  // When the dropdown opens, focus the search input on the next tick so the
  // mobile keyboard pops up immediately — no second tap required.
  useEffect(() => {
    if (open) {
      const t = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(t);
    }
  }, [open]);

  const selectedValues = Array.isArray(value) ? value : [];
  const isAll = selectedValues.length === 0;
  const selectedLabels = options
    .filter((o) => selectedValues.includes(o.value))
    .map((o) => o.label);

  const display = isAll
    ? placeholder
    : selectedLabels.length === 1
    ? selectedLabels[0]
    : `${selectedLabels.length} selecionados`;

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return options;
    return options.filter((o) => o.label.toLowerCase().includes(term));
  }, [options, q]);

  const toggle = (val) => {
    if (selectedValues.includes(val)) {
      onChange(selectedValues.filter((v) => v !== val));
    } else {
      onChange([...selectedValues, val]);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setQ("");
  };

  return (
    <div className={cn("w-full", className)}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => (open ? handleClose() : setOpen(true))}
        className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm flex items-center justify-between gap-2 hover:border-foreground/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span className={cn("truncate", isAll && "text-muted-foreground")}>
          {display}
        </span>
        <div className="flex items-center gap-1 flex-shrink-0">
          {!isAll && (
            <span
              role="button"
              tabIndex={-1}
              onClick={(e) => {
                e.stopPropagation();
                onChange([]);
              }}
              className="w-5 h-5 rounded-full hover:bg-secondary flex items-center justify-center"
              aria-label="Limpar"
            >
              <X className="w-3 h-3" />
            </span>
          )}
          {open ? (
            <ChevronUp className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          )}
        </div>
      </button>

      {open && (
        <div className="mt-2 rounded-xl border border-border bg-background overflow-hidden">
          {/* Search row — auto-focused on open, so the keyboard pops up
              immediately. 16px font prevents iOS auto-zoom. */}
          <div className="p-2 border-b border-border">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
              <Input
                ref={inputRef}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Pesquisar..."
                autoFocus
                style={{ fontSize: "16px" }}
                className="h-9 pl-9 pr-9"
              />
              {q && (
                <button
                  type="button"
                  onClick={() => setQ("")}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground"
                  aria-label="Limpar pesquisa"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Options list — scrolls inside its own container, so the user can
              browse long lists without fighting the parent Sheet scroll. */}
          <div className="max-h-72 overflow-y-auto overscroll-contain py-1">
            {filtered.length === 0 ? (
              <div className="px-3 py-4 text-xs text-muted-foreground text-center">
                Nenhum resultado
              </div>
            ) : (
              filtered.map((opt) => {
                const checked = selectedValues.includes(opt.value);
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => toggle(opt.value)}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-secondary flex items-center gap-2"
                  >
                    <span
                      className={cn(
                        "w-4 h-4 rounded border flex items-center justify-center flex-shrink-0",
                        checked
                          ? "bg-primary border-primary text-primary-foreground"
                          : "border-input"
                      )}
                    >
                      {checked && <Check className="w-3 h-3" />}
                    </span>
                    <span className="truncate">{opt.label}</span>
                  </button>
                );
              })
            )}
          </div>

          {!isAll && (
            <div className="border-t border-border p-2">
              <button
                type="button"
                onClick={() => onChange([])}
                className="w-full text-xs text-muted-foreground hover:text-foreground py-1"
              >
                Limpar seleção
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}