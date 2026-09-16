'use client';

import React, { useEffect, useState } from "react";
import { Bell, X, Share } from "lucide-react";
import { toast } from "sonner";
import { readConsent, CONSENT_EVENT } from "@/lib/cookieConsent";
import { useStoreSettings } from "@/lib/useStoreSettings";
import {
  fetchPushConfig,
  getExistingSubscription,
  getPermission,
  isIOS,
  isPushSupported,
  isStandalone,
  markDismissed,
  subscribeToPush,
  wasRecentlyDismissed,
} from "@/lib/pushClient";

// Convite para receber as ofertas por notificação.
//
// Não pede cadastro: o visitante clica em "Quero receber", o navegador pergunta
// a permissão e pronto. Nenhum dado pessoal é coletado.
//
// Só aparece depois que o aviso de cookies foi respondido — dois banners ao
// mesmo tempo na tela é o jeito mais rápido de fazer o visitante fechar os dois
// sem ler.
const DELAY_MS = 6000;

export default function PushOptIn() {
  const settings = useStoreSettings();
  const [mode, setMode] = useState(null); // null | 'ask' | 'ios-hint'
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!isPushSupported()) return;
    if (wasRecentlyDismissed()) return;

    let timer = null;
    let cancelled = false;

    const decide = async () => {
      // Sem chaves VAPID no servidor não há notificação nenhuma para oferecer —
      // nem o convite normal, nem a dica de instalação no iPhone.
      const { enabled } = await fetchPushConfig().catch(() => ({ enabled: false }));
      if (cancelled || !enabled) return;

      // No iOS, push exige o site instalado na tela de início (iOS 16.4+).
      // No Safari comum não há permissão a pedir — só dá para explicar como
      // instalar.
      if (isIOS() && !isStandalone()) {
        setMode("ios-hint");
        return;
      }

      if (getPermission() !== "default") return;

      const existing = await getExistingSubscription().catch(() => null);
      if (cancelled || existing) return;
      setMode("ask");
    };

    const start = () => {
      timer = window.setTimeout(() => {
        decide();
      }, DELAY_MS);
    };

    // Espera a decisão sobre os cookies antes de aparecer.
    if (readConsent() !== null) {
      start();
    } else {
      const onConsent = () => start();
      window.addEventListener(CONSENT_EVENT, onConsent, { once: true });
      return () => {
        cancelled = true;
        window.removeEventListener(CONSENT_EVENT, onConsent);
        if (timer) window.clearTimeout(timer);
      };
    }

    return () => {
      cancelled = true;
      if (timer) window.clearTimeout(timer);
    };
  }, []);

  if (!mode) return null;

  const storeName = settings?.store_name || "a loja";

  const dismiss = () => {
    markDismissed();
    setMode(null);
  };

  const accept = async () => {
    setBusy(true);
    try {
      await subscribeToPush();
      markDismissed();
      setMode(null);
      toast.success("Pronto! Você vai receber nossas ofertas.");
    } catch (error) {
      // Permissão negada é escolha do visitante, não erro: o navegador não
      // deixa perguntar de novo, então só fechamos.
      if (error?.message === "Permissão negada.") {
        markDismissed();
        setMode(null);
      } else {
        toast.error(error?.message || "Não foi possível ativar as notificações.");
      }
    } finally {
      setBusy(false);
    }
  };

  const isIosHint = mode === "ios-hint";

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Receber notificações"
      className="fixed inset-x-0 bottom-[calc(4rem+var(--safe-bottom,0px))] md:bottom-6 z-50 px-3 md:px-6 animate-in fade-in slide-in-from-bottom-4 duration-300"
    >
      <div className="max-w-3xl mx-auto bg-card border border-border shadow-lg rounded-2xl p-4 md:p-5 flex flex-col md:flex-row md:items-center gap-4">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0">
            {isIosHint ? (
              <Share className="w-4 h-4" aria-hidden="true" />
            ) : (
              <Bell className="w-4 h-4" aria-hidden="true" />
            )}
          </div>
          <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
            {isIosHint ? (
              <>
                Para receber as ofertas da {storeName} no iPhone, toque em{" "}
                <span className="text-foreground font-semibold">Compartilhar</span> e depois em{" "}
                <span className="text-foreground font-semibold">Adicionar à Tela de Início</span>.
              </>
            ) : (
              <>
                Quer receber as promoções da{" "}
                <span className="text-foreground font-semibold">{storeName}</span> em primeira mão?
                Avisamos quando chegar veículo novo ou desconto.
              </>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            type="button"
            onClick={dismiss}
            className="flex-1 md:flex-none h-10 px-4 rounded-full border border-input bg-background hover:bg-secondary text-xs font-semibold transition-colors"
          >
            {isIosHint ? "Entendi" : "Agora não"}
          </button>
          {!isIosHint && (
            <button
              type="button"
              onClick={accept}
              disabled={busy}
              className="flex-1 md:flex-none h-10 px-5 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-semibold transition-colors disabled:opacity-60"
            >
              {busy ? "Ativando..." : "Quero receber"}
            </button>
          )}
          <button
            type="button"
            onClick={dismiss}
            aria-label="Fechar convite de notificações"
            className="hidden md:inline-flex w-9 h-9 items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}
