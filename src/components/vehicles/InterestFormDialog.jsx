import React, { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertCircle, CheckCircle2, Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { useStoreSettings } from "@/lib/useStoreSettings";
import { formatCurrency, formatYear } from "@/lib/formatters";
import PhoneInput from "@/components/PhoneInput";
import { formatCpfCnpj, isValidCpfCnpj } from "@/lib/cpfCnpj";
import { track } from "@/lib/analytics";

const FALLBACK_FIELDS = [
  { key: "name", label: "Nome completo", type: "text", required: true },
  { key: "phone", label: "WhatsApp / Telefone", type: "phone", required: true },
];

// Confirm-suffix used internally to track confirmation values per phone field.
const CONFIRM_SUFFIX = "__confirm";

export default function InterestFormDialog({ open, onOpenChange, vehicle, defaultValues = {} }) {
  const settings = useStoreSettings();
  const fields = useMemo(() => {
    const list = settings.interest_form_fields;
    return Array.isArray(list) && list.length > 0 ? list : FALLBACK_FIELDS;
  }, [settings.interest_form_fields]);

  const [values, setValues] = useState(defaultValues);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  // Erros exibidos abaixo de cada campo, além do toast.
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (open) {
      setValues(defaultValues);
      setErrors({});
    }
  }, [open, defaultValues]);

  const setField = (key, val) => {
    setValues((v) => ({ ...v, [key]: val }));
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const handleClose = (next) => {
    onOpenChange(next);
    if (!next) {
      setTimeout(() => {
        setValues(defaultValues);
        setErrors({});
        setDone(false);
        setSubmitting(false);
      }, 200);
    }
  };

  // Valida todos os campos de uma vez para o visitante corrigir tudo junto.
  const validate = () => {
    const found = {};

    for (const f of fields) {
      const value = String(values[f.key] || "").trim();

      if (f.required && !value) {
        found[f.key] = `${f.label} é obrigatório.`;
        continue;
      }
      if (f.type === "phone") {
        const digits = value.replace(/\D/g, "");
        if (value && digits.length < 12) {
          found[f.key] = "Telefone incompleto. Inclua o DDD.";
          continue;
        }
        const confirm = String(values[f.key + CONFIRM_SUFFIX] || "").trim();
        if (value && value !== confirm) {
          found[f.key + CONFIRM_SUFFIX] = "Os números não conferem.";
        }
      }
      if (f.type === "cpf_cnpj" && value && !isValidCpfCnpj(value)) {
        found[f.key] = "CPF ou CNPJ inválido.";
      }
      if (f.type === "email" && value && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)) {
        found[f.key] = "E-mail inválido. Exemplo: voce@exemplo.com";
      }
    }

    return found;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const found = validate();
    setErrors(found);
    const keys = Object.keys(found);
    if (keys.length > 0) {
      toast.error(
        keys.length === 1 ? found[keys[0]] : `Revise ${keys.length} campos destacados.`
      );
      return;
    }

    // Build the payload — strip the internal confirmation copies.
    const cleaned = {};
    Object.entries(values).forEach(([k, v]) => {
      if (!k.endsWith(CONFIRM_SUFFIX)) cleaned[k] = v;
    });

    setSubmitting(true);
    try {
      const response = await fetch("/api/send-interest-webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vehicle_id: vehicle.id,
          form_data: cleaned,
          source_url: typeof window !== "undefined" ? window.location.href : "",
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (data?.ok === false || data?.error) {
        setErrors({ submit: "Não conseguimos enviar agora. Tente novamente em instantes." });
        toast.error("Tivemos um problema inesperado. Tente novamente mais tarde.");
      } else {
        track("interest_submit", { vehicle });
        setDone(true);
      }
    } catch {
      setErrors({ submit: "Falha de conexão. Verifique a internet e tente de novo." });
      toast.error("Tivemos um problema inesperado. Tente novamente mais tarde.");
    } finally {
      setSubmitting(false);
    }
  };

  const yearStr = formatYear(vehicle?.manufacture_year, vehicle?.year);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      {/* dvh em vez de vh: no Safari do iPhone o "vh" ignora as barras do
          navegador, então 90vh passava da área visível e o topo do formulário
          (título e campo de nome) ficava fora da tela, sem como rolar até ele.
          overscroll-contain impede que a rolagem do formulário arraste a
          página atrás quando chega no fim. */}
      <DialogContent className="sm:max-w-md max-h-[85dvh] overflow-y-auto overscroll-contain">
        {done ? (
          <div className="py-6 text-center">
            {/* Store logo + green check overlay */}
            <div className="relative w-20 h-20 mx-auto mb-4">
              <div className="w-20 h-20 rounded-2xl bg-secondary flex items-center justify-center overflow-hidden">
                {settings.logo_url ? (
                  <img
                    src={settings.logo_url}
                    alt={settings.store_name || "Loja"}
                    className="w-full h-full object-contain p-1.5"
                  />
                ) : (
                  <span className="font-display font-bold text-xl">
                    {(settings.store_name || "L").slice(0, 1)}
                  </span>
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 w-9 h-9 rounded-full bg-green-600 text-white flex items-center justify-center ring-4 ring-background">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>

            <h3 className="font-display font-bold text-lg">Pronto!</h3>
            <p className="text-sm text-muted-foreground mt-2">
              {settings.interest_form_success_message ||
                "Recebemos seu interesse! Nossa equipe vai te chamar em instantes."}
            </p>
            <Button
              onClick={() => handleClose(false)}
              className="mt-5 rounded-full px-8 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Fechar
            </Button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="font-display">
                {settings.interest_form_title || "Tenho interesse neste veículo"}
              </DialogTitle>
              <DialogDescription className="text-xs">
                {vehicle.brand} {vehicle.model}
                {yearStr && ` · ${yearStr}`}
                {vehicle.price && ` · ${formatCurrency(vehicle.price)}`}
              </DialogDescription>
            </DialogHeader>

            {settings.interest_form_subtitle && (
              <p className="text-sm text-muted-foreground -mt-1">
                {settings.interest_form_subtitle}
              </p>
            )}

            <form onSubmit={handleSubmit} className="space-y-3">
              {fields.map((f) => (
                <FieldRow
                  key={f.key}
                  field={f}
                  value={values[f.key] || ""}
                  confirmValue={values[f.key + CONFIRM_SUFFIX] || ""}
                  error={errors[f.key]}
                  confirmError={errors[f.key + CONFIRM_SUFFIX]}
                  onChange={(v) => setField(f.key, v)}
                  onConfirmChange={(v) => setField(f.key + CONFIRM_SUFFIX, v)}
                />
              ))}

              {errors.submit && (
                <div
                  role="alert"
                  className="flex items-start gap-2 rounded-xl border border-destructive/40 bg-destructive/5 p-2.5 text-xs text-destructive"
                >
                  <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" aria-hidden="true" />
                  {errors.submit}
                </div>
              )}

              <Button
                type="submit"
                disabled={submitting}
                className="w-full rounded-full h-12 mt-2 font-semibold bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    {settings.interest_form_submit_label || "Enviar interesse"}
                  </>
                )}
              </Button>

              <p className="text-[10px] text-muted-foreground text-center leading-tight">
                Ao enviar, você concorda em ser contactado pela equipe da loja
              </p>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function ErrorText({ children }) {
  if (!children) return null;
  return (
    <p role="alert" className="flex items-start gap-1 text-[11px] text-destructive">
      <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" aria-hidden="true" />
      {children}
    </p>
  );
}

function FieldRow({ field, value, confirmValue, error, confirmError, onChange, onConfirmChange }) {
  const id = `intf-${field.key}`;
  const phonesMatch = value && value === confirmValue;
  const errorClass = "border-destructive focus-visible:ring-destructive";

  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs font-medium">
        {field.label}
        {field.required && <span className="text-destructive ml-1">*</span>}
      </Label>

      {field.type === "phone" ? (
        <div className="space-y-2">
          <div aria-invalid={Boolean(error)}>
            <PhoneInput
              value={value}
              onChange={onChange}
              placeholder={field.placeholder}
              required={field.required}
            />
          </div>
          <ErrorText>{error}</ErrorText>
          <Label className="text-[11px] font-medium text-muted-foreground">
            Confirme seu telefone
            {field.required && <span className="text-destructive ml-1">*</span>}
          </Label>
          <div aria-invalid={Boolean(confirmError)}>
            <PhoneInput
              value={confirmValue}
              onChange={onConfirmChange}
              placeholder={field.placeholder}
              required={field.required}
            />
          </div>
          <ErrorText>
            {confirmError || (confirmValue && !phonesMatch ? "Os números não conferem." : "")}
          </ErrorText>
        </div>
      ) : field.type === "cpf_cnpj" ? (
        <div className="space-y-1">
          <Input
            id={id}
            inputMode="numeric"
            value={value}
            onChange={(e) => onChange(formatCpfCnpj(e.target.value))}
            placeholder={field.placeholder || "000.000.000-00"}
            aria-invalid={Boolean(error)}
            className={`h-11 rounded-xl ${error ? errorClass : ""}`}
            maxLength={18}
          />
          {(() => {
            const digits = value.replace(/\D/g, "");
            const complete = digits.length === 11 || digits.length === 14;
            const invalid = error || (complete && !isValidCpfCnpj(value) ? "CPF ou CNPJ inválido." : "");
            return <ErrorText>{invalid}</ErrorText>;
          })()}
        </div>
      ) : field.type === "textarea" ? (
        <>
          <Textarea
            id={id}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            rows={3}
            aria-invalid={Boolean(error)}
            className={`rounded-xl resize-none ${error ? errorClass : ""}`}
          />
          <ErrorText>{error}</ErrorText>
        </>
      ) : field.type === "select" ? (
        <>
          <Select value={value} onValueChange={onChange}>
            <SelectTrigger
              aria-invalid={Boolean(error)}
              className={`h-11 rounded-xl ${error ? errorClass : ""}`}
            >
              <SelectValue placeholder={field.placeholder || "Selecione"} />
            </SelectTrigger>
            <SelectContent>
              {(field.options || []).map((opt) => (
                <SelectItem key={opt} value={opt}>
                  {opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <ErrorText>{error}</ErrorText>
        </>
      ) : (
        <>
          <Input
            id={id}
            type={field.type === "number" ? "number" : field.type === "email" ? "email" : "text"}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            aria-invalid={Boolean(error)}
            className={`h-11 rounded-xl ${error ? errorClass : ""}`}
          />
          <ErrorText>{error}</ErrorText>
        </>
      )}
    </div>
  );
}
