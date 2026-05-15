'use client';

import { useState } from 'react';
import { useStoreSettings } from '@/lib/useStoreSettings';

export default function Error({ reset }) {
  const settings = useStoreSettings();
  const [reloading, setReloading] = useState(false);

  const handleReload = () => {
    setReloading(true);
    setTimeout(() => window.location.reload(), 1800);
  };

  return (
    <>
      {reloading && <ReloadOverlay logo={settings.logo_url} name={settings.store_name} />}

      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="max-w-sm w-full text-center space-y-6">

          {/* Ícone */}
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="w-10 h-10 text-destructive" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
          </div>

          {/* Texto */}
          <div className="space-y-2">
            <h1 className="font-display font-bold text-2xl text-foreground">Ops, algo deu errado</h1>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Ocorreu um erro inesperado. Você pode tentar novamente ou recarregar a página.
            </p>
          </div>

          {/* Botões */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={reset}
              className="inline-flex items-center justify-center rounded-full h-11 px-6 border border-input bg-background hover:bg-accent hover:text-accent-foreground text-sm font-medium transition-colors"
            >
              Tentar novamente
            </button>
            <button
              onClick={handleReload}
              className="inline-flex items-center justify-center rounded-full h-11 px-6 bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-medium transition-colors"
            >
              Recarregar página
            </button>
          </div>

          <button
            onClick={() => (window.location.href = '/')}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors underline-offset-4 hover:underline"
          >
            Ir para o catálogo
          </button>
        </div>
      </div>
    </>
  );
}

function ReloadOverlay({ logo, name }) {
  return (
    <>
      <style>{`
        @keyframes wheel-spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes hub-counter {
          from { transform: rotate(0deg); }
          to   { transform: rotate(-360deg); }
        }
        .wheel-spin    { animation: wheel-spin  1.1s linear infinite; }
        .hub-counter   { animation: hub-counter 1.1s linear infinite; }
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .fade-in-up { animation: fade-in-up 0.35s ease both; }
      `}</style>

      <div
        className="fixed inset-0 z-[9999] flex flex-col items-center justify-center gap-6"
        style={{ background: 'rgba(var(--background-rgb, 255,255,255), 0.97)', backdropFilter: 'blur(12px)' }}
      >
        {/* Roda */}
        <div className="relative fade-in-up" style={{ width: 120, height: 120 }}>
          {/* Aro externo girando */}
          <div className="wheel-spin absolute inset-0">
            {/* Rim */}
            <div className="absolute inset-0 rounded-full border-[5px] border-primary" />
            {/* Spokes */}
            {[0, 45, 90, 135].map(deg => (
              <div
                key={deg}
                className="absolute inset-0 flex items-center justify-center"
              >
                <div
                  style={{
                    width: '78%',
                    height: 4,
                    background: 'hsl(var(--primary))',
                    borderRadius: 2,
                    transform: `rotate(${deg}deg)`,
                  }}
                />
              </div>
            ))}
          </div>

          {/* Hub central — contra-gira para manter logo estático */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div
              className="hub-counter w-12 h-12 rounded-full border-[3px] border-primary bg-background flex items-center justify-center overflow-hidden shadow-md"
            >
              {logo ? (
                <img src={logo} alt={name} className="w-full h-full object-contain p-1" />
              ) : (
                <span className="text-[10px] font-black text-primary tracking-tight leading-none text-center px-1">
                  {(name || 'PM').slice(0, 4)}
                </span>
              )}
            </div>
          </div>
        </div>

        <p className="fade-in-up text-sm font-medium text-muted-foreground tracking-wide" style={{ animationDelay: '0.1s' }}>
          Carregando...
        </p>
      </div>
    </>
  );
}
