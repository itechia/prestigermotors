import React, { useMemo, useState } from "react";
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
import { CheckCircle2, Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { useStoreSettings } from "@/lib/useStoreSettings";
import { formatCurrency, formatYear } from "@/lib/formatters";
import PhoneInput from "@/components/PhoneInput";

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

  const setField = (key, val) => setValues((v) => ({ ...v, [key]: val }));

  const handleClose = (next) => {
    onOpenChange(next);
    if (!next) {
      setTimeout(() => {
        setValues(defaultValues);
        setDone(false);
        setSubmitting(false);
      }, 200);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Required field validation
    for (const f of fields) {
      if (f.required && !String(values[f.key] || "").trim()) {
        toast.error(`Preencha o campo: ${f.label}`);
        return;
      }
      // Phone fields must match their confirmation
      if (f.type === "phone") {
        const main = String(values[f.key] || "").trim();
        const confirm = String(values[f.key + CONFIRM_SUFFIX] || "").trim();
        if (main && main !== confirm) {
          toast.error("Os números de telefone não conferem. Confirme o número.");
          return;
        }
      }
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
        toast.error("Tivemos um problema inesperado. Tente novamente mais tarde.");
      } else {
        setDone(true);
      }
    } catch {
      toast.error("Tivemos um problema inesperado. Tente novamente mais tarde.");
    } finally {
      setSubmitting(false);
    }
  };

  const yearStr = formatYear(vehicle?.manufacture_year, vehicle?.year);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
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
                  onChange={(v) => setField(f.key, v)}
                  onConfirmChange={(v) => setField(f.key + CONFIRM_SUFFIX, v)}
                />
              ))}

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
                Ao enviar, você concorda em receber contato no canal informado.
              </p>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function FieldRow({ field, value, confirmValue, onChange, onConfirmChange }) {
  const id = `intf-${field.key}`;
  const phonesMatch = value && value === confirmValue;

  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs font-medium">
        {field.label}
        {field.required && <span className="text-destructive ml-1">*</span>}
      </Label>

      {field.type === "phone" ? (
        <div className="space-y-2">
          <PhoneInput
            value={value}
            onChange={onChange}
            placeholder={field.placeholder}
            required={field.required}
          />
          <Label className="text-[11px] font-medium text-muted-foreground">
            Confirme seu telefone
            {field.required && <span className="text-destructive ml-1">*</span>}
          </Label>
          <PhoneInput
            value={confirmValue}
            onChange={onConfirmChange}
            placeholder={field.placeholder}
            required={field.required}
          />
          {confirmValue && !phonesMatch && (
            <p className="text-[11px] text-destructive">Os números não conferem.</p>
          )}
        </div>
      ) : field.type === "textarea" ? (
        <Textarea
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          rows={3}
          className="rounded-xl resize-none"
        />
      ) : field.type === "select" ? (
        <Select value={value} onValueChange={onChange}>
          <SelectTrigger className="h-11 rounded-xl">
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
      ) : (
        <Input
          id={id}
          type={field.type === "number" ? "number" : field.type === "email" ? "email" : "text"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          className="h-11 rounded-xl"
        />
      )}
    </div>
  );
}