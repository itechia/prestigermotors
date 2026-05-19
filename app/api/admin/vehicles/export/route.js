import { buildXlsx } from "@/lib/xlsx";
import { VEHICLE_EXPORT_COLUMNS } from "@/lib/adminDataColumns";
import { requireAdminContext } from "../../_utils";

function serializeList(value) {
  if (!Array.isArray(value)) return value || "";
  return value.join("; ");
}

export async function GET(request) {
  const ctx = await requireAdminContext(request, { moduleKey: "veiculos" });
  if (ctx.error) return ctx.error;

  const { supabase } = ctx;
  const { data, error } = await supabase
    .from("vehicles")
    .select(VEHICLE_EXPORT_COLUMNS.map((column) => column.key).join(","))
    .order("created_date", { ascending: false });

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  const rows = (data || []).map((vehicle) => ({
    ...vehicle,
    features: serializeList(vehicle.features),
    images: serializeList(vehicle.images),
  }));
  const file = buildXlsx({ sheetName: "Veiculos", columns: VEHICLE_EXPORT_COLUMNS, rows });

  return new Response(file, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="veiculos.xlsx"`,
      "Cache-Control": "no-store",
    },
  });
}
