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
    form: { name: 'João da Silva', phone: '+5511999999999', email: 'joao@exemplo.com', message: 'Teste de webhook' },
  },
  sell: {
    type: 'sell_lead',
    sent_at: new Date().toISOString(),
    store: { name: 'Sua Loja', whatsapp: '5511999999999', phone: '1133334444' },
    proposal: { id: 'test-id', url: 'https://seusite.com/admin/propostas?id=test-id', status: 'novo', created_date: new Date().toISOString() },
    owner: { name: 'Maria Souza', email: 'maria@exemplo.com', phone: '+5511988887777', city: 'São Paulo' },
    vehicle: { brand: 'Honda', model: 'Civic', version: 'EXL 2.0', year: 2022, manufacture_year: 2021, year_display: '2021/2022', mileage: 35000, fuel_type: 'flex', transmission: 'automatico', color: 'preto', condition_notes: 'Único dono', asking_price: 110000, images: [] },
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { kind, url, auth_enabled, auth_user, auth_pass } = req.body || {};
    if (!url) return res.status(400).json({ error: 'url é obrigatório' });

    const headers = { 'Content-Type': 'application/json' };
    if (auth_enabled && auth_user) {
      const token = Buffer.from(`${auth_user}:${auth_pass || ''}`).toString('base64');
      headers['Authorization'] = `Basic ${token}`;
    }

    const payload = SAMPLE_PAYLOADS[kind] || SAMPLE_PAYLOADS.interest;
    const resp = await fetch(url, { method: 'POST', headers, body: JSON.stringify(payload) });
    const text = await resp.text().catch(() => '');
    return res.status(200).json({ ok: resp.ok, status: resp.status, response: text?.slice(0, 500) || null });
  } catch (error) {
    return res.status(500).json({ ok: false, error: error.message });
  }
}
