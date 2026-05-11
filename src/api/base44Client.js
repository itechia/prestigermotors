/**
 * Camada de compatibilidade: expõe a mesma interface do antigo Base44 SDK,
 * mas usa Supabase como backend.
 *
 * Todas as páginas e componentes que fazem:
 *   base44.entities.Vehicle.list(...)
 *   base44.entities.StoreSettings.update(...)
 *   base44.integrations.Core.UploadFile(...)
 *   base44.functions.invoke(...)
 *   base44.auth.me() / logout()
 * continuam funcionando sem nenhuma alteração.
 */
import { supabase } from '@/api/supabaseClient';

// ──────────────────────────────────────────────
// Utilitários internos
// ──────────────────────────────────────────────

/** Converte '-created_date' → { column:'created_date', ascending:false } */
function parseSortField(raw = '-created_date') {
  if (raw.startsWith('-')) return { column: raw.slice(1), ascending: false };
  return { column: raw, ascending: true };
}

/** Adiciona timestamps automáticos. */
function withTimestamps(data, isNew = false) {
  const now = new Date().toISOString();
  return isNew
    ? { ...data, created_date: now, updated_date: now }
    : { ...data, updated_date: now };
}

// ──────────────────────────────────────────────
// Fábrica de entity service (espelha Base44 API)
// ──────────────────────────────────────────────

function createEntityService(tableName) {
  return {
    /** list(sortField, limit) */
    async list(sortField = '-created_date', limit = 100) {
      const { column, ascending } = parseSortField(sortField);
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .order(column, { ascending })
        .limit(limit);
      if (error) throw error;
      return data ?? [];
    },

    /** filter({ field: value, ... }) */
    async filter(filters = {}) {
      let query = supabase.from(tableName).select('*');
      for (const [key, value] of Object.entries(filters)) {
        if (value !== undefined && value !== null) query = query.eq(key, value);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    },

    /** create(data) → retorna o registro criado */
    async create(data) {
      const { data: result, error } = await supabase
        .from(tableName)
        .insert(withTimestamps(data, true))
        .select()
        .single();
      if (error) throw error;

      // Dispara webhook de venda em background se for SellLead
      if (tableName === 'sell_leads' && result?.id) {
        fetch('/api/send-sell-lead-webhook', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lead_id: result.id }),
        }).catch(() => {});
      }

      return result;
    },

    /** update(id, data) → retorna o registro atualizado */
    async update(id, data) {
      const { data: result, error } = await supabase
        .from(tableName)
        .update(withTimestamps(data))
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return result;
    },

    /** delete(id) */
    async delete(id) {
      const { error } = await supabase.from(tableName).delete().eq('id', id);
      if (error) throw error;
    },
  };
}

// ──────────────────────────────────────────────
// Auth (espelha base44.auth.*)
// ──────────────────────────────────────────────

const auth = {
  /** Retorna o usuário atual com role='admin' (todos os logados são admins). */
  async me() {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) throw error ?? new Error('Não autenticado');
    return { ...user, role: 'admin' };
  },

  /** Faz logout; redireciona para redirectUrl se fornecido. */
  async logout(redirectUrl) {
    await supabase.auth.signOut();
    if (redirectUrl) window.location.href = redirectUrl;
  },

  /** Redireciona para a página de login. */
  redirectToLogin(returnUrl) {
    const redirect = returnUrl ? `?redirect=${encodeURIComponent(returnUrl)}` : '';
    window.location.href = `/admin/login${redirect}`;
  },
};

// ──────────────────────────────────────────────
// Integrações — Upload de arquivos (espelha base44.integrations.Core.UploadFile)
// ──────────────────────────────────────────────

const integrations = {
  Core: {
    /**
     * Faz upload de um arquivo para o Supabase Storage.
     * Retorna { file_url } para compatibilidade com a interface antiga.
     */
    async UploadFile({ file }) {
      const ext = file.name.split('.').pop();
      const safeName = file.name
        .replace(/\.[^/.]+$/, '')
        .replace(/[^a-zA-Z0-9]/g, '_')
        .slice(0, 60);
      const path = `${Date.now()}-${safeName}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('uploads')
        .upload(path, file, { cacheControl: '3600', upsert: false });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('uploads').getPublicUrl(path);
      return { file_url: data.publicUrl };
    },
  },
};

// ──────────────────────────────────────────────
// Funções serverless (espelha base44.functions.invoke)
// Redireciona para as Vercel API Routes em /api/
// ──────────────────────────────────────────────

const FUNCTION_ROUTES = {
  sendInterestWebhook: '/api/send-interest-webhook',
  sendSellLeadWebhook: '/api/send-sell-lead-webhook',
};

const functions = {
  async invoke(functionName, payload) {
    const endpoint = FUNCTION_ROUTES[functionName];
    if (!endpoint) throw new Error(`Função desconhecida: ${functionName}`);

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await response.json().catch(() => ({}));
    return { data };
  },
};

// ──────────────────────────────────────────────
// Exportação principal — mantém exatamente o shape do SDK antigo
// ──────────────────────────────────────────────

export const base44 = {
  entities: {
    Vehicle:       createEntityService('vehicles'),
    StoreSettings: createEntityService('store_settings'),
    SellLead:      createEntityService('sell_leads'),
    User:          createEntityService('profiles'),
  },
  auth,
  integrations,
  functions,
};
