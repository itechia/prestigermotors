'use client';

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { trackWhenAllowed, track } from "@/lib/analytics";

// Registra uma visualização de página a cada navegação do site público.
// O painel administrativo não é medido.
export default function PageViewTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname || pathname.startsWith("/admin")) return undefined;
    return trackWhenAllowed(() => track("page_view"));
  }, [pathname]);

  return null;
}
