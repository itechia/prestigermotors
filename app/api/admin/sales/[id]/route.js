import { NextResponse } from "next/server";
import { isAdminRole, requireAdminContext, writeAdminLog } from "../../_utils";

function toNumber(value) {
  if (typeof value === "number") return value;
  return Number(String(value || "").replace(/\./g, "").replace(",", "."));
}

async function getSale(supabase, id) {
  const { data, error } = await supabase
    .from("vehicle_sales")
    .select("id,vehicle_id,seller_id,quantity,sale_price,customer_name,customer_phone,payment_method,notes,sold_at")
    .eq("id", id)
    .single();
  return { sale: data, error };
}

async function restoreStock(supabase, vehicleId, quantity) {
  if (!vehicleId || !quantity) return;
  const { data: vehicle, error } = await supabase
    .from("vehicles")
    .select("id,stock_quantity")
    .eq("id", vehicleId)
    .single();
  if (error || !vehicle) throw new Error(error?.message || "Veiculo nao encontrado.");

  const newStock = Number(vehicle.stock_quantity || 0) + Number(quantity || 0);
  const { error: updateError } = await supabase
    .from("vehicles")
    .update({
      stock_quantity: newStock,
      status: newStock > 0 ? "disponivel" : "vendido",
      updated_date: new Date().toISOString(),
    })
    .eq("id", vehicleId);
  if (updateError) throw new Error(updateError.message);
}

async function consumeStock(supabase, vehicleId, quantity) {
  if (!vehicleId || !quantity) return;
  const { data: vehicle, error } = await supabase
    .from("vehicles")
    .select("id,stock_quantity")
    .eq("id", vehicleId)
    .single();
  if (error || !vehicle) throw new Error(error?.message || "Veiculo nao encontrado.");

  const currentStock = Number(vehicle.stock_quantity || 0);
  const newStock = currentStock - Number(quantity || 0);
  if (newStock < 0) throw new Error(`Estoque insuficiente. Disponivel: ${currentStock}`);

  const { error: updateError } = await supabase
    .from("vehicles")
    .update({
      stock_quantity: newStock,
      status: newStock <= 0 ? "vendido" : "disponivel",
      updated_date: new Date().toISOString(),
    })
    .eq("id", vehicleId);
  if (updateError) throw new Error(updateError.message);
}

export async function PATCH(request, { params }) {
  const ctx = await requireAdminContext(request);
  if (ctx.error) return ctx.error;
  const { supabase, actorUser, profile } = ctx;

  if (!isAdminRole(profile)) {
    return NextResponse.json({ error: "Apenas administradores podem editar vendas." }, { status: 403 });
  }

  const { sale, error: saleError } = await getSale(supabase, params.id);
  if (saleError || !sale) return NextResponse.json({ error: "Venda nao encontrada." }, { status: 404 });

  const body = await request.json().catch(() => ({}));
  const nextSale = {
    vehicle_id: body.vehicle_id || sale.vehicle_id,
    seller_id: body.seller_id || sale.seller_id,
    quantity: Number(body.quantity || sale.quantity),
    sale_price: body.sale_price !== undefined ? toNumber(body.sale_price) : Number(sale.sale_price || 0),
    customer_name: body.customer_name ?? sale.customer_name,
    customer_phone: body.customer_phone ?? sale.customer_phone,
    payment_method: body.payment_method ?? sale.payment_method,
    notes: body.notes ?? sale.notes,
    sold_at: body.sold_at || sale.sold_at,
  };

  if (!nextSale.vehicle_id || !nextSale.quantity || !Number.isFinite(nextSale.sale_price)) {
    return NextResponse.json({ error: "Informe veiculo, quantidade e valor da venda." }, { status: 400 });
  }

  try {
    await restoreStock(supabase, sale.vehicle_id, sale.quantity);
    await consumeStock(supabase, nextSale.vehicle_id, nextSale.quantity);
  } catch (error) {
    try {
      if (sale.vehicle_id !== nextSale.vehicle_id || sale.quantity !== nextSale.quantity) {
        await consumeStock(supabase, sale.vehicle_id, sale.quantity);
      }
    } catch (_) {}
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("vehicle_sales")
    .update(nextSale)
    .eq("id", params.id)
    .select("id,vehicle_id,seller_id,quantity,sale_price,customer_name,customer_phone,payment_method,notes,sold_at,created_by,created_date")
    .single();

  if (error) {
    try {
      await restoreStock(supabase, nextSale.vehicle_id, nextSale.quantity);
      await consumeStock(supabase, sale.vehicle_id, sale.quantity);
    } catch (_) {}
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await writeAdminLog(supabase, {
    actorId: actorUser.id,
    targetUserId: nextSale.seller_id,
    action: "venda_atualizada",
    details: { sale_id: params.id, before: sale, after: nextSale },
  });

  return NextResponse.json({ sale: data });
}

export async function DELETE(request, { params }) {
  const ctx = await requireAdminContext(request);
  if (ctx.error) return ctx.error;
  const { supabase, actorUser, profile } = ctx;

  if (!isAdminRole(profile)) {
    return NextResponse.json({ error: "Apenas administradores podem excluir vendas." }, { status: 403 });
  }

  const { sale, error: saleError } = await getSale(supabase, params.id);
  if (saleError || !sale) return NextResponse.json({ error: "Venda nao encontrada." }, { status: 404 });

  try {
    await restoreStock(supabase, sale.vehicle_id, sale.quantity);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const { error } = await supabase.from("vehicle_sales").delete().eq("id", params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await writeAdminLog(supabase, {
    actorId: actorUser.id,
    targetUserId: sale.seller_id,
    action: "venda_excluida",
    details: { sale_id: params.id, sale },
  });

  return NextResponse.json({ ok: true });
}
