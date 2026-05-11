import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'
import { queryClientInstance } from '@/lib/query-client'
import { base44 } from '@/api/base44Client'
import { SETTINGS_SINGLETON_QUERY_KEY } from '@/lib/defaults'

// Dispara as queries críticas ANTES do React montar — dados chegam mais cedo
const FIVE_MIN = 5 * 60 * 1000;
queryClientInstance.prefetchQuery({
  queryKey: ["vehicles"],
  queryFn: () => base44.entities.Vehicle.list("-created_date", 200),
  staleTime: FIVE_MIN,
});
queryClientInstance.prefetchQuery({
  queryKey: SETTINGS_SINGLETON_QUERY_KEY,
  queryFn: async () => {
    const list = await base44.entities.StoreSettings.list("-updated_date", 1);
    return list[0] || null;
  },
  staleTime: FIVE_MIN,
});

// Registra o Service Worker apenas em produção — nunca no dev server do Vite,
// pois o SW cachearia módulos HMR e causaria tela branca ao servir arquivos antigos.
if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)