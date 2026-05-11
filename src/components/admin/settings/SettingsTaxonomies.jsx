import React, { useState } from "react";
import { Car, Layers, Boxes, Palette, Fuel, Settings2, BadgeCheck } from "lucide-react";
import { SettingsSection } from "../SettingsField";
import SimpleListEditor from "../SimpleListEditor";
import { slugify } from "@/lib/useTaxonomies";
import { cn } from "@/lib/utils";

// Sub-tabs inside the "Categorias" admin tab — keeps each list focused.
const SUB_TABS = [
  { id: "vehicle_types", label: "Tipos", icon: Car },
  { id: "categories", label: "Categorias", icon: Layers },
  { id: "models", label: "Modelos", icon: Boxes },
  { id: "colors", label: "Cores", icon: Palette },
  { id: "fuels", label: "Combustíveis", icon: Fuel },
  { id: "transmissions", label: "Câmbios", icon: Settings2 },
  { id: "conditions", label: "Condições", icon: BadgeCheck },
];

export default function SettingsTaxonomies({ form, update }) {
  const [sub, setSub] = useState("vehicle_types");

  const brandOptions = (form.brands || [])
    .filter((b) => b && b.name)
    .map((b) => ({ label: b.name, value: slugify(b.name) }));

  return (
    <div className="space-y-4">
      {/* Sub-tabs */}
      <div className="flex gap-1 overflow-x-auto scrollbar-hide bg-secondary/40 rounded-2xl p-1">
        {SUB_TABS.map((t) => {
          const Icon = t.icon;
          const active = sub === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setSub(t.id)}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors",
                active
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="w-4 h-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {sub === "vehicle_types" && (
        <SettingsSection
          title="Tipos de veículo"
          desc="Defina os tipos que sua loja vende. Vira o primeiro filtro do catálogo. Ex: Carro, Moto, Caminhão, Jet Ski."
        >
          <SimpleListEditor
            items={form.tax_vehicle_types || []}
            onChange={(v) => update("tax_vehicle_types", v)}
            placeholder="Ex: Carro"
          />
        </SettingsSection>
      )}

      {sub === "categories" && (
        <SettingsSection
          title="Categorias"
          desc="Antes chamado de carroceria. Ex: Sedan, SUV, Hatch, Naked, Esportiva."
        >
          <SimpleListEditor
            items={form.tax_categories || []}
            onChange={(v) => update("tax_categories", v)}
            placeholder="Ex: Sedan"
          />
        </SettingsSection>
      )}

      {sub === "models" && (
        <SettingsSection
          title="Modelos"
          desc="Cadastre os modelos vinculados às marcas. O cadastro de veículos vai filtrar automaticamente os modelos pela marca selecionada."
        >
          {brandOptions.length === 0 ? (
            <div className="text-sm text-muted-foreground bg-secondary/40 rounded-xl p-4">
              Cadastre as marcas primeiro na aba <strong>Marcas</strong> para poder vincular modelos.
            </div>
          ) : (
            <SimpleListEditor
              items={form.tax_models || []}
              onChange={(v) => update("tax_models", v)}
              placeholder="Ex: Civic"
              parentOptions={brandOptions}
              parentLabel="Marca"
            />
          )}
        </SettingsSection>
      )}

      {sub === "colors" && (
        <SettingsSection title="Cores" desc="Cores que aparecerão no cadastro e nos filtros.">
          <SimpleListEditor
            items={form.tax_colors || []}
            onChange={(v) => update("tax_colors", v)}
            placeholder="Ex: Branco"
          />
        </SettingsSection>
      )}

      {sub === "fuels" && (
        <SettingsSection title="Combustíveis" desc="Tipos de combustível disponíveis.">
          <SimpleListEditor
            items={form.tax_fuels || []}
            onChange={(v) => update("tax_fuels", v)}
            placeholder="Ex: Flex"
          />
        </SettingsSection>
      )}

      {sub === "transmissions" && (
        <SettingsSection title="Câmbios" desc="Tipos de transmissão.">
          <SimpleListEditor
            items={form.tax_transmissions || []}
            onChange={(v) => update("tax_transmissions", v)}
            placeholder="Ex: Automático"
          />
        </SettingsSection>
      )}

      {sub === "conditions" && (
        <SettingsSection title="Condições" desc="Ex: Novo, Seminovo, Usado.">
          <SimpleListEditor
            items={form.tax_conditions || []}
            onChange={(v) => update("tax_conditions", v)}
            placeholder="Ex: Seminovo"
          />
        </SettingsSection>
      )}
    </div>
  );
}