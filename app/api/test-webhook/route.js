import { lookup } from 'node:dns/promises';
import net from 'node:net';
import { NextResponse } from 'next/server';
import { requireAdminContext } from '../admin/_utils';

export const runtime = 'nodejs';

const SAMPLE_PAYLOADS = {
  interest: {
    type: 'interest',
    sent_at: new Date().toISOString(),
    store: { name: 'Sua Loja', whatsapp: '5511999999999', phone: '1133334444' },
    vehicle: {
      id: 'test-id',
      url: 'https://seusite.com/veiculo/test-id',
      brand: 'Toyota', model: 'Corolla', version: 'XEi 2.0',
      year: 2024, manufacture_year: 2023, year_display: '2023/2024',
      price: 145000, price_old: 159000, mileage: 12500,
      fuel_type: 'flex', transmission: 'automatico', color: 'prata',
      body_type: 'sedan', condition: 'seminovo', status: 'disponivel',
      featured: true, images: [], features: ['Ar-condicionado digital'],
    },
    form: { name: 'Joao da Silva', phone: '+5511999999999', email: 'joao@exemplo.com', message: 'Teste de webhook' },
  },
  sell: {
    type: 'sell_lead',
    sent_at: new Date().toISOString(),
    store: { name: 'Sua Loja', whatsapp: '5511999999999', phone: '1133334444' },
    proposal: { id: 'test-id', url: 'https://seusite.com/admin/propostas?id=test-id', status: 'novo', created_date: new Date().toISOString() },
    owner: { name: 'Maria Souza', email: 'maria@exemplo.com', phone: '+5511988887777', city: 'Sao Paulo' },
    vehicle: { brand: 'Honda', model: 'Civic', version: 'EXL 2.0', year: 2022, manufacture_year: 2021, year_display: '2021/2022', mileage: 35000, fuel_type: 'flex', transmission: 'automatico', color: 'preto', condition_notes: 'Unico dono', asking_price: 110000, images: [] },
  },
};

function isPrivateIp(address) {
  const family = net.isIP(address);
  if (family === 4) {
    const [a, b] = address.split('.').map(Number);
    return (
      a === 10 ||
      a === 127 ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      a === 0
    );
  }

  if (family === 6) {
    const normalized = address.toLowerCase();
    return (
      normalized === '::1' ||
      normalized === '::' ||
      normalized.startsWith('fc') ||
      normalized.startsWith('fd') ||
      normalized.startsWith('fe80:')
    );
  }

  return true;
}

async function assertSafeWebhookUrl(rawUrl) {
  let parsed;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new Error('URL invalida.');
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new Error('Use apenas URLs HTTP ou HTTPS.');
  }

  if (parsed.username || parsed.password) {
    throw new Error('Credenciais devem ser configuradas no campo Basic Auth.');
  }

  const hostname = parsed.hostname.toLowerCase();
  if (hostname === 'localhost' || hostname.endsWith('.localhost')) {
    throw new Error('URLs locais nao sao permitidas.');
  }

  if (net.isIP(hostname) && isPrivateIp(hostname)) {
    throw new Error('URLs privadas ou locais nao sao permitidas.');
  }

  const addresses = await lookup(hostname, { all: true, verbatim: false });
  if (!addresses.length || addresses.some(({ address }) => isPrivateIp(address))) {
    throw new Error('O destino do webhook resolve para uma rede privada ou local.');
  }

  return parsed.toString();
}

export async function POST(request) {
  try {
    const context = await requireAdminContext(request, { adminOnly: true, moduleKey: 'configuracoes' });
    if (context.error) return context.error;

    const body = await request.json().catch(() => ({}));
    const { kind, url, auth_enabled, auth_user, auth_pass } = body;

    if (!url) {
      return NextResponse.json({ error: 'url e obrigatorio' }, { status: 400 });
    }

    const safeUrl = await assertSafeWebhookUrl(url);
    const headers = { 'Content-Type': 'application/json' };
    if (auth_enabled && auth_user) {
      const token = Buffer.from(`${auth_user}:${auth_pass || ''}`).toString('base64');
      headers.Authorization = `Basic ${token}`;
    }

    const payload = SAMPLE_PAYLOADS[kind] || SAMPLE_PAYLOADS.interest;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    let resp;
    try {
      resp = await fetch(safeUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }

    return NextResponse.json({ ok: resp.ok, status: resp.status });
  } catch (error) {
    const message = error?.name === 'AbortError' ? 'Tempo limite ao chamar o webhook.' : error.message;
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Simulated-User-Id',
    },
  });
}
