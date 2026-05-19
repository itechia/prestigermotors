import { VEHICLE_EXPORT_COLUMNS } from "@/lib/adminDataColumns";
import { buildXlsx } from "@/lib/xlsx";
import { requireAdminContext } from "../../_utils";

export async function GET(request) {
  const ctx = await requireAdminContext(request, { adminOnly: true, moduleKey: "veiculos" });
  if (ctx.error) return ctx.error;

  const example = {
    vehicle_type: "carro",
    brand: "Toyota",
    model: "Corolla",
    version: "XEi 2.0",
    year: 2024,
    manufacture_year: 2023,
    price: 145000,
    mileage: 12500,
    fuel_type: "flex",
    transmission: "automatico",
    color: "prata",
    body_type: "sedan",
    condition: "seminovo",
    status: "disponivel",
    featured: false,
    hidden: false,
    stock_quantity: 1,
    doors: 4,
    engine: "2.0",
    features: "Ar-condicionado; Couro; Multimidia",
    images: "https://exemplo.com/foto1.jpg; https://exemplo.com/foto2.jpg",
  };

  const file = buildXlsx({
    sheetName: "Modelo Veiculos",
    columns: VEHICLE_EXPORT_COLUMNS,
    rows: [example],
  });

  return new Response(file, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="modelo-importacao-veiculos.xlsx"`,
      "Cache-Control": "no-store",
    },
  });
}
