'use client';

import React, { useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { CheckCircle2, Clock, MessageCircle, ArrowRight, Car } from "lucide-react";
import { useStoreSettings } from "@/lib/useStoreSettings";

const CONTENT = {
  venda: {
    title: "Proposta enviada com sucesso!",
    lead: "Recebemos as informações do seu veículo. Nossa equipe vai avaliar e retornar com uma oferta.",
    steps: [
      "Analisamos as fotos e os dados enviados",
      "Comparamos com o valor de mercado da região",
      "Entramos em contato com a proposta pelo WhatsApp ou telefone",
    ],
  },
  interesse: {
    title: "Recebemos o seu interesse!",
    lead: "Um consultor vai falar com você para tirar dúvidas, agendar a visita e apresentar as condições.",
    steps: [
      "Conferimos a disponibilidade do veículo",
      "Preparamos as condições de pagamento e troca",
      "Entramos em contato pelo WhatsApp ou telefone",
    ],
  },
};

export default function ThankYou() {
  const settings = useStoreSettings();
  const searchParams = useSearchParams();
  const tipo = searchParams.get("tipo") === "interesse" ? "interesse" : "venda";
  const content = CONTENT[tipo];

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, []);

  const whatsapp = (settings.whatsapp_number || "").replace(/\D/g, "");

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="text-center"
      >
        <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-10 h-10 text-green-600 dark:text-green-400" aria-hidden="true" />
        </div>

        <h1 className="font-display font-bold text-3xl md:text-4xl text-balance">
          {content.title}
        </h1>
        <p className="text-muted-foreground mt-3 max-w-lg mx-auto leading-relaxed">
          {content.lead}
        </p>

        <div className="inline-flex items-center gap-2 mt-6 px-4 py-2 rounded-full bg-secondary text-sm">
          <Clock className="w-4 h-4" aria-hidden="true" />
          Resposta em até 24 horas úteis
        </div>
      </motion.div>

      <div className="bg-card border border-border/50 rounded-3xl p-6 md:p-8 mt-10 text-left">
        <h2 className="font-display font-bold text-lg mb-4">O que acontece agora</h2>
        <ol className="space-y-3">
          {content.steps.map((step, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                {i + 1}
              </span>
              <span className="text-sm text-muted-foreground leading-relaxed">{step}</span>
            </li>
          ))}
        </ol>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mt-8">
        <Link
          href="/"
          className="flex-1 inline-flex items-center justify-center gap-2 h-12 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-semibold transition-colors"
        >
          <Car className="w-4 h-4" aria-hidden="true" />
          Ver os veículos disponíveis
          <ArrowRight className="w-4 h-4" aria-hidden="true" />
        </Link>

        {whatsapp && (
          <a
            href={`https://wa.me/${whatsapp}`}
            target="_blank"
            rel="noreferrer noopener"
            className="flex-1 inline-flex items-center justify-center gap-2 h-12 rounded-full border border-input bg-background hover:bg-secondary text-sm font-semibold transition-colors"
          >
            <MessageCircle className="w-4 h-4" aria-hidden="true" />
            Falar agora no WhatsApp
          </a>
        )}
      </div>

      <p className="text-center text-xs text-muted-foreground mt-6">
        Guarde o nosso contato: se preferir, você pode adiantar a conversa pelo WhatsApp
        informando que já enviou o formulário.
      </p>
    </div>
  );
}
