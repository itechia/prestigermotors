import React from "react";
import { Plus, Trash2, ArrowUp, ArrowDown } from "lucide-react";
import { SettingsSection } from "../SettingsField";
import LogoUploadField from "../LogoUploadField";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function SettingsBrands({ form, update }) {
  const brands = form.brands || [];

  const setBrands = (next) => update("brands", next);
  const updateBrand = (i, patch) => {
    const next = [...brands];
    next[i] = { ...next[i], ...patch };
    setBrands(next);
  };
  const remove = (i) => setBrands(brands.filter((_, idx) => idx !== i));
  const move = (i, dir) => {
    const t = i + dir;
    if (t < 0 || t >= brands.length) return;
    const next = [...brands];
    [next[i], next[t]] = [next[t], next[i]];
    setBrands(next);
  };
  const add = () => setBrands([...brands, { name: "", logo_url: "" }]);

  return (
    <SettingsSection
      title="Marcas em destaque"
      desc="Filtro rápido por marca exibido na home. Use o nome exato da marca conforme cadastrado nos veículos para que o filtro funcione."
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {brands.map((brand, i) => (
          <div
            key={i}
            className="bg-secondary/40 rounded-2xl p-3 border border-border/60 flex flex-col gap-3"
          >
            {/* Header com prévia + ações */}
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-full bg-card border border-border flex items-center justify-center overflow-hidden flex-shrink-0">
                {brand.logo_url ? (
                  <img
                    src={brand.logo_url}
                    alt={brand.name}
                    className="w-9 h-9 object-contain"
                  />
                ) : (
                  <span className="font-display font-bold text-base text-muted-foreground">
                    {(brand.name || "?").charAt(0).toUpperCase()}
                  </span>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Marca {i + 1}
                </div>
                <div className="text-sm font-medium truncate">
                  {brand.name || "Sem nome"}
                </div>
              </div>

              <div className="flex flex-col gap-0.5">
                <button
                  type="button"
                  onClick={() => move(i, -1)}
                  disabled={i === 0}
                  className="w-6 h-6 rounded-md hover:bg-background flex items-center justify-center disabled:opacity-30"
                  aria-label="Mover acima"
                >
                  <ArrowUp className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={() => move(i, 1)}
                  disabled={i === brands.length - 1}
                  className="w-6 h-6 rounded-md hover:bg-background flex items-center justify-center disabled:opacity-30"
                  aria-label="Mover abaixo"
                >
                  <ArrowDown className="w-3 h-3" />
                </button>
              </div>

              <button
                type="button"
                onClick={() => remove(i)}
                className="w-7 h-7 rounded-lg hover:bg-destructive/10 text-destructive flex items-center justify-center"
                aria-label="Remover"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Nome */}
            <div className="space-y-1">
              <Label className="text-[11px] font-semibold">Nome</Label>
              <Input
                value={brand.name ?? ""}
                onChange={(e) => updateBrand(i, { name: e.target.value })}
                placeholder="Ex: Toyota"
                className="h-9 rounded-lg text-sm"
              />
            </div>

            {/* Logo compacto */}
            <LogoUploadField
              label="Logo"
              value={brand.logo_url}
              onChange={(v) => updateBrand(i, { logo_url: v })}
              shape="circle"
              size={48}
              showUrlInput={false}
              hint="256 × 256 px, PNG transparente, até 100 KB."
            />
          </div>
        ))}

        {/* Add card */}
        <button
          type="button"
          onClick={add}
          className="rounded-2xl border-2 border-dashed border-border min-h-[180px] flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-foreground hover:bg-secondary/40 transition-colors"
        >
          <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
            <Plus className="w-5 h-5" />
          </div>
          <span className="text-sm font-medium">Adicionar marca</span>
        </button>
      </div>
    </SettingsSection>
  );
}