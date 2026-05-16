import React from "react";
import { SettingsSection, TextAreaField } from "@/components/admin/SettingsField";
import ArrayFieldEditor from "@/components/admin/ArrayFieldEditor";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Upload, Loader2, X } from "lucide-react";
import { uploadFile } from "@/lib/uploadFile";
import { toast } from "sonner";
import { useState } from "react";

function LogoUploader({ value, onChange }) {
  const [uploading, setUploading] = useState(false);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await uploadFile({ file });
      onChange(file_url);
    } catch {
      toast.error("Erro no upload");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <div className="w-10 h-10 rounded-xl border-2 border-dashed border-border bg-secondary/40 flex items-center justify-center overflow-hidden">
        {value ? (
          <img src={value} alt="" className="w-full h-full object-contain p-1" />
        ) : (
          <Upload className="w-4 h-4 text-muted-foreground/40" />
        )}
      </div>
      {value ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onChange("")}
          className="h-8 px-2 text-xs"
        >
          <X className="w-3 h-3 mr-1" /> Remover
        </Button>
      ) : (
        <label className="inline-flex items-center gap-1 text-xs font-medium cursor-pointer text-muted-foreground hover:text-foreground">
          {uploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
          {uploading ? "Enviando..." : "Enviar logo"}
          <input
            type="file"
            accept="image/*"
            onChange={handleFile}
            className="hidden"
            disabled={uploading}
          />
        </label>
      )}
    </div>
  );
}

function SocialRow({
  label,
  urlValue,
  onUrlChange,
  visibleKey,
  logoKey,
  form,
  update,
  placeholder,
  helper,
}) {
  const visible = form[visibleKey] !== false;
  return (
    <div className="flex flex-col sm:flex-row gap-3 sm:items-center bg-secondary/40 rounded-xl px-4 py-3">
      <div className="sm:w-56 flex items-center justify-between sm:justify-start gap-3">
        <div className="flex items-center gap-2">
          <LogoUploader
            value={form[logoKey]}
            onChange={(v) => update(logoKey, v)}
          />
          <Label className="text-sm font-medium">{label}</Label>
        </div>
        <Switch checked={visible} onCheckedChange={(v) => update(visibleKey, v)} />
      </div>
      <div className="flex-1 space-y-1">
        <Input
          value={urlValue || ""}
          onChange={(e) => onUrlChange(e.target.value)}
          placeholder={placeholder}
          className="rounded-xl bg-background"
        />
        {helper && <p className="text-[11px] text-muted-foreground">{helper}</p>}
      </div>
    </div>
  );
}

function LinkRow({ item, onChange }) {
  const linkType = item.link_type || "domain";
  return (
    <div className="space-y-2">
      <Input
        placeholder="Rótulo (ex: Privacidade)"
        value={item.label || ""}
        onChange={(e) => onChange({ ...item, label: e.target.value })}
        className="rounded-xl"
      />
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="flex rounded-xl border border-border overflow-hidden bg-background h-9 flex-shrink-0">
          <button
            type="button"
            onClick={() => onChange({ ...item, link_type: "domain" })}
            className={`px-3 text-xs font-medium transition-colors ${
              linkType === "domain"
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Extensão do domínio
          </button>
          <button
            type="button"
            onClick={() => onChange({ ...item, link_type: "external" })}
            className={`px-3 text-xs font-medium transition-colors border-l border-border ${
              linkType === "external"
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Link direto
          </button>
        </div>
        <Input
          placeholder={
            linkType === "domain"
              ? "/sobre, /privacidade, /contato..."
              : "https://..."
          }
          value={item.url || ""}
          onChange={(e) => onChange({ ...item, url: e.target.value })}
          className="rounded-xl flex-1"
        />
      </div>
    </div>
  );
}

function LinksEditor({ value, onChange, addLabel }) {
  return (
    <ArrayFieldEditor
      items={value || []}
      onChange={onChange}
      newItem={() => ({ label: "", url: "", link_type: "domain" })}
      renderItem={(item, onItemChange) => <LinkRow item={item} onChange={onItemChange} />}
      addLabel={addLabel}
      itemLabel="Link"
    />
  );
}

function ColumnTitleFields({ form, update, titleKey, descKey, defaultTitle }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
      <Input
        placeholder={`Título da coluna (ex: ${defaultTitle})`}
        value={form[titleKey] || ""}
        onChange={(e) => update(titleKey, e.target.value)}
        className="rounded-xl"
      />
      <Input
        placeholder="Descrição (opcional, exibida abaixo do título)"
        value={form[descKey] || ""}
        onChange={(e) => update(descKey, e.target.value)}
        className="rounded-xl"
      />
    </div>
  );
}

export default function SettingsFooter({ form, update }) {
  return (
    <>
      <SettingsSection
        title="Sobre a loja"
        desc="Texto exibido na primeira coluna do rodapé. Descreva sua loja em 1–2 frases: quem você é, o que oferece e o que diferencia você. Ex: 'Veículos seminovos com laudo cautelar gratuito e 7 dias de garantia. Aceitamos seu usado como parte do pagamento.'"
      >
        <TextAreaField
          label="Texto institucional"
          value={form.footer_about}
          onChange={(v) => update("footer_about", v)}
          rows={3}
          placeholder="Ex: Plataforma inteligente para compra e venda de veículos. Transparência, segurança e agilidade em cada negócio."
        />
      </SettingsSection>

      <SettingsSection
        title="Coluna 1 — Institucional"
        desc="Links sobre a empresa: quem somos, história, missão, política de privacidade, termos de uso. Use o tipo 'Extensão do domínio' para páginas do seu site (ex: /sobre) ou 'Link direto' para endereços externos."
      >
        <ColumnTitleFields
          form={form}
          update={update}
          titleKey="footer_institutional_title"
          descKey="footer_institutional_desc"
          defaultTitle="Institucional"
        />
        <LinksEditor
          value={form.footer_institutional}
          onChange={(v) => update("footer_institutional", v)}
          addLabel="Adicionar link institucional"
        />
      </SettingsSection>

      <SettingsSection
        title="Coluna 2 — Atendimento"
        desc="Links de suporte e ajuda ao cliente: atendimento, FAQ, política de devolução, privacidade. Facilita que o cliente encontre respostas rápidas."
      >
        <ColumnTitleFields
          form={form}
          update={update}
          titleKey="footer_help_title"
          descKey="footer_help_desc"
          defaultTitle="Atendimento"
        />
        <LinksEditor
          value={form.footer_help}
          onChange={(v) => update("footer_help", v)}
          addLabel="Adicionar link de atendimento"
        />
      </SettingsSection>

      <SettingsSection
        title="Coluna 3 — Negócios"
        desc="Links comerciais: formas de pagamento, financiamento, consórcio, troca de veículos. Informe o cliente sobre as opções de compra disponíveis."
      >
        <ColumnTitleFields
          form={form}
          update={update}
          titleKey="footer_payment_title"
          descKey="footer_payment_desc"
          defaultTitle="Negócios"
        />
        <LinksEditor
          value={form.footer_payment}
          onChange={(v) => update("footer_payment", v)}
          addLabel="Adicionar link de negócios"
        />
      </SettingsSection>

      <SettingsSection
        title="Redes sociais"
        desc="Envie a logo de cada rede social — o ícone só aparece no rodapé se a logo estiver carregada E o link preenchido. Recomendado: PNG quadrado com fundo transparente, 64×64 px ou maior."
      >
        <div className="space-y-3">
          <SocialRow
            label="Instagram"
            urlValue={form.instagram_url}
            onUrlChange={(v) => update("instagram_url", v)}
            visibleKey="social_show_instagram"
            logoKey="social_logo_instagram"
            form={form}
            update={update}
            placeholder="https://instagram.com/sua-loja"
          />
          <SocialRow
            label="Facebook"
            urlValue={form.facebook_url}
            onUrlChange={(v) => update("facebook_url", v)}
            visibleKey="social_show_facebook"
            logoKey="social_logo_facebook"
            form={form}
            update={update}
            placeholder="https://facebook.com/sua-loja"
          />
          <SocialRow
            label="YouTube"
            urlValue={form.youtube_url}
            onUrlChange={(v) => update("youtube_url", v)}
            visibleKey="social_show_youtube"
            logoKey="social_logo_youtube"
            form={form}
            update={update}
            placeholder="https://youtube.com/@sua-loja"
          />
          <SocialRow
            label="TikTok"
            urlValue={form.tiktok_url}
            onUrlChange={(v) => update("tiktok_url", v)}
            visibleKey="social_show_tiktok"
            logoKey="social_logo_tiktok"
            form={form}
            update={update}
            placeholder="https://tiktok.com/@sua-loja"
          />
          <SocialRow
            label="WhatsApp"
            urlValue={form.whatsapp_number}
            onUrlChange={(v) => update("whatsapp_number", v)}
            visibleKey="social_show_whatsapp"
            logoKey="social_logo_whatsapp"
            form={form}
            update={update}
            placeholder="5511999999999"
            helper="Use o número com DDI e DDD, sem espaços (ex: 5511999999999). É o mesmo número usado no botão de contato."
          />
        </div>
      </SettingsSection>
    </>
  );
}