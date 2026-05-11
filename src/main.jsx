import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'
import { queryClientInstance } from '@/lib/query-client'
import { supabase } from '@/api/supabaseClient'
import { SETTINGS_SINGLETON_QUERY_KEY } from '@/lib/defaults'
import { fetchVehiclesCatalog, VEHICLES_QUERY_KEY, FIVE_MIN } from '@/lib/vehicleQueries'

// Dispara as queries críticas ANTES do React montar — dados chegam mais cedo
queryClientInstance.prefetchQuery({
  queryKey: VEHICLES_QUERY_KEY,
  queryFn: fetchVehiclesCatalog,
  staleTime: FIVE_MIN,
});
queryClientInstance.prefetchQuery({
  queryKey: SETTINGS_SINGLETON_QUERY_KEY,
  queryFn: async () => {
    const { data } = await supabase
      .from("store_settings")
      .select("*")
      .order("updated_date", { ascending: false })
      .limit(1);
    return data?.[0] ?? null;
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