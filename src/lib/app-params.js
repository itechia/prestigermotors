/**
 * Parâmetros globais do app.
 * Remove dependência do Base44 — agora usa apenas variáveis de ambiente Vite.
 */
export const appParams = {
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL ?? '',
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY ?? '',
};
