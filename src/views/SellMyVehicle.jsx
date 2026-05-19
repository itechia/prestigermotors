import React, { useEffect } from "react";
import { motion } from "framer-motion";
import { DollarSign, ShieldCheck, Clock, ArrowRight } from "lucide-react";
import SellLeadForm from "../components/sell/SellLeadForm";
import { useLeadPrefillFromLocation } from "@/lib/prefillParams";
import { useStoreSettings } from "@/lib/useStoreSettings";

export default function SellMyVehicle() {
  const leadPrefill = useLeadPrefillFromLocation();
  const settings = useStoreSettings();

  // Always start at the top so the user sees the hero/intro on entry
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, []);

  if (settings.sell_page_enabled === false) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <div className="bg-card border border-border/50 rounded-2xl p-8">
          <h1 className="font-display font-bold text-2xl">Pagina indisponivel</h1>
          <p className="text-sm text-muted-foreground mt-2">
            O envio de veiculos esta temporariamente desativado.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 md:pt-12 pb-2 md:pb-10">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="text-center mb-8 md:mb-10"
      >
        <span className="inline-block px-3 py-1 rounded-full bg-accent/20 text-foreground dark:text-accent text-[11px] font-semibold uppercase tracking-wider border border-accent/30">
          Compramos seu veículo
        </span>
        <h1 className="font-display font-bold text-3xl md:text-5xl mt-3 leading-tight text-balance">
          Quer vender seu veículo? <br className="hidden sm:block" />
          <span className="price-gradient">A gente faz uma proposta.</span>
        </h1>
        <p className="text-muted-foreground mt-3 max-w-xl mx-auto">
          Envie as informações e fotos do seu veículo. Nossa equipe avalia e entra em contato com a melhor oferta.
        </p>
      </motion.div>

      {/* Trust pills */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-10">
        <Pill icon={Clock} title="Resposta rápida" desc="Retornamos em até 24h úteis" />
        <Pill icon={ShieldCheck} title="Sem compromisso" desc="Avaliação 100% gratuita" />
        <Pill icon={DollarSign} title="Pagamento ágil" desc="Negociamos à vista ou em troca" />
      </div>

      <SellLeadForm defaultValues={leadPrefill} />

      <div className="text-center mt-6 text-xs text-muted-foreground flex items-center justify-center gap-1">
        Ao enviar, você concorda em ser contactado pela equipe da loja
        <ArrowRight className="w-3 h-3" />
      </div>
    </div>
  );
}

function Pill({ icon: Icon, title, desc }) {
  return (
    <div className="bg-card border border-border/50 rounded-2xl p-4 flex items-start gap-3">
      <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0">
        <Icon className="w-4 h-4" />
      </div>
      <div className="min-w-0">
        <div className="font-semibold text-sm">{title}</div>
        <div className="text-xs text-muted-foreground">{desc}</div>
      </div>
    </div>
  );
}
