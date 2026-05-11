import React from "react";
import { SettingsSection, TextField } from "../SettingsField";
import ArrayFieldEditor from "../ArrayFieldEditor";
import IconSelect from "../IconSelect";
// trust_items (barra de confiança) foi removida — só exibe a seção de garantias

export default function SettingsTrust({ form, update }) {
  return (
    <>
      <SettingsSection
        title="Seção de garantias"
        desc="Bloco escuro mostrado nas páginas de veículo"
      >
        <TextField
          label="Título da seção"
          value={form.guarantee_section_title}
          onChange={(v) => update("guarantee_section_title", v)}
          placeholder="Compre sem medo"
        />
        <TextField
          label="Subtítulo"
          value={form.guarantee_section_subtitle}
          onChange={(v) => update("guarantee_section_subtitle", v)}
          placeholder="Todo carro passa por check-list de 140 pontos..."
        />
        <ArrayFieldEditor
          items={form.guarantees || []}
          onChange={(v) => update("guarantees", v)}
          newItem={() => ({ icon: "shield", title: "", desc: "" })}
          itemLabel="Garantia"
          addLabel="Adicionar garantia"
          renderItem={(item, onChange) => (
            <div className="grid sm:grid-cols-[140px_1fr_1fr] gap-3">
              <IconSelect
                value={item.icon}
                onChange={(v) => onChange({ ...item, icon: v })}
              />
              <TextField
                label="Título"
                value={item.title}
                onChange={(v) => onChange({ ...item, title: v })}
                placeholder="Vistoria completa"
              />
              <TextField
                label="Descrição"
                value={item.desc}
                onChange={(v) => onChange({ ...item, desc: v })}
                placeholder="140 itens checados..."
              />
            </div>
          )}
        />
      </SettingsSection>
    </>
  );
}