import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function buildAuthHeader(settings) {
  if (settings.interest_webhook_auth_enabled && settings.interest_webhook_auth_user) {
    const token = Buffer.from(
      `${settings.interest_webhook_auth_user}:${settings.interest_webhook_auth_pass || ''}`
    ).toString('base64');
    return { Authorization: `Basic ${token}` };
  }
  return {};
}

function buildYearDisplay(manufacture, model) {
  if (manufacture && model && manufacture !== model) return `${manufacture}/${model}`;
  return String(model || manufacture || '');
}

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { vehicle_id, form_data, source_url } = body;

    if (!vehicle_id || !form_data || typeof form_data !== 'object') {
      return NextResponse.json(
        { error: 'vehicle_id e form_data são obrigatórios' },
        { status: 400 }
      );
    }

    const [{ data: settingsList }, { data: vehicleList }] = await Promise.all([
      supabase.from('store_settings').select('*').limit(1),
      supabase.from('vehicles').select('*').eq('id', vehicle_id).limit(1),
    ]);

    const settings = settingsList?.[0];
    const vehicle  = vehicleList?.[0];

    if (!settings?.interest_webhook_enabled || !settings?.interest_webhook_url) {
      return NextResponse.json(
        { error: 'Webhook de interesse não está ativo' },
        { status: 400 }
      );
    }
    if (!vehicle) {
      return NextResponse.json({ error: 'Veículo não encontrado' }, { status: 404 });
    }

    let vehicleUrl = `/veiculo/${vehicle.id}`;
    try {
      if (source_url) {
        const u = new URL(source_url);
        vehicleUrl = `${u.origin}/veiculo/${vehicle.id}`;
      }
    } catch (_) { /* mantém fallback relativo */ }

    const payload = {
      type: 'interest',
      sent_at: new Date().toISOString(),
      store: {
        name: settings.store_name,
        whatsapp: settings.whatsapp,
        phone: settings.phone,
      },
      vehicle: {
        id: vehicle.id,
        url: vehicleUrl,
        brand: vehicle.brand,
        model: vehicle.model,
        version: vehicle.version,
        year: vehicle.year,
        manufacture_year: vehicle.manufacture_year,
        year_display: buildYearDisplay(vehicle.manufacture_year, vehicle.year),
        price: vehicle.price,
        price_old: vehicle.price_old,
        mileage: vehicle.mileage,
        fuel_type: vehicle.fuel_type,
        transmission: vehicle.transmission,
        color: vehicle.color,
        body_type: vehicle.body_type,
        condition: vehicle.condition,
        status: vehicle.status,
        featured: vehicle.featured,
        images: vehicle.images || [],
        features: vehicle.features || [],
      },
      form: form_data,
    };

    const headers = {
      'Content-Type': 'application/json',
      ...buildAuthHeader(settings),
    };

    const resp = await fetch(settings.interest_webhook_url, {
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
