import { NextResponse } from "next/server";
import { requireAdminContext, writeAdminLog } from "../_utils";

function toNumber(value) {
  if (typeof value === "number") return value;
  return Number(String(value || "").replace(/\./g, "").replace(",", "."));
}

export async function GET(request) {
  const ctx = await requireAdminContext(request);
  if (ctx.error) return ctx.error;

  const { supabase } = ctx;
  const { data: sales, error } = await supabase
    .from("vehicle_sales")
    .select("id,vehicle_id,seller_id,quantity,sale_price,customer_name,customer_phone,payment_method,notes,sold_at,created_by,created_date")
    .order("sold_at", { ascending: false })
    .limit(300);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const vehicleIds = [...new Set((sales || []).map((sale) => sale.vehicle_id).filter(Boolean))];
  const userIds = [
    ...new Set((sales || []).flatMap((sale) => [sale.seller_id, sale.created_by]).filter(Boolean)),
  ];

  const { data: vehicles = [] } = vehicleIds.length
    ? await supabase.from("vehicles").select("id,brand,model,version,price,stock_quantity,status,images").in("id", vehicleIds)
    : { data: [] };
  const { data: profiles = [] } = userIds.length
    ? await supabase.from("profiles").select("id,email,nome,role").in("id", userIds)
    : { data: [] };

  const vehiclesById = new Map(vehicles.map((vehicle) => [vehicle.id, vehicle]));
  const profilesById = new Map(profiles.map((profile) => [profile.id, profile]));

  return NextResponse.json({
    sales: (sales || []).map((sale) => ({
      ...sale,
      vehicle: vehiclesById.get(sale.vehicle_id) || null,
      seller: profilesById.get(sale.seller_id) || null,
      creator: profilesById.get(sale.created_by) || null,
    })),
  });
}

export async function POST(request) {
  const ctx = await requireAdminContext(request);
  if (ctx.error) return ctx.error;

  const { supabase, user: actor, profile } = ctx;
  const body = await request.json().catch(() => ({}));
  const vehicleId = body.vehicle_id;
  const quantity = Number(body.quantity || 1);
  const salePrice = toNumber(body.sale_price);

  if (!vehicleId || !quantity || !Number.isFinite(salePrice)) {
    return NextResponse.json({ error: "Informe veículo, quantidade e valor da venda." }, { status: 400 });
  }

  const sellerId = profile.role === "admin" && body.seller_id ? body.seller_id : actor.id;
  const { data, error } = await supabase.rpc("register_vehicle_sale_admin", {
    p_actor_id: actor.id,
    p_vehicle_id: vehicleId,
    p_seller_id: sellerId,
    p_quantity: quantity,
    p_sale_price: salePrice,
    p_customer_name: body.customer_name || null,
    p_customer_phone: body.customer_phone || null,
    p_payment_method: body.payment_method || null,
    p_notes: body.notes || null,
    p_sold_at: body.sold_at || new Date().toISOString(),
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  await writeAdminLog(supabase, {
    actorId: actor.id,
    targetUserId: sellerId,
    action: "venda_registrada",
    details: { vehicle_id: vehicleId, quantity, sale_price: salePrice },
  });

  return NextResponse.json({ sale: data });
}
