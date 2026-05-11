import React from "react";
import { SettingsSection, TextField, TextAreaField } from "../SettingsField";
import ArrayFieldEditor from "../ArrayFieldEditor";
import ImageUploadField from "../ImageUploadField";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export default function SettingsReviews({ form, update }) {
  const visible = form.reviews_visible !== false;
  return (
    <SettingsSection title="Depoimentos" desc="Avaliações reais dos seus clientes">
      <div className="flex items-center justify-between bg-secondary/40 rounded-xl px-4 py-3">
        <div>
          <Label className="text-sm font-medium">Mostrar seção no site</Label>
          <p className="text-xs text-muted-foreground mt-0.5">
            Quando desligado, a seção de avaliações fica oculta no catálogo público.
          </p>
        </div>
        <Switch checked={visible} onCheckedChange={(v) => update("reviews_visible", v)} />
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <TextField
          label="Título da seção"
          value={form.reviews_title}
          onChange={(v) => update("reviews_title", v)}
          placeholder="Quem compra, recomenda"
        />
        <TextField
          label="Nota geral"
          value={form.reviews_rating}
          onChange={(v) => update("reviews_rating", v)}
          placeholder="4.9"
        />
        <TextField
          label="Total de avaliações"
          value={form.reviews_count}
          onChange={(v) => update("reviews_count", v)}
          placeholder="512"
        />
      </div>

      <ArrayFieldEditor
        items={form.reviews || []}
        onChange={(v) => update("reviews", v)}
        newItem={() => ({ name: "", city: "", rating: 5, text: "", avatar: "", photo: "" })}
        itemLabel="Depoimento"
        addLabel="Adicionar depoimento"
        renderItem={(item, onChange) => (
          <div className="space-y-3">
            <div className="grid sm:grid-cols-3 gap-3">
              <TextField
                label="Nome"
                value={item.name}
                onChange={(v) => onChange({ ...item, name: v })}
                placeholder="Marina Oliveira"
              />
              <TextField
                label="Cidade"
                value={item.city}
                onChange={(v) => onChange({ ...item, city: v })}
                placeholder="São Paulo, SP"
              />
              <TextField
                label="Estrelas (1-5)"
                type="number"
                value={item.rating}
                onChange={(v) => onChange({ ...item, rating: Number(v) || 5 })}
              />
            </div>
            <TextAreaField
              label="Depoimento"
              value={item.text}
              onChange={(v) => onChange({ ...item, text: v })}
              placeholder="Compra rápida, sem burocracia..."
              rows={3}
            />
            <div className="grid sm:grid-cols-2 gap-4">
              <ImageUploadField
                label="Foto do cliente (avatar)"
                value={item.avatar}
                onChange={(v) => onChange({ ...item, avatar: v })}
                aspectClass="aspect-square max-w-[120px]"
                hint="200 × 200 px (quadrada). JPG ou PNG, até 200 KB."
              />
              <ImageUploadField
                label="Foto da avaliação (opcional)"
                value={item.photo}
                onChange={(v) => onChange({ ...item, photo: v })}
                aspectClass="aspect-[4/3] max-w-[220px]"
                hint="800 × 600 px (proporção 4:3). JPG ou PNG, até 500 KB."
              />
            </div>
          </div>
        )}
      />
    </SettingsSection>
  );
}