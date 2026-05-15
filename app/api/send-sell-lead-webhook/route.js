import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function buildAuthHeader(settings) {
  if (settings.sell_webhook_auth_enabled && settings.sell_webhook_auth_user) {
    const token = Buffer.from(
      `${settings.sell_webhook_auth_user}:${settings.sell_webhook_auth_pass || ''}`
    ).toString('base64');
    return { Authorization: `Basic ${token}` };
  }
  return {};
}

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { lead_id } = body;

    if (!lead_id) {
      return NextResponse.json({ error: 'lead_id é obrigatório' }, { status: 400 });
    }

    const [{ data: settingsList }, { data: leadList }] = await Promise.all([
      supabase.from('store_settings').select('*').limit(1),
      supabase.from('sell_leads').select('*').eq('id', lead_id).limit(1),
    ]);

    const settings = settingsList?.[0];
    const lead     = leadList?.[0];

    if (!settings?.sell_webhook_enabled || !settings?.sell_webhook_url) {
      return NextResponse.json({ ok: true, skipped: 'Webhook de venda não está ativo' });
    }
    if (!lead) {
      return NextResponse.json({ error: 'Proposta não encontrada' }, { status: 404 });
    }

    const payload = {
      type: 'sell_lead',
      sent_at: new Date().toISOString(),
      store: {
        name: settings.store_name,
        whatsapp: settings.whatsapp,
        phone: settings.phone,
      },
      lead: {
        id: lead.id,
        owner_name: lead.owner_name,
        owner_email: lead.owner_email,
        owner_phone: lead.owner_phone,
        owner_city: lead.owner_city,
        brand: lead.brand,
        model: lead.model,
        version: lead.version,
        year: lead.year,
        manufacture_year: lead.manufacture_year,
        mileage: lead.mileage,
        fuel_type: lead.fuel_type,
        transmission: lead.transmission,
        color: lead.color,
        condition_notes: lead.condition_notes,
        asking_price: lead.asking_price,
        images: lead.images || [],
        status: lead.status,
        created_date: lead.created_date,
      },
    };

    const headers = {
      'Content-Type': 'application/json',
      ...buildAuthHeader(settings),
    };

    const resp = await fetch(settings.sell_webhook_url, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    const text = await resp.text().catch(() => '');
    return NextResponse.json({
      ok: resp.ok,
      status: resp.status,
      response: text?.slice(0, 500) || null,
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
