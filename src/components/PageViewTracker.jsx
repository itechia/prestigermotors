'use client';

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { track } from "@/lib/analytics";

// Registra uma visualização de página a cada navegação do site público.
// O painel administrativo não é medido.
export default function PageViewTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname || pathname.startsWith("/admin")) return;
    track("page_view");
  }, [pathname]);

  return null;
}
