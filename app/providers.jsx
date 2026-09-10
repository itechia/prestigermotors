'use client';

import { Suspense, useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as SonnerToaster } from 'sonner';
import { AuthProvider } from '@/lib/AuthContext';
import { ThemeProvider } from '@/lib/ThemeContext';
import { usePathname } from 'next/navigation';
import CookieBanner from '@/components/CookieBanner';
import Analytics from '@/components/Analytics';
import PageViewTracker from '@/components/PageViewTracker';
import { SETTINGS_SINGLETON_QUERY_KEY } from '@/lib/defaults';

const makeQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        retry: 2,
        retryDelay: (attempt) => Math.min(800 * Math.pow(2, attempt), 6000),
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
      },
    },
  });

export function Providers({ children, initialSettings = null }) {
  // As configurações da loja (nome, logo, cores) chegam prontas do servidor.
  // Sem isso, o servidor renderizava o cabeçalho padrão e o cliente trocava
  // pelo logo real assim que a requisição voltava — o que dava erro de
  // hidratação quando a resposta chegava antes de o React terminar de hidratar.
  const [queryClient] = useState(() => {
    const client = makeQueryClient();
    if (initialSettings) {
      client.setQueryData(SETTINGS_SINGLETON_QUERY_KEY, initialSettings);
    }
    return client;
  });
  const pathname = usePathname();

  // Registra o Service Worker apenas em produção
  useEffect(() => {
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch(() => {});
      });
    }
  }, []);

  useEffect(() => {
    const unlockPageScroll = () => {
      const hasOpenDialog = document.querySelector('[role="dialog"], [data-state="open"][data-radix-popper-content-wrapper]');
      if (hasOpenDialog) return;
      if (document.body.style.overflow === 'hidden') document.body.style.overflow = '';
      if (document.documentElement.style.overflow === 'hidden') document.documentElement.style.overflow = '';
    };

    unlockPageScroll();
    const id = window.setTimeout(unlockPageScroll, 250);
    return () => window.clearTimeout(id);
  }, [pathname]);

  const isAdminRoute = pathname?.startsWith('/admin');

  return (
    <ThemeProvider>
      <AuthProvider>
        <QueryClientProvider client={queryClient}>
          {children}
          <Toaster />
          <SonnerToaster position="top-center" richColors />
          {!isAdminRoute && <CookieBanner />}
          {!isAdminRoute && <PageViewTracker />}
          <Suspense fallback={null}>
            <Analytics />
          </Suspense>
        </QueryClientProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
