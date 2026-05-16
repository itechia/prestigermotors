'use client';

import React, { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/api/supabaseClient";
import { toast } from "sonner";
import { ArrowLeft, X, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AdminShell from "../components/admin/AdminShell";
import BrlInput from "../components/admin/BrlInput";
import EmbedHtmlField from "../components/admin/EmbedHtmlField";
import VehicleImagesManager from "../components/admin/VehicleImagesManager";
import VehicleLivePreview from "../components/admin/VehicleLivePreview";
import { statusLabels } from "@/lib/formatters";
import { useTaxonomies, slugify } from "@/lib/useTaxonomies";
import { deleteStorageFile } from "@/lib/uploadFile";

export default function AdminVehicleEditor() {
  return (
    <AdminShell>
      <Editor />
    </AdminShell>
  );
}

const INITIAL = {
  vehicle_type: "",
  brand: "", model: "", version: "", year: new Date().getFullYear(), manufacture_year: new Date().getFullYear(),
  price: 0, price_old: 0, mileage: 0, fuel_type: "", transmission: "", color: "",
  body_type: "", condition: "", description: "", images: [], embed_html: "", features: [],
  status: "disponivel", featured: false, hidden: false, doors: 4, engine: "",
  stock_quantity: 1, listed_date: "",
};

function Editor() {
  const { id } = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const isNew = !id || id === "novo";

  const tax = useTaxonomies();
  const [form, setForm] = useState(INITIAL);
  const [featureInput, setFeatureInput] = useState("");

  const { data: vehicle, isLoading: vehicleLoading } = useQuery({
    queryKey: ["vehicle", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vehicles")
        .select("*")
        .eq("id", id)
        .single();
      if (error && error.code !== "PGRST116") throw error;
      return data ?? null;
    },
    enabled: !isNew,
  });

  useEffect(() => {
    if (vehicle) setForm({ ...INITIAL, ...vehicle });
  }, [vehicle]);

  // Models filtered by selected brand (matches the brand slug stored as parent)
  const availableModels = useMemo(() => {
    if (!form.brand) return [];
    const brandSlug = slugify(form.brand);
    return tax.models.filter((m) => !m.parent || m.parent === brandSlug);
  }, [tax.models, form.brand]);

  const save = useMutation({
    mutationFn: async () => {
      const now = new Date().toISOString();
      if (isNew) {
        const newId = crypto.randomUUID();
        const { error } = await supabase
          .from("vehicles")
          .insert({ id: newId, ...form, created_date: now, updated_date: now });
        if (error) throw error;
        return { id: newId, ...form };
      }
      const { data, error } = await supabase
        .from("vehicles")
        .update({ ...form, updated_date: now })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
      queryClient.invalidateQueries({ queryKey: ["vehicles", "admin"] });
      toast.success(isNew ? "Veículo cadastrado!" : "Veículo atualizado!");
      router.push("/admin/veiculos");
    },
    onError: () => toast.error("Erro ao salvar"),
  });

  const remove = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("vehicles").delete().eq("id", id);
      if (error) throw error;
      // After DB record is removed, clean up all uploaded images from storage
      if (form.images?.length) {
        await Promise.allSettled(form.images.map((url) => deleteStorageFile(url)));
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
      queryClient.invalidateQueries({ queryKey: ["vehicles", "admin"] });
      toast.success("Veículo removido");
      router.push("/admin/veiculos");
    },
  });

  // All hooks declared — safe to conditionally render now
  if (!isNew && vehicleLoading) {
    return <EditorSkeleton />;
  }

  const update = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  const onBrandChange = (brandName) => {
    setForm((f) => ({ ...f, brand: brandName, model: "" }));
  };

  const addFeature = () => {
    if (!featureInput.trim()) return;
    update("features", [...(form.features || []), featureInput.trim()]);
    setFeatureInput("");
  };
  const removeFeature = (idx) => update("features", form.features.filter((_, i) => i !== idx));

  const brandOptions = tax.brands.map((b) => ({ label: b.label, value: b.label }));
  const typeOptions = tax.vehicle_types.map((t) => ({ label: t.label, value: t.value }));

  return (
    <div className="pb-20">
      <Link
        href="/admin/veiculos"
        className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="w-4 h-4" aria-hidden="true" /> Voltar para veículos
      </Link>

      <div className="mb-6">
        <h1 className="font-display font-bold text-2xl md:text-3xl">
          {isNew ? "Novo veículo" : "Editar veículo"}
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
        <div className="space-y-6 min-w-0">
      {/* Imagens */}
      <Section
        title="Imagens"
        desc="Arraste para reordenar — a primeira é a capa do anúncio. Se houver HTML embed (abaixo), ele substitui a capa. Tamanho recomendado: 1600 × 1200 px (proporção 4:3, JPG ou PNG, até 1 MB cada). Use sempre a mesma proporção para os cards ficarem uniformes.">
        <VehicleImagesManager
          images={form.images || []}
          onChange={(imgs) => update("images", imgs)}
          hasEmbed={Boolean(form.embed_html?.trim())}
        />

        <div className="mt-5">
          <EmbedHtmlField value={form.embed_html} onChange={(v) => update("embed_html", v)} />
        </div>
      </Section>

      {/* Tipo e identificação */}
      <Section title="Tipo e identificação" desc="As listas vêm de Configurações > Categorias e Marcas.">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <DynamicSelect
            label="Tipo de veículo"
            value={form.vehicle_type}
            onChange={(v) => update("vehicle_type", v)}
            options={typeOptions}
            placeholder={typeOptions.length ? "Selecione" : "Cadastre em Configurações > Categorias"}
            disabled={typeOptions.length === 0}
          />
          <DynamicSelect
            label="Marca *"
            value={form.brand}
            onChange={onBrandChange}
            options={brandOptions}
            placeholder={brandOptions.length ? "Selecione" : "Cadastre em Configurações > Marcas"}
            disabled={brandOptions.length === 0}
          />
          <DynamicSelect
            label="Modelo *"
            value={form.model}
            onChange={(v) => update("model", v)}
            options={availableModels.map((m) => ({ label: m.label, value: m.label }))}
            placeholder={
              !form.brand
                ? "Selecione a marca primeiro"
                : availableModels.length === 0
                ? "Cadastre modelos em Configurações > Categorias"
                : "Selecione"
            }
            disabled={!form.brand || availableModels.length === 0}
            allowFreeInput
          />
          <Field label="Versão">
            <Input value={form.version} onChange={(e) => update("version", e.target.value)} placeholder="Ex: 2.0 TSI Highline" />
          </Field>
          <Field label="Motor">
            <Input value={form.engine} onChange={(e) => update("engine", e.target.value)} placeholder="Ex: 2.0 Turbo" />
          </Field>
          <Field label="Portas">
            <Input type="number" value={form.doors} onChange={(e) => update("doors", Number(e.target.value))} />
          </Field>
        </div>
      </Section>

      {/* Preços e ano */}
      <Section title="Preços, ano e quilometragem">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Preço de (anterior — riscado)">
            <BrlInput value={form.price_old} onChange={(v) => update("price_old", v)} />
          </Field>
          <Field label="Preço por *">
            <BrlInput value={form.price} onChange={(v) => update("price", v)} />
          </Field>
          <Field label="Ano fabricação">
            <Input type="number" value={form.manufacture_year} onChange={(e) => update("manufacture_year", Number(e.target.value))} />
          </Field>
          <Field label="Ano modelo *">
            <Input type="number" value={form.year} onChange={(e) => update("year", Number(e.target.value))} />
          </Field>
          <Field label="Quilometragem">
            <Input type="number" value={form.mileage} onChange={(e) => update("mileage", Number(e.target.value))} />
          </Field>
          <Field label="Quantidade em estoque">
            <Input
              type="number"
              min={0}
              value={form.stock_quantity}
              onChange={(e) => update("stock_quantity", Number(e.target.value))}
            />
            <p className="text-[11px] text-muted-foreground mt-1">
              Quando 1, aparece o aviso "Última unidade disponível" na página do veículo.
            </p>
          </Field>
          <Field label="Data do anúncio">
            <Input
              type="date"
              value={form.listed_date ? String(form.listed_date).slice(0, 10) : ""}
              onChange={(e) => update("listed_date", e.target.value)}
            />
            <p className="text-[11px] text-muted-foreground mt-1">
              Usada para calcular "Anunciado há X dias". Se vazio, usamos a data de cadastro.
            </p>
          </Field>
        </div>
      </Section>

      {/* Categorias e atributos */}
      <Section title="Categorias e atributos">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <DynamicSelect
            label="Categoria"
            value={form.body_type}
            onChange={(v) => update("body_type", v)}
            options={tax.categories.map((c) => ({ label: c.label, value: c.value }))}
          />
          <DynamicSelect
            label="Combustível"
            value={form.fuel_type}
            onChange={(v) => update("fuel_type", v)}
            options={tax.fuels.map((c) => ({ label: c.label, value: c.value }))}
          />
          <DynamicSelect
            label="Câmbio"
            value={form.transmission}
            onChange={(v) => update("transmission", v)}
            options={tax.transmissions.map((c) => ({ label: c.label, value: c.value }))}
          />
          <DynamicSelect
            label="Condição"
            value={form.condition}
            onChange={(v) => update("condition", v)}
            options={tax.conditions.map((c) => ({ label: c.label, value: c.value }))}
          />
          <DynamicSelect
            label="Cor"
            value={form.color}
            onChange={(v) => update("color", v)}
            options={tax.colors.map((c) => ({ label: c.label, value: c.value }))}
            placeholder={tax.colors.length ? "Selecione" : "Cadastre em Configurações > Categorias"}
            allowFreeInput
          />
          <DynamicSelect
            label="Status"
            value={form.status}
            onChange={(v) => update("status", v)}
            options={Object.entries(statusLabels).map(([value, label]) => ({ label, value }))}
          />
        </div>

        <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-xl mt-4">
          <div>
            <Label className="font-medium">Destacar veículo</Label>
            <p className="text-xs text-muted-foreground mt-0.5">Aparece na seção de destaques</p>
          </div>
          <Switch checked={form.featured} onCheckedChange={(v) => update("featured", v)} />
        </div>

        <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-xl mt-3">
          <div>
            <Label className="font-medium">Ocultar do catálogo</Label>
            <p className="text-xs text-muted-foreground mt-0.5">
              O veículo deixa de aparecer no site público, mas continua aqui no admin.
            </p>
          </div>
          <Switch checked={!!form.hidden} onCheckedChange={(v) => update("hidden", v)} />
        </div>
      </Section>

      {/* Descrição e opcionais */}
      <Section title="Descrição e opcionais">
        <Field label="Descrição">
          <Textarea
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
            rows={5}
            placeholder="Detalhes sobre o veículo, condições de uso, revisões..."
          />
        </Field>

        <div className="space-y-2 mt-4">
          <Label>Opcionais</Label>
          <div className="flex gap-2">
            <Input
              value={featureInput}
              onChange={(e) => setFeatureInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addFeature())}
              placeholder="Ex: Ar-condicionado digital"
            />
            <Button type="button" onClick={addFeature} variant="outline">Adicionar</Button>
          </div>
          {form.features?.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {form.features.map((f, i) => (
                <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary text-sm">
                  {f}
                  <button onClick={() => removeFeature(i)} className="hover:text-destructive" aria-label={`Remover opcional ${f}`}>
                    <X className="w-3 h-3" aria-hidden="true" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      </Section>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 pt-4">
        <Button
          onClick={() => save.mutate()}
          disabled={save.isPending || !form.brand || !form.model || !form.price}
          className="flex-1 rounded-full h-12 font-semibold"
        >
          {save.isPending ? "Salvando…" : isNew ? "Cadastrar veículo" : "Salvar alterações"}
        </Button>
        {!isNew && (
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              if (confirm("Remover este veículo definitivamente?")) remove.mutate();
            }}
            className="rounded-full h-12 text-destructive hover:text-destructive border-destructive/30"
          >
            <Trash2 className="w-4 h-4 mr-2" /> Remover
          </Button>
        )}
      </div>
        </div>

        {/* Live preview — sticky on wide screens, with Card / Página tabs */}
        <aside className="lg:sticky lg:top-24 lg:self-start order-first lg:order-last">
          <VehicleLivePreview vehicle={form} />
        </aside>
      </div>
    </div>
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

function Field({ label, children }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm">{label}</Label>
      {children}
    </div>
  );
}

// Select that always allows the currently-saved value to render even when it
// is not in the available options (e.g. legacy data). Optional `allowFreeInput`
// renders a fallback text input when no options are configured yet.
function DynamicSelect({ label, value, onChange, options = [], placeholder = "Selecione", disabled, allowFreeInput }) {
  const hasValueOutsideOptions = value && !options.some((o) => o.value === value);

  if (allowFreeInput && options.length === 0) {
    return (
      <Field label={label}>
        <Input value={value || ""} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
      </Field>
    );
  }

  return (
    <Field label={label}>
      <Select value={value || ""} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {hasValueOutsideOptions && (
            <SelectItem value={value}>{value} (atual)</SelectItem>
          )}
          {options.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  );
}

function EditorSkeleton() {
  return (
    <div className="pb-20 animate-pulse">
      <div className="h-5 w-32 bg-secondary rounded-full mb-6" />
      <div className="h-8 w-48 bg-secondary rounded-xl mb-6" />
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
        <div className="space-y-6">
          {[180, 220, 160, 200].map((h, i) => (
            <div key={i} className="bg-card rounded-3xl p-5 border border-border/50">
              <div className="h-5 w-28 bg-secondary rounded-lg mb-4" />
              <div className="grid grid-cols-2 gap-3">
                {Array(4).fill(0).map((_, j) => (
                  <div key={j} className="h-10 bg-secondary rounded-xl" />
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="hidden lg:block h-64 bg-card rounded-3xl border border-border/50" />
      </div>
    </div>
  );
}