import React, { useState, useMemo, useRef, useEffect } from "react";
import { Check, ChevronDown, Search, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Hook to detect mobile viewport (breakpoint follows Tailwind's `md`)
function useIsMobile() {
  const [mobile, setMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth < 768 : false
  );
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const onChange = (e) => setMobile(e.matches);
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, []);
  return mobile;
}

// Searchable select.
// - On desktop, opens a popover anchored to the trigger.
// - On mobile, opens a fullscreen bottom sheet so long lists are fully scrollable.
// - When `multiple` is true, value is an array of strings; "all" is represented by [].
// - When `multiple` is false, value is a string; "all" is the placeholder option.
export default function SearchableSelect({
  value,
  onChange,
  options = [],
  placeholder = "Todos",
  disabled,
  className,
  multiple = false,
}) {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const inputRef = useRef(null);

  const handleOpenChange = (o) => {
    setOpen(o);
    if (!o) setQ("");
  };

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return options;
    return options.filter((o) => o.label.toLowerCase().includes(term));
  }, [options, q]);

  // Search input — single-tap to open keyboard, 16px font to prevent iOS auto-zoom.
  const SearchRow = (
    <div className="p-2 border-b border-border bg-background">
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
        <Input
          ref={inputRef}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Pesquisar..."
          style={{ fontSize: "16px" }}
          className="h-10 pl-9 pr-9"
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
  );

  // ---------- MULTI MODE ----------
  if (multiple) {
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

    const toggle = (val) => {
      if (selectedValues.includes(val)) {
        onChange(selectedValues.filter((v) => v !== val));
      } else {
        onChange([...selectedValues, val]);
      }
    };

    const Trigger = (
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen(true)}
        className={cn(
          "w-full h-9 rounded-lg border border-input bg-background px-3 text-sm flex items-center justify-between gap-2 hover:border-foreground/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
          className
        )}
      >
        <span className={cn("truncate", isAll && "text-muted-foreground")}>
          {display}
        </span>
        <div className="flex items-center gap-1 flex-shrink-0">
          {!isAll && (
            <span
              role="button"
              tabIndex={-1}
              onClick={(e) => { e.stopPropagation(); onChange([]); }}
              className="w-5 h-5 rounded-full hover:bg-secondary flex items-center justify-center"
              aria-label="Limpar"
            >
              <X className="w-3 h-3" />
            </span>
          )}
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        </div>
      </button>
    );

    const ListBody = (
      <div className="flex-1 overflow-y-auto overscroll-contain py-1">
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
                className="w-full px-3 py-2.5 text-left text-sm hover:bg-secondary flex items-center gap-2.5"
              >
                <span
                  className={cn(
                    "w-5 h-5 rounded border flex items-center justify-center flex-shrink-0",
                    checked ? "bg-primary border-primary text-primary-foreground" : "border-input"
                  )}
                >
                  {checked && <Check className="w-3.5 h-3.5" />}
                </span>
                <span className="truncate">{opt.label}</span>
              </button>
            );
          })
        )}
      </div>
    );

    if (isMobile) {
      return (
        <>
          {Trigger}
          <Sheet open={open} onOpenChange={handleOpenChange}>
            <SheetContent
              side="bottom"
              className="p-0 h-[85vh] flex flex-col rounded-t-3xl"
            >
              <SheetHeader className="px-4 pt-4 pb-2 text-left">
                <SheetTitle className="text-base font-display">{placeholder}</SheetTitle>
              </SheetHeader>
              {SearchRow}
              {ListBody}
              <div className="border-t border-border p-3 flex gap-2">
                {!isAll && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onChange([])}
                    className="flex-1 rounded-full"
                  >
                    Limpar
                  </Button>
                )}
                <Button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="flex-1 rounded-full"
                >
                  Concluir
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </>
      );
    }

    return (
      <Popover open={open} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>{Trigger}</PopoverTrigger>
        <PopoverContent
          className="p-0 w-[--radix-popover-trigger-width] flex flex-col max-h-[min(70vh,520px)]"
          align="start"
          sideOffset={4}
          collisionPadding={12}
        >
          {SearchRow}
          {ListBody}
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
        </PopoverContent>
      </Popover>
    );
  }

  // ---------- SINGLE MODE ----------
  const selected = options.find((o) => o.value === value);
  const display = !value || value === "all" ? placeholder : (selected?.label || placeholder);

  const Trigger = (
    <button
      type="button"
      disabled={disabled}
      onClick={() => !disabled && setOpen(true)}
      className={cn(
        "w-full h-9 rounded-lg border border-input bg-background px-3 text-sm flex items-center justify-between gap-2 hover:border-foreground/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
        className
      )}
    >
      <span className={cn("truncate", (!value || value === "all") && "text-muted-foreground")}>
        {display}
      </span>
      <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
    </button>
  );

  const SingleListBody = (
    <div className="flex-1 overflow-y-auto overscroll-contain py-1">
      <button
        type="button"
        onClick={() => { onChange("all"); setOpen(false); }}
        className={cn(
          "w-full px-3 py-2.5 text-left text-sm hover:bg-secondary flex items-center justify-between",
          (!value || value === "all") && "font-medium"
        )}
      >
        <span>{placeholder}</span>
        {(!value || value === "all") && <Check className="w-3.5 h-3.5" />}
      </button>
      {filtered.length === 0 ? (
        <div className="px-3 py-4 text-xs text-muted-foreground text-center">
          Nenhum resultado
        </div>
      ) : (
        filtered.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => { onChange(opt.value); setOpen(false); }}
            className={cn(
              "w-full px-3 py-2.5 text-left text-sm hover:bg-secondary flex items-center justify-between",
              value === opt.value && "font-medium"
            )}
          >
            <span className="truncate">{opt.label}</span>
            {value === opt.value && <Check className="w-3.5 h-3.5 flex-shrink-0" />}
          </button>
        ))
      )}
    </div>
  );

  if (isMobile) {
    return (
      <>
        {Trigger}
        <Sheet open={open} onOpenChange={handleOpenChange}>
          <SheetContent
            side="bottom"
            className="p-0 h-[85vh] flex flex-col rounded-t-3xl"
          >
            <SheetHeader className="px-4 pt-4 pb-2 text-left">
              <SheetTitle className="text-base font-display">{placeholder}</SheetTitle>
            </SheetHeader>
            {SearchRow}
            {SingleListBody}
          </SheetContent>
        </Sheet>
      </>
    );
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>{Trigger}</PopoverTrigger>
      <PopoverContent
        className="p-0 w-[--radix-popover-trigger-width] flex flex-col max-h-[min(70vh,520px)]"
        align="start"
        sideOffset={4}
        collisionPadding={12}
      >
        {SearchRow}
        {SingleListBody}
      </PopoverContent>
    </Popover>
  );
}