'use client';

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { MessageCircle, Tag } from "lucide-react";
import { useStoreSettings } from "@/lib/useStoreSettings";
import { track } from "@/lib/analytics";

// CTA fixo no mobile: aparece depois que o visitante rola a primeira dobra,
// para que o contato esteja sempre a um toque de distância.
export default function MobileStickyCta({ variant = "catalog" }) {
  const s = useStoreSettings();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 420);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const whatsapp = (s.whatsapp_number || "").replace(/\D/g, "");
  const whatsappHref = whatsapp
    ? `https://wa.me/${whatsapp}?text=${encodeURIComponent(
        `Olá! Vi o site da ${s.store_name || "loja"} e gostaria de atendimento.`
      )}`
    : "";

  const showSell = variant === "catalog" && s.sell_page_enabled !== false;
  if (!whatsappHref && !showSell) return null;

  return (
    <div
      className={[
        "md:hidden fixed left-0 right-0 z-30 px-3 pb-2 pt-2",
        "bg-background/95 backdrop-blur-md border-t border-border",
        "transition-all duration-300",
        visible ? "translate-y-0 opacity-100" : "translate-y-full opacity-0 pointer-events-none",
      ].join(" ")}
      style={{ bottom: "calc(4rem + var(--safe-bottom, 0px))" }}
    >
      <div className="flex gap-2">
        {whatsappHref && (
          <a
            href={whatsappHref}
            target="_blank"
            rel="noreferrer noopener"
            onClick={() => track("whatsapp_click", { source: "cta-fixo" })}
            className="flex-1 h-11 rounded-full bg-primary text-primary-foreground text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-2"
          >
            <MessageCircle className="w-4 h-4" aria-hidden="true" />
            Falar no WhatsApp
          </a>
        )}
        {showSell && (
          <Link
            href="/vender"
            className="flex-1 h-11 rounded-full border border-input bg-background text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-2"
          >
            <Tag className="w-4 h-4" aria-hidden="true" />
            Vender
          </Link>
        )}
      </div>
    </div>
  );
}
