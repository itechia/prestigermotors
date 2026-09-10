'use client';

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Cookie, X } from "lucide-react";
import { readConsent, writeConsent } from "@/lib/cookieConsent";

// Aviso de cookies (LGPD): aparece na primeira visita e guarda a escolha.
// Enquanto o visitante não decide, os cookies de análise ficam desligados.
export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Só decide no cliente para não quebrar a hidratação.
    if (readConsent() === null) {
      const id = window.setTimeout(() => setVisible(true), 800);
      return () => window.clearTimeout(id);
    }
  }, []);

  if (!visible) return null;

  const decide = (value) => {
    writeConsent(value);
    setVisible(false);
  };

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Aviso de cookies"
      className="fixed inset-x-0 bottom-[calc(4rem+var(--safe-bottom,0px))] md:bottom-6 z-50 px-3 md:px-6 animate-in fade-in slide-in-from-bottom-4 duration-300"
    >
      <div className="max-w-3xl mx-auto bg-card border border-border shadow-lg rounded-2xl p-4 md:p-5 flex flex-col md:flex-row md:items-center gap-4">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0">
            <Cookie className="w-4 h-4" aria-hidden="true" />
          </div>
          <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
            Este site usa cookies necessários para funcionar. Isso nos ajuda a melhorar
            o catálogo e o atendimento. Veja a{" "}
            <Link href="/privacidade" className="text-foreground underline underline-offset-2">
              Política de Privacidade
            </Link>
            .
          </p>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            type="button"
            onClick={() => decide("denied")}
            className="flex-1 md:flex-none h-10 px-4 rounded-full border border-input bg-background hover:bg-secondary text-xs font-semibold transition-colors"
          >
            Só os necessários
          </button>
          <button
            type="button"
            onClick={() => decide("granted")}
            className="flex-1 md:flex-none h-10 px-5 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-semibold transition-colors"
          >
            Aceitar todos
          </button>
          <button
            type="button"
            onClick={() => decide("denied")}
            aria-label="Fechar aviso de cookies"
            className="hidden md:inline-flex w-9 h-9 items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}
