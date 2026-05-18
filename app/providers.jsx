'use client';

import { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as SonnerToaster } from 'sonner';
import { AuthProvider } from '@/lib/AuthContext';
import { ThemeProvider } from '@/lib/ThemeContext';
import { usePathname } from 'next/navigation';

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

export function Providers({ children }) {
  const [queryClient] = useState(makeQueryClient);
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

  return (
    <ThemeProvider>
      <AuthProvider>
        <QueryClientProvider client={queryClient}>
          {children}
          <Toaster />
          <SonnerToaster position="top-center" richColors />
        </QueryClientProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
