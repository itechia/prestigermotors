import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Upload, Loader2, X, CheckCircle2, Send } from "lucide-react";
import BrlInput from "@/components/admin/BrlInput";
import PhoneInput from "@/components/PhoneInput";

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

export default function SellLeadForm() {
  const [form, setForm] = useState(INITIAL);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const successRef = useRef(null);

  const update = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  // After success, scroll to the success card so the user clearly sees the confirmation
  useEffect(() => {
    if (done && successRef.current) {
      successRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [done]);

  const handleFiles = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setUploading(true);
    try {
      const uploads = await Promise.all(
        files.map((file) => base44.integrations.Core.UploadFile({ file }))
      );
      const urls = uploads.map((u) => u.file_url);
      update("images", [...(form.images || []), ...urls]);
    } catch {
      toast.error("Erro ao enviar fotos");
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (idx) =>
    update("images", form.images.filter((_, i) => i !== idx));

  const phonesMatch =
    form.owner_phone && form.owner_phone === form.owner_phone_confirm;

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Generic required fields — work for cars, motorcycles, trucks, etc.
    const requiredOk =
      form.owner_name &&
      form.owner_phone &&
      form.brand &&
      form.model &&
      form.year &&
      form.asking_price > 0;

    if (!requiredOk) {
      toast.error("Preencha todos os campos obrigatórios marcados com *.");
      return;
    }
    if (!form.images || form.images.length === 0) {
      toast.error("Envie ao menos uma foto do veículo.");
      return;
    }
    if (form.owner_phone !== form.owner_phone_confirm) {
      toast.error("Os números de telefone não conferem. Confirme o número.");
      return;
    }
    setSubmitting(true);
    try {
      await base44.entities.SellLead.create({
        owner_name: form.owner_name,
        owner_email: form.owner_email,
        owner_phone: form.owner_phone,
        owner_city: form.owner_city,
        // We store the vehicle_type prefix on the brand or notes when set, so
        // the SellLead entity (which already has brand/model fields) keeps
        // working without schema changes.
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
      });
      setDone(true);
    } catch {
      toast.error("Tivemos um problema inesperado. Tente novamente mais tarde.");
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div
        ref={successRef}
        className="bg-card rounded-3xl p-8 md:p-12 border border-border/50 text-center"
      >
        <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-5">
          <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
        </div>
        <h2 className="font-display font-bold text-2xl md:text-3xl">Proposta enviada!</h2>
        <p className="text-muted-foreground mt-2 max-w-md mx-auto">
          Recebemos os dados do seu veículo. Nossa equipe vai analisar e entrar em contato em breve.
        </p>
        <Button
          onClick={() => {
            setForm(INITIAL);
            setDone(false);
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          variant="outline"
          className="mt-6 rounded-full"
        >
          Enviar outro veículo
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <Section title="Seus dados de contato" desc="Para nossa equipe entrar em contato e fechar a proposta com você.">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Nome completo *">
            <Input value={form.owner_name} onChange={(e) => update("owner_name", e.target.value)} />
          </Field>

          <Field label="Cidade">
            <Input value={form.owner_city} onChange={(e) => update("owner_city", e.target.value)} placeholder="Onde o veículo está" />
          </Field>

          <Field label="WhatsApp / Telefone *" className="sm:col-span-2">
            <PhoneInput
              value={form.owner_phone}
              onChange={(v) => update("owner_phone", v)}
              placeholder="(11) 99999-9999"
              required
            />
          </Field>

          <Field label="Confirme seu telefone *" className="sm:col-span-2">
            <PhoneInput
              value={form.owner_phone_confirm}
              onChange={(v) => update("owner_phone_confirm", v)}
              placeholder="(11) 99999-9999"
              required
            />
            {form.owner_phone_confirm && !phonesMatch && (
              <p className="text-[11px] text-destructive mt-1">Os números não conferem.</p>
            )}
          </Field>

          <Field label="E-mail" className="sm:col-span-2">
            <Input
              type="email"
              value={form.owner_email}
              onChange={(e) => update("owner_email", e.target.value)}
              placeholder="voce@exemplo.com"
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

          <Field label="Marca *">
            <Input
              value={form.brand}
              onChange={(e) => update("brand", e.target.value)}
              placeholder="Ex: Volkswagen, Honda, Scania..."
            />
          </Field>
          <Field label="Modelo *">
            <Input
              value={form.model}
              onChange={(e) => update("model", e.target.value)}
              placeholder="Ex: Golf, CG 160, R450..."
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
          <Field label="Ano modelo *">
            <Input
              type="number"
              inputMode="numeric"
              value={form.year}
              onChange={(e) => update("year", e.target.value)}
              placeholder="2020"
            />
          </Field>
          <Field label="Ano fabricação">
            <Input
              type="number"
              inputMode="numeric"
              value={form.manufacture_year}
              onChange={(e) => update("manufacture_year", e.target.value)}
              placeholder="2020"
            />
          </Field>
          <Field label="Quilometragem">
            <Input
              type="number"
              inputMode="numeric"
              value={form.mileage}
              onChange={(e) => update("mileage", e.target.value)}
              placeholder="50000"
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
          <Field label="Valor pretendido *">
            <BrlInput value={form.asking_price} onChange={(v) => update("asking_price", v)} />
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
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2.5">
          {(form.images || []).map((img, i) => (
            <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-secondary group">
              <img src={img} alt="" className="w-full h-full object-cover" />
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

      <Button
        type="submit"
        disabled={submitting}
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

function Field({ label, children, className = "" }) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      <Label className="text-sm">{label}</Label>
      {children}
    </div>
  );
}