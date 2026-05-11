import React from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, GripVertical, ChevronUp, ChevronDown, Sparkles } from "lucide-react";
import { SettingsField } from "@/components/admin/SettingsField";

const FIELD_TYPES = [
  { value: "text", label: "Texto curto" },
  { value: "textarea", label: "Texto longo" },
  { value: "email", label: "E-mail" },
  { value: "phone", label: "Telefone (com DDI)" },
  { value: "number", label: "Número" },
  { value: "select", label: "Seleção (lista)" },
];

function SettingsSection({ title, desc, children }) {
  return (
    <div className="bg-card rounded-3xl p-5 md:p-6 border border-border/50">
      <h2 className="font-display font-bold text-lg">{title}</h2>
      {desc && <p className="text-sm text-muted-foreground mt-0.5 mb-4">{desc}</p>}
      <div className={desc ? "" : "mt-4"}>{children}</div>
    </div>
  );
}

const DEFAULT_FORM = {
  title: "Tenho interesse neste veículo",
  subtitle: "Preencha seus dados e nossa equipe entra em contato em poucos minutos.",
  submit_label: "Enviar interesse",
  success_message: "Recebemos seu interesse! Nossa equipe vai te chamar em instantes.",
  fields: [
    { key: "name",    label: "Nome completo",        type: "text",     placeholder: "Como prefere ser chamado?",  required: true  },
    { key: "phone",   label: "WhatsApp / Telefone",  type: "phone",    placeholder: "(11) 99999-9999",            required: true  },
    { key: "email",   label: "E-mail",               type: "email",    placeholder: "voce@email.com",             required: false },
    { key: "message", label: "Mensagem (opcional)",  type: "textarea", placeholder: "Quero negociar, agendar test-drive...", required: false },
  ],
};

export default function SettingsInterestForm({ form, update }) {
  const fields = Array.isArray(form.interest_form_fields) ? form.interest_form_fields : [];

  const setFields = (next) => update("interest_form_fields", next);

  const applyDefault = () => {
    update("interest_form_title",           DEFAULT_FORM.title);
    update("interest_form_subtitle",        DEFAULT_FORM.subtitle);
    update("interest_form_submit_label",    DEFAULT_FORM.submit_label);
    update("interest_form_success_message", DEFAULT_FORM.success_message);
    setFields(DEFAULT_FORM.fields);
  };

  const addField = () => {
    setFields([
      ...fields,
      {
        key: `campo_${fields.length + 1}`,
        label: "Novo campo",
        type: "text",
        placeholder: "",
        required: false,
        options: [],
      },
    ]);
  };

  const updateField = (idx, patch) => {
    setFields(fields.map((f, i) => (i === idx ? { ...f, ...patch } : f)));
  };

  const removeField = (idx) => {
    setFields(fields.filter((_, i) => i !== idx));
  };

  const move = (idx, dir) => {
    const next = [...fields];
    const target = idx + dir;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target], next[idx]];
    setFields(next);
  };

  return (
    <>
      <SettingsSection
        title="Formulário 'Tenho interesse'"
        desc="Edite os textos e os campos do formulário que aparece quando o webhook de interesse está ativo. Quando o webhook está desativado, o botão 'Tenho interesse' continua abrindo direto o WhatsApp."
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SettingsField label="Título do formulário">
            <Input
              value={form.interest_form_title || ""}
              onChange={(e) => update("interest_form_title", e.target.value)}
              className="rounded-xl"
            />
          </SettingsField>
          <SettingsField label="Texto do botão de envio">
            <Input
              value={form.interest_form_submit_label || ""}
              onChange={(e) => update("interest_form_submit_label", e.target.value)}
              className="rounded-xl"
            />
          </SettingsField>
          <SettingsField label="Subtítulo">
            <Textarea
              rows={2}
              value={form.interest_form_subtitle || ""}
              onChange={(e) => update("interest_form_subtitle", e.target.value)}
              className="rounded-xl resize-none"
            />
          </SettingsField>
          <SettingsField label="Mensagem de sucesso (após envio)">
            <Textarea
              rows={2}
              value={form.interest_form_success_message || ""}
              onChange={(e) => update("interest_form_success_message", e.target.value)}
              className="rounded-xl resize-none"
            />
          </SettingsField>
        </div>
      </SettingsSection>

      <SettingsSection
        title="Campos do formulário"
        desc="Adicione, remova ou reordene os campos. Os dados são enviados ao webhook usando a 'chave' como nome no payload."
      >
        <div className="space-y-3">
          {fields.length === 0 && (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <p className="text-sm text-muted-foreground">Nenhum campo configurado.</p>
              <button
                type="button"
                onClick={applyDefault}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity"
              >
                <Sparkles className="w-4 h-4" />
                Usar formulário padrão
              </button>
              <p className="text-xs text-muted-foreground">
                Preenche automaticamente textos e campos (nome, telefone, e-mail, mensagem).
              </p>
            </div>
          )}
          {fields.map((field, idx) => (
            <FieldEditor
              key={idx}
              field={field}
              onChange={(patch) => updateField(idx, patch)}
              onRemove={() => removeField(idx)}
              onMoveUp={() => move(idx, -1)}
              onMoveDown={() => move(idx, +1)}
              isFirst={idx === 0}
              isLast={idx === fields.length - 1}
            />
          ))}
          <Button
            type="button"
            variant="outline"
            onClick={addField}
            className="w-full rounded-full h-11"
          >
            <Plus className="w-4 h-4 mr-2" />
            Adicionar campo
          </Button>
        </div>
      </SettingsSection>
    </>
  );
}

function FieldEditor({ field, onChange, onRemove, onMoveUp, onMoveDown, isFirst, isLast }) {
  const isSelect = field.type === "select";
  return (
    <div className="border border-border/60 rounded-2xl p-4 bg-secondary/30">
      <div className="flex items-start gap-2 mb-3">
        <div className="flex flex-col -ml-1">
          <button
            type="button"
            onClick={onMoveUp}
            disabled={isFirst}
            className="w-6 h-6 rounded hover:bg-secondary text-muted-foreground hover:text-foreground disabled:opacity-30 flex items-center justify-center"
          >
            <ChevronUp className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onMoveDown}
            disabled={isLast}
            className="w-6 h-6 rounded hover:bg-secondary text-muted-foreground hover:text-foreground disabled:opacity-30 flex items-center justify-center"
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>
        <GripVertical className="w-4 h-4 text-muted-foreground mt-1" />
        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-2">
          <Input
            value={field.label || ""}
            onChange={(e) => onChange({ label: e.target.value })}
            placeholder="Rótulo (ex: Nome completo)"
            className="rounded-lg"
          />
          <Input
            value={field.key || ""}
            onChange={(e) => onChange({ key: e.target.value.replace(/\s+/g, "_").toLowerCase() })}
            placeholder="Chave (ex: nome_completo)"
            className="rounded-lg font-mono text-xs"
          />
          <Select value={field.type || "text"} onValueChange={(v) => onChange({ type: v })}>
            <SelectTrigger className="rounded-lg">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FIELD_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onRemove}
          className="text-destructive hover:text-destructive hover:bg-destructive/10 flex-shrink-0"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 ml-8">
        <Input
          value={field.placeholder || ""}
          onChange={(e) => onChange({ placeholder: e.target.value })}
          placeholder="Placeholder (texto de ajuda)"
          className="rounded-lg text-sm"
        />
        <div className="flex items-center justify-between rounded-lg border border-border/60 bg-background px-3">
          <Label className="text-xs">Obrigatório</Label>
          <Switch
            checked={!!field.required}
            onCheckedChange={(v) => onChange({ required: v })}
          />
        </div>
      </div>

      {isSelect && (
        <div className="ml-8 mt-2">
          <Label className="text-xs text-muted-foreground">
            Opções (uma por linha)
          </Label>
          <Textarea
            rows={3}
            value={(field.options || []).join("\n")}
            onChange={(e) =>
              onChange({
                options: e.target.value.split("\n").map((s) => s.trim()).filter(Boolean),
              })
            }
            placeholder={"Opção 1\nOpção 2\nOpção 3"}
            className="rounded-lg text-sm mt-1"
          />
        </div>
      )}
    </div>
  );
}