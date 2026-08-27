'use client';

import { useQuery } from "@tanstack/react-query";

async function fetchPublicSitePages() {
  const response = await fetch("/api/public/site-pages");
  if (!response.ok) throw new Error("Falha ao carregar páginas do site.");
  const payload = await response.json();
  return payload.pages ?? [];
}

// Páginas publicadas pelo admin (política de privacidade, termos, LGPD...),
// usado no rodapé público — aparecem automaticamente, sem precisar vincular
// manualmente nenhum link.
export function usePublicSitePages() {
  const { data } = useQuery({
    queryKey: ["public-site-pages"],
    queryFn: fetchPublicSitePages,
    staleTime: 5 * 60 * 1000,
  });
  return data ?? [];
}
