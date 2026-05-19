import { SALES_EXPORT_COLUMNS } from "@/lib/adminDataColumns";
import { buildXlsx } from "@/lib/xlsx";
import { getVisibleProfilesById, requireAdminContext } from "../../_utils";

export async function GET(request) {
  const ctx = await requireAdminContext(request, { moduleKey: "vendas" });
  if (ctx.error) return ctx.error;

  const { supabase, realProfile } = ctx;
  const { data: sales, error } = await supabase
    .from("vehicle_sales")
    .select("id,vehicle_id,seller_id,quantity,sale_price,customer_name,customer_phone,payment_method,notes,sold_at,created_by,created_date")
    .order("sold_at", { ascending: false })
    .limit(5000);

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  const vehicleIds = [...new Set((sales || []).map((sale) => sale.vehicle_id).filter(Boolean))];
  const userIds = [...new Set((sales || []).map((sale) => sale.seller_id).filter(Boolean))];

  const { data: vehicles = [] } = vehicleIds.length
    ? await supabase.from("vehicles").select("id,brand,model,version").in("id", vehicleIds)
    : { data: [] };
  const vehiclesById = new Map(vehicles.map((vehicle) => [vehicle.id, vehicle]));
  const profilesById = await getVisibleProfilesById(supabase, userIds, realProfile, "id,email,nome,role");

  const rows = (sales || []).map((sale) => {
    const vehicle = vehiclesById.get(sale.vehicle_id);
    const seller = profilesById.get(sale.seller_id);
    return {
      ...sale,
      vehicle: vehicle ? `${vehicle.brand || ""} ${vehicle.model || ""} ${vehicle.version || ""}`.trim() : "",
      seller: seller?.nome || seller?.email || "",
      total: Number(sale.sale_price || 0) * Number(sale.quantity || 1),
    };
  });

  const file = buildXlsx({ sheetName: "Vendas", columns: SALES_EXPORT_COLUMNS, rows });
  return new Response(file, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="vendas.xlsx"`,
      "Cache-Control": "no-store",
    },
  });
}
