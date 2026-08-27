'use client';

import { useQuery } from "@tanstack/react-query";
import { adminFetch } from "@/lib/adminApi";

export const SITE_PAGES_QUERY_KEY = ["adminSitePages"];

// Lista as páginas do site (política de privacidade, termos, LGPD...) criadas
// pelo admin. Compartilhado entre o gerenciador (SitePagesManager) e o
// seletor de páginas no editor de links do rodapé (SettingsFooter).
export function useSitePages() {
  const query = useQuery({
    queryKey: SITE_PAGES_QUERY_KEY,
    queryFn: () => adminFetch("/api/admin/site-pages"),
  });
  return { ...query, pages: query.data?.pages || [] };
}
