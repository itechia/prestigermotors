import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/api/supabaseClient";
import { uploadFile } from "@/lib/uploadFile";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Upload, Loader2, X, Send, AlertCircle } from "lucide-react";
import BrlInput from "@/components/admin/BrlInput";
import PhoneInput from "@/components/PhoneInput";
import { track } from "@/lib/analytics";

const INITIAL = {
  owner_name: "",
  owner_email: "",
  owner_phone: "",          // full E.164 phone (e.g. "+5511999999999")
  owner_phone_confirm: "",  // confirmation copy
  owner_city: "",
  vehicle_type: "",         // generic — Carro, Moto, Caminhão, etc.
  brand: "",
  model: "",
  version: "",
  year: "",
  manufacture_year: "",
  mileage: "",
  fuel_type: "",
  transmission: "",
  color: "",
  condition_notes: "",
  asking_price: 0,
  images: [],
};

function buildInitial(defaultValues = {}) {
  return {
    ...INITIAL,
    owner_name: defaultValues.name || "",
    owner_phone: defaultValues.phone || "",
    owner_phone_confirm: defaultValues.phone || "",
  };
}

export default function SellLeadForm({ defaultValues = {} }) {
  const router = useRouter();
  const [form, setForm] = useState(() => buildInitial(defaultValues));
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  // Erros por campo — exibidos abaixo de cada input, não só em toast.
  const [errors, setErrors] = useState({});
  const formRef = useRef(null);

  const update = (key, value) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  useEffect(() => {
    setForm((current) => ({
      ...current,
      owner_name: current.owner_name || defaultValues.name || "",
      owner_phone: current.owner_phone || defaultValues.phone || "",
      owner_phone_confirm: current.owner_phone_confirm || defaultValues.phone || "",
    }));
  }, [defaultValues]);

  const handleFiles = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setUploading(true);
    try {
      const uploads = await Promise.all(
        files.map((file) => uploadFile({ file }))
      );
      const urls = uploads.map((u) => u.file_url);
      update("images", [...(form.images || []), ...urls]);
    } catch (err) {
      const message = err?.message || "Não conseguimos enviar as fotos. Tente novamente.";
      setErrors((prev) => ({ ...prev, images: message }));
      toast.error(message);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const removeImage = (idx) =>
    update("images", form.images.filter((_, i) => i !== idx));

  const phonesMatch =
    form.owner_phone && form.owner_phone === form.owner_phone_confirm;

  // Validação campo a campo — a mensagem aparece junto do input com problema.
  const validate = () => {
    const next = {};
    const currentYear = new Date().getFullYear();

    if (!form.owner_name.trim()) next.owner_name = "Informe o seu nome completo.";
    else if (form.owner_name.trim().length < 3) next.owner_name = "Nome muito curto.";

    const phoneDigits = (form.owner_phone || "").replace(/D/g, "");
    if (!phoneDigits) next.owner_phone = "Informe um telefone para contato.";
    else if (phoneDigits.length < 12) next.owner_phone = "Telefone incompleto. Inclua o DDD.";

    if (!form.owner_phone_confirm) next.owner_phone_confirm = "Confirme o telefone digitado.";
    else if (form.owner_phone !== form.owner_phone_confirm)
      next.owner_phone_confirm = "Os números não conferem.";

    if (form.owner_email && !/^[^s@]+@[^s@]+.[^s@]{2,}$/.test(form.owner_email))
      next.owner_email = "E-mail inválido. Exemplo: voce@exemplo.com";

    if (!form.brand.trim()) next.brand = "Informe a marca do veículo.";
    if (!form.model.trim()) next.model = "Informe o modelo do veículo.";

    const year = Number(form.year);
    if (!form.year) next.year = "Informe o ano do modelo.";
    else if (!year || year < 1950 || year > currentYear + 1)
      next.year = `Ano inválido. Use um valor entre 1950 e ${currentYear + 1}.`;

    if (form.manufacture_year) {
      const mYear = Number(form.manufacture_year);
      if (!mYear || mYear < 1950 || mYear > currentYear + 1)
        next.manufacture_year = "Ano de fabricação inválido.";
    }

    if (form.mileage && Number(form.mileage) < 0)
      next.mileage = "A quilometragem não pode ser negativa.";

    if (!form.asking_price || form.asking_price <= 0)
      next.asking_price = "Informe quanto você pretende receber.";

    if (!form.images || form.images.length === 0)
      next.images = "Envie ao menos uma foto do veículo.";

    return next;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const found = validate();
    setErrors(found);
    const keys = Object.keys(found);
    if (keys.length > 0) {
      toast.error(
        keys.length === 1
          ? found[keys[0]]
          : `Revise ${keys.length} campos destacados em vermelho.`
      );
      const firstField = formRef.current?.querySelector('[aria-invalid="true"]');
      if (firstField) {
        firstField.scrollIntoView({ behavior: "smooth", block: "center" });
        if (typeof firstField.focus === "function") firstField.focus({ preventScroll: true });
      }
      return;
    }

    setSubmitting(true);
    try {
      const now = new Date().toISOString();
      const leadId = crypto.randomUUID();
      const { error } = await supabase.from("sell_leads").insert({
        id: leadId,
        owner_name: form.owner_name,
        owner_email: form.owner_email,
        owner_phone: form.owner_phone,
        owner_city: form.owner_city,
        brand: form.brand,
        model: form.model,
        version: form.version,
        year: Number(form.year) || undefined,
        manufacture_year: Number(form.manufacture_year) || undefined,
        mileage: Number(form.mileage) || undefined,
        fuel_type: form.fuel_type,
        transmission: form.transmission,
        color: form.color,
        condition_notes: [
          form.vehicle_type ? `Tipo: ${form.vehicle_type}` : null,
          form.condition_notes,
        ].filter(Boolean).join("\n\n"),
        asking_price: form.asking_price,
        images: form.images,
        status: "novo",
        created_date: now,
        updated_date: now,
      });
      if (error) throw error;
      fetch("/api/send-sell-lead-webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lead_id: leadId }),
      }).catch(() => {});
      track("sell_lead_submit");
      router.push("/obrigado?tipo=venda");
    } catch {
      setErrors({ submit: "Não conseguimos enviar agora. Verifique sua conexão e tente novamente." });
      toast.error("Tivemos um problema inesperado. Tente novamente mais tarde.");
      setSubmitting(false);
    }
  };

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-5" noValidate>
      <Section title="Seus dados de contato" desc="Para nossa equipe entrar em contato e fechar a proposta com você.">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Nome completo *" error={errors.owner_name}>
            <Input
              value={form.owner_name}
              onChange={(e) => update("owner_name", e.target.value)}
              aria-invalid={Boolean(errors.owner_name)}
              className={errors.owner_name ? "border-destructive focus-visible:ring-destructive" : ""}
            />
          </Field>

          <Field label="Cidade">
            <Input value={form.owner_city} onChange={(e) => update("owner_city", e.target.value)} placeholder="Onde o veículo está" />
          </Field>

          <Field label="WhatsApp / Telefone *" className="sm:col-span-2" error={errors.owner_phone}>
            <div aria-invalid={Boolean(errors.owner_phone)}>
              <PhoneInput
                value={form.owner_phone}
                onChange={(v) => update("owner_phone", v)}
                placeholder="(11) 99999-9999"
                required
              />
            </div>
          </Field>

          <Field
            label="Confirme seu telefone *"
            className="sm:col-span-2"
            error={
              errors.owner_phone_confirm ||
              (form.owner_phone_confirm && !phonesMatch ? "Os números não conferem." : "")
            }
          >
            <div aria-invalid={Boolean(errors.owner_phone_confirm)}>
              <PhoneInput
                value={form.owner_phone_confirm}
                onChange={(v) => update("owner_phone_confirm", v)}
                placeholder="(11) 99999-9999"
                required
              />
            </div>
          </Field>

          <Field label="E-mail" className="sm:col-span-2" error={errors.owner_email}>
            <Input
              type="email"
              value={form.owner_email}
              onChange={(e) => update("owner_email", e.target.value)}
              placeholder="voce@exemplo.com"
              aria-invalid={Boolean(errors.owner_email)}
              className={errors.owner_email ? "border-destructive focus-visible:ring-destructive" : ""}
            />
          </Field>
        </div>
      </Section>

      <Section
        title="Sobre o veículo"
        desc="Aceitamos qualquer tipo de veículo: carros, motos, caminhões, utilitários e mais. Preencha o que souber — campos com * são obrigatórios."
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Tipo de veículo" className="sm:col-span-2">
            <Input
              value={form.vehicle_type}
              onChange={(e) => update("vehicle_type", e.target.value)}
              placeholder="Ex: Carro, Moto, Caminhão, Utilitário, Van..."
            />
          </Field>

          <Field label="Marca *" error={errors.brand}>
            <Input
              value={form.brand}
              onChange={(e) => update("brand", e.target.value)}
              placeholder="Ex: Volkswagen, Honda, Scania..."
              aria-invalid={Boolean(errors.brand)}
              className={errors.brand ? "border-destructive focus-visible:ring-destructive" : ""}
            />
          </Field>
          <Field label="Modelo *" error={errors.model}>
            <Input
              value={form.model}
              onChange={(e) => update("model", e.target.value)}
              placeholder="Ex: Golf, CG 160, R450..."
              aria-invalid={Boolean(errors.model)}
              className={errors.model ? "border-destructive focus-visible:ring-destructive" : ""}
            />
          </Field>
          <Field label="Versão / Acabamento">
            <Input
              value={form.version}
              onChange={(e) => update("version", e.target.value)}
              placeholder="Ex: 2.0 TSI Highline, Titan ESDD, Streamline 6x2..."
            />
          </Field>
          <Field label="Cor">
            <Input
              value={form.color}
              onChange={(e) => update("color", e.target.value)}
              placeholder="Ex: Prata"
            />
          </Field>
          <Field label="Ano modelo *" error={errors.year}>
            <Input
              type="number"
              inputMode="numeric"
              value={form.year}
              onChange={(e) => update("year", e.target.value)}
              placeholder="2020"
              aria-invalid={Boolean(errors.year)}
              className={errors.year ? "border-destructive focus-visible:ring-destructive" : ""}
            />
          </Field>
          <Field label="Ano fabricação" error={errors.manufacture_year}>
            <Input
              type="number"
              inputMode="numeric"
              value={form.manufacture_year}
              onChange={(e) => update("manufacture_year", e.target.value)}
              placeholder="2020"
              aria-invalid={Boolean(errors.manufacture_year)}
              className={errors.manufacture_year ? "border-destructive focus-visible:ring-destructive" : ""}
            />
          </Field>
          <Field label="Quilometragem" error={errors.mileage}>
            <Input
              type="number"
              inputMode="numeric"
              value={form.mileage}
              onChange={(e) => update("mileage", e.target.value)}
              placeholder="50000"
              aria-invalid={Boolean(errors.mileage)}
              className={errors.mileage ? "border-destructive focus-visible:ring-destructive" : ""}
            />
          </Field>
          <Field label="Combustível">
            <Input
              value={form.fuel_type}
              onChange={(e) => update("fuel_type", e.target.value)}
              placeholder="Ex: Flex, Gasolina, Diesel, Elétrico..."
            />
          </Field>
          <Field label="Câmbio / Transmissão">
            <Input
              value={form.transmission}
              onChange={(e) => update("transmission", e.target.value)}
              placeholder="Ex: Manual, Automático, CVT..."
            />
          </Field>
          <Field label="Valor pretendido *" error={errors.asking_price}>
            <div aria-invalid={Boolean(errors.asking_price)}>
              <BrlInput value={form.asking_price} onChange={(v) => update("asking_price", v)} />
            </div>
          </Field>
        </div>

        <Field label="Observações sobre o estado do veículo" className="mt-3">
          <Textarea
            value={form.condition_notes}
            onChange={(e) => update("condition_notes", e.target.value)}
            rows={4}
            placeholder="Conte sobre revisões, opcionais, batidas, documentação, IPVA/licenciamento, único dono, garantia restante, etc. Quanto mais detalhes, melhor a avaliação."
          />
        </Field>
      </Section>

      <Section
        title="Fotos do veículo *"
        desc="Envie pelo menos uma foto. Quanto mais ângulos, melhor: frente, traseira, laterais, painel, motor e detalhes. JPG ou PNG, até 10 fotos."
      >
        {errors.images && (
          <p role="alert" className="flex items-start gap-1 text-[11px] text-destructive mb-2">
            <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" aria-hidden="true" />
            {errors.images}
          </p>
        )}
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2.5">
          {(form.images || []).map((img, i) => (
            <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-secondary group">
              <img
                src={img}
                alt={`Foto ${i + 1} do veículo enviada por você`}
                loading="lazy"
                decoding="async"
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => removeImage(i)}
                className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
          {form.images.length < 10 && (
            <label className="aspect-square rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-1 cursor-pointer hover:bg-secondary/50 transition-colors text-muted-foreground">
              {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
              <span className="text-[10px] font-medium">{uploading ? "Enviando..." : "Adicionar"}</span>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleFiles}
                className="hidden"
                disabled={uploading}
              />
            </label>
          )}
        </div>
      </Section>

      {errors.submit && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-2xl border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive"
        >
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" aria-hidden="true" />
          {errors.submit}
        </div>
      )}

      <Button
        type="submit"
        disabled={submitting || uploading}
        className="w-full rounded-full h-12 font-semibold"
      >
        {submitting ? (
          <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Enviando...</>
        ) : (
          <><Send className="w-4 h-4 mr-2" /> Enviar proposta</>
        )}
      </Button>
    </form>
  );
}

function Section({ title, desc, children }) {
  return (
    <div className="bg-card rounded-3xl p-5 md:p-6 border border-border/50">
      <h2 className="font-display font-bold text-lg">{title}</h2>
      {desc && <p className="text-sm text-muted-foreground mt-0.5 mb-4">{desc}</p>}
      <div className={desc ? "" : "mt-4"}>{children}</div>
    </div>
  );
}

function Field({ label, children, className = "", error }) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      <Label className="text-sm">{label}</Label>
      {children}
      {error && (
        <p role="alert" className="flex items-start gap-1 text-[11px] text-destructive">
          <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" aria-hidden="true" />
          {error}
        </p>
      )}
    </div>
  );
}
