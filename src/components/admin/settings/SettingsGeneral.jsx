import React from "react";
import { SettingsSection, TextField, TextAreaField } from "../SettingsField";
import LogoUploadField from "../LogoUploadField";
import FontSelectField from "../FontSelectField";
import HeaderPreview from "../HeaderPreview";

export default function SettingsGeneral({ form, update }) {
  return (
    <>
      <SettingsSection
        title="Identidade da loja"
        desc="Nome, logo e fonte. Aparece no cabeçalho do site, na aba do navegador e no favicon."
      >
        <HeaderPreview
          name={form.store_name}
          logoUrl={form.logo_url}
          fontFamily={form.store_name_font}
        />

        <div className="grid sm:grid-cols-2 gap-4 pt-2">
          <TextField
            label="Nome da loja"
            value={form.store_name}
            onChange={(v) => update("store_name", v)}
            placeholder="Ex: Automatizei AI"
          />
          <TextField
            label="Slogan"
            value={form.store_tagline}
            onChange={(v) => update("store_tagline", v)}
            placeholder="Ex: Veículos selecionados com inteligência."
          />
        </div>

        <FontSelectField
          label="Fonte do nome da loja"
          value={form.store_name_font}
          onChange={(v) => update("store_name_font", v)}
          sampleText={form.store_name || "Sua loja"}
          hint="Aplicada no cabeçalho do site e no título da aba."
        />

        <LogoUploadField
          label="Logo da loja"
          value={form.logo_url}
          onChange={(v) => update("logo_url", v)}
          shape="square"
          size={72}
          hint="Tamanho recomendado: 512 × 512 px (quadrado, PNG transparente, até 200 KB). Aparece no canto superior esquerdo do site, no favicon e no ícone do app."
        />
      </SettingsSection>

      <SettingsSection title="Contato" desc="Como os clientes falam com a loja">
        <div className="grid sm:grid-cols-2 gap-4">
          <TextField
            label="WhatsApp"
            value={form.whatsapp_number}
            onChange={(v) => update("whatsapp_number", v)}
            placeholder="5511999999999"
            hint="Só números, com DDI e DDD (ex: 5511999999999)"
          />
          <TextField
            label="Telefone"
            value={form.phone_number}
            onChange={(v) => update("phone_number", v)}
            placeholder="+551199999999"
          />
        </div>
        <TextAreaField
          label="Endereço"
          value={form.address}
          onChange={(v) => update("address", v)}
          placeholder="Rua, número, cidade"
          rows={2}
        />
      </SettingsSection>
    </>
  );
}