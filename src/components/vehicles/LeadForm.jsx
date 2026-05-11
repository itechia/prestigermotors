import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { MessageCircle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/formatters";
import { useStoreSettings } from "@/lib/useStoreSettings";

export default function LeadForm({ vehicle }) {
  const settings = useStoreSettings();
  const [form, setForm] = useState({ name: "", phone: "", message: "" });
  const [sent, setSent] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name || !form.phone) {
      toast.error("Preencha nome e telefone");
      return;
    }
    const vehicleLabel = `${vehicle.brand} ${vehicle.model} ${vehicle.year}`;
    const template =
      settings.lead_form_message ||
      "Olá! Sou {name}. Tenho interesse no {vehicle} ({price}). Meu telefone: {phone}";
    const base = template
      .replace(/{name}/g, form.name)
      .replace(/{vehicle}/g, vehicleLabel)
      .replace(/{price}/g, formatCurrency(vehicle.price))
      .replace(/{phone}/g, form.phone);
    const full = form.message ? `${base}\n\n${form.message}` : base;
    window.open(`https://wa.me/${settings.whatsapp_number}?text=${encodeURIComponent(full)}`, "_blank");
    setSent(true);
  };

  if (sent) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-3xl p-6 text-center">
        <div className="w-12 h-12 rounded-full bg-green-600 text-white flex items-center justify-center mx-auto mb-3">
          <CheckCircle2 className="w-6 h-6" />
        </div>
        <h3 className="font-display font-bold text-lg text-green-900">Pedido enviado!</h3>
        <p className="text-sm text-green-800 mt-1">
          Um consultor vai te responder no WhatsApp em alguns minutos.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border/50 rounded-3xl p-5 md:p-6">
      <h3 className="font-display font-bold text-lg">{settings.lead_form_title}</h3>
      <p className="text-xs text-muted-foreground mb-4">{settings.lead_form_subtitle}</p>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">Nome</Label>
          <Input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Como prefere ser chamado?"
            className="h-11 rounded-xl"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">WhatsApp</Label>
          <Input
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            placeholder="(11) 99999-9999"
            className="h-11 rounded-xl"
            type="tel"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">
            Mensagem <span className="text-muted-foreground font-normal">(opcional)</span>
          </Label>
          <Textarea
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
            placeholder="Quero negociar meu usado, tirar dúvidas..."
            rows={3}
            className="rounded-xl resize-none"
          />
        </div>
        <Button
          type="submit"
          className="w-full rounded-full h-12 bg-green-600 hover:bg-green-700 font-semibold"
        >
          <MessageCircle className="w-4 h-4 mr-2" />
          Falar com consultor
        </Button>
        <p className="text-[10px] text-muted-foreground text-center leading-tight pt-1">
          Ao enviar, você concorda em receber contato no WhatsApp informado.
        </p>
      </form>
    </div>
  );
}