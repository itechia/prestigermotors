import { createClient } from '@supabase/supabase-js';

const supabaseUrl     = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    })
  : buildLocalClient();

// ─────────────────────────────────────────────────────────────
// Backend local completo (localStorage) — sem banco de dados
// ─────────────────────────────────────────────────────────────
function buildLocalClient() {
  const SESSION_KEY  = 'pm_local_session';
  const ADMIN_EMAIL  = import.meta.env.VITE_LOCAL_ADMIN_EMAIL    || 'admin@prestiger.com';
  const ADMIN_PASS   = import.meta.env.VITE_LOCAL_ADMIN_PASSWORD || 'admin123';

  // ── Utilitários ────────────────────────────────────────────
  const uid  = () => crypto.randomUUID();
  const ts   = () => new Date().toISOString();

  function readTable(name) {
    try { return JSON.parse(localStorage.getItem(`pm_${name}`) || '[]'); }
    catch { return []; }
  }
  function writeTable(name, rows) {
    localStorage.setItem(`pm_${name}`, JSON.stringify(rows));
  }

  // ── Auth ───────────────────────────────────────────────────
  const auth = {
    getSession() {
      const raw = localStorage.getItem(SESSION_KEY);
      return Promise.resolve({ data: { session: raw ? JSON.parse(raw) : null } });
    },
    getUser() {
      const raw = localStorage.getItem(SESSION_KEY);
      const session = raw ? JSON.parse(raw) : null;
      return Promise.resolve({ data: { user: session?.user ?? null } });
    },
    onAuthStateChange(callback) {
      // Dispara o estado inicial de forma assíncrona
      const raw = localStorage.getItem(SESSION_KEY);
      const session = raw ? JSON.parse(raw) : null;
      setTimeout(() => callback('INITIAL_SESSION', session), 0);

      const handler = (e) => callback(e.detail.event, e.detail.session);
      window.addEventListener('_pm_auth', handler);
      return { data: { subscription: { unsubscribe: () => window.removeEventListener('_pm_auth', handler) } } };
    },
    async signInWithPassword({ email, password }) {
      if (email.trim() === ADMIN_EMAIL && password === ADMIN_PASS) {
        const user    = { id: 'local-admin', email: ADMIN_EMAIL, role: 'admin' };
        const session = { user, access_token: 'local-dev-token' };
        localStorage.setItem(SESSION_KEY, JSON.stringify(session));
        window.dispatchEvent(new CustomEvent('_pm_auth', { detail: { event: 'SIGNED_IN', session } }));
        return { data: { session, user }, error: null };
      }
      return { data: null, error: { message: 'E-mail ou senha incorretos' } };
    },
    async signOut() {
      localStorage.removeItem(SESSION_KEY);
      window.dispatchEvent(new CustomEvent('_pm_auth', { detail: { event: 'SIGNED_OUT', session: null } }));
      return { error: null };
    },
  };

  // ── Query builder (espelha a API do Supabase) ──────────────
  function buildQuery(tableName) {
    let _op      = 'select';
    let _payload = null;
    let _filters = [];   // [{col, val}]
    let _order   = null; // {col, ascending}
    let _limit   = 10_000;

    const applyFilters = (rows) =>
      rows.filter(row => _filters.every(({ col, val }) => row[col] === val));

    const execute = () => {
      const rows = readTable(tableName);

      if (_op === 'select') {
        let result = applyFilters(rows);
        if (_order) {
          const { col, ascending } = _order;
          result.sort((a, b) => {
            const va = a[col] ?? '';
            const vb = b[col] ?? '';
            return (va < vb ? -1 : va > vb ? 1 : 0) * (ascending ? 1 : -1);
          });
        }
        return Promise.resolve({ data: result.slice(0, _limit), error: null });
      }

      if (_op === 'insert') {
        const newRow = { id: uid(), created_date: ts(), updated_date: ts(), ..._payload };
        rows.push(newRow);
        writeTable(tableName, rows);
        return Promise.resolve({ data: newRow, error: null });
      }

      if (_op === 'update') {
        const idx = rows.findIndex(r => _filters.every(({ col, val }) => r[col] === val));
        if (idx === -1) return Promise.resolve({ data: null, error: { message: 'Not found' } });
        rows[idx] = { ...rows[idx], ..._payload, updated_date: ts() };
        writeTable(tableName, rows);
        return Promise.resolve({ data: rows[idx], error: null });
      }

      if (_op === 'delete') {
        writeTable(tableName, rows.filter(r => !_filters.every(({ col, val }) => r[col] === val)));
        return Promise.resolve({ data: null, error: null });
      }

      return Promise.resolve({ data: null, error: null });
    };

    const q = {
      select(_c = '*') { _op = 'select'; return q; },
      insert(data)     { _op = 'insert'; _payload = Array.isArray(data) ? data[0] : data; return q; },
      update(data)     { _op = 'update'; _payload = data; return q; },
      delete()         { _op = 'delete'; return q; },
      eq(col, val)     { _filters.push({ col, val }); return q; },
      order(col, { ascending = true } = {}) { _order = { col, ascending }; return q; },
      limit(n)         { _limit = n; return q; },
      single()         { return execute().then(r => ({ ...r, data: Array.isArray(r.data) ? r.data[0] ?? null : r.data })); },
      // Thenable — permite `await query` sem .single()
      then(res, rej)   { return execute().then(res, rej); },
    };

    return q;
  }

  // ── Storage (base64 em localStorage) ──────────────────────
  const storage = {
    from(_bucket) {
      return {
        upload(path, file) {
          return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
              try { localStorage.setItem(`pm_file_${path}`, e.target.result); } catch {}
              resolve({ data: { path }, error: null });
            };
            reader.readAsDataURL(file);
          });
        },
        getPublicUrl(path) {
          const dataUrl = localStorage.getItem(`pm_file_${path}`) || '';
          return { data: { publicUrl: dataUrl } };
        },
      };
    },
  };

  return { auth, from: (table) => buildQuery(table), storage };
}
