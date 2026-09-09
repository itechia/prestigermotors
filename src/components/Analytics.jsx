'use client';

import { useEffect, useState } from "react";
import Script from "next/script";
import { usePathname, useSearchParams } from "next/navigation";
import { CONSENT_EVENT, readConsent } from "@/lib/cookieConsent";

const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || "";

// Google Analytics 4 com Consent Mode: os cookies de análise só são gravados
// depois que o visitante aceita no aviso de cookies. Sem a variável
// NEXT_PUBLIC_GA_MEASUREMENT_ID configurada, nada é carregado.
export default function Analytics() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [consent, setConsent] = useState(null);

  useEffect(() => {
    setConsent(readConsent());
    const onChange = (event) => setConsent(event.detail);
    window.addEventListener(CONSENT_EVENT, onChange);
    return () => window.removeEventListener(CONSENT_EVENT, onChange);
  }, []);

  // Propaga a decisão do visitante para o gtag já carregado.
  useEffect(() => {
    if (!GA_ID || !window.gtag) return;
    window.gtag("consent", "update", {
      analytics_storage: consent === "granted" ? "granted" : "denied",
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
    });
  }, [consent]);

  // O App Router navega sem recarregar a página: cada rota vira um page_view.
  useEffect(() => {
    if (!GA_ID || consent !== "granted" || !window.gtag) return;
    const query = searchParams?.toString();
    window.gtag("event", "page_view", {
      page_path: query ? `${pathname}?${query}` : pathname,
      page_location: window.location.href,
      page_title: document.title,
    });
  }, [pathname, searchParams, consent]);

  if (!GA_ID) return null;

  return (
    <>
      <Script
        id="ga-consent-default"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            window.gtag = window.gtag || gtag;
            gtag('consent', 'default', {
              analytics_storage: 'denied',
              ad_storage: 'denied',
              ad_user_data: 'denied',
              ad_personalization: 'denied'
            });
          `,
        }}
      />
      <Script
        id="ga-src"
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
      />
      <Script
        id="ga-init"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            gtag('js', new Date());
            gtag('config', '${GA_ID}', { send_page_view: false, anonymize_ip: true });
          `,
        }}
      />
    </>
  );
}
