import { randomUUID } from "node:crypto";
import { VEHICLE_EXPORT_COLUMNS, normalizeVehicleImportRow } from "@/lib/adminDataColumns";
import { parseXlsx } from "@/lib/xlsx";
import { requireAdminContext, writeAdminLog } from "../../_utils";

const NUMBER_FIELDS = new Set([
  "year",
  "manufacture_year",
  "price",
  "price_old",
  "mileage",
  "stock_quantity",
  "doors",
]);
const BOOLEAN_FIELDS = new Set(["featured", "hidden"]);
const ARRAY_FIELDS = new Set(["features", "images"]);
const ALLOWED_FIELDS = new Set(VEHICLE_EXPORT_COLUMNS.map((column) => column.key));

function parseBoolean(value) {
  if (typeof value === "boolean") return value;
  const normalized = String(value || "").trim().toLowerCase();
  return ["1", "true", "sim", "s", "yes"].includes(normalized);
}

function parseArray(value) {
  if (Array.isArray(value)) return value;
  const text = String(value || "").trim();
  if (!text) return [];
  if (text.startsWith("[")) {
    try {
      const parsed = JSON.parse(text);
      return Array.isArray(parsed) ? parsed.map(String).filter(Boolean) : [];
    } catch {
      return [];
    }
  }
  return text.split(";").map((item) => item.trim()).filter(Boolean);
}

function parseNumber(value) {
  if (typeof value === "number") return value;
  const text = String(value || "").trim();
  if (!text) return 0;
  return Number(text.replace(/\./g, "").replace(",", "."));
}

function normalizeVehicle(row) {
  const now = new Date().toISOString();
  const vehicle = {
    id: row.id ? String(row.id).trim() : randomUUID(),
    created_date: now,
    updated_date: now,
  };

  for (const [key, rawValue] of Object.entries(row)) {
    if (!ALLOWED_FIELDS.has(key) || key === "id") continue;
    if (NUMBER_FIELDS.has(key)) {
      vehicle[key] = parseNumber(rawValue);
    } else if (BOOLEAN_FIELDS.has(key)) {
      vehicle[key] = parseBoolean(rawValue);
    } else if (ARRAY_FIELDS.has(key)) {
      vehicle[key] = parseArray(rawValue);
    } else {
      vehicle[key] = String(rawValue || "").trim();
    }
  }

  vehicle.status = vehicle.status || "disponivel";
  vehicle.stock_quantity = Number.isFinite(vehicle.stock_quantity) ? vehicle.stock_quantity : 1;
  vehicle.year = Number.isFinite(vehicle.year) ? vehicle.year : new Date().getFullYear();
  vehicle.manufacture_year = Number.isFinite(vehicle.manufacture_year) ? vehicle.manufacture_year : vehicle.year;
  vehicle.price = Number.isFinite(vehicle.price) ? vehicle.price : 0;

  if (!vehicle.brand || !vehicle.model) {
    throw new Error("Cada linha precisa ter brand e model.");
  }

  return vehicle;
}

export async function POST(request) {
  const ctx = await requireAdminContext(request, { adminOnly: true, moduleKey: "veiculos" });
  if (ctx.error) return ctx.error;

  const { supabase, actorUser } = ctx;
  const form = await request.formData();
  const file = form.get("file");

  if (!file || typeof file.arrayBuffer !== "function") {
    return Response.json({ error: "Envie um arquivo .xlsx no campo file." }, { status: 400 });
  }

  if (file.size > 8 * 1024 * 1024) {
    return Response.json({ error: "Arquivo muito grande. Limite: 8 MB." }, { status: 400 });
  }

  const rows = parseXlsx(await file.arrayBuffer());
  if (!rows.length) {
    return Response.json({ error: "A planilha nao possui linhas para importar." }, { status: 400 });
  }

  let vehicles;
  try {
    vehicles = rows.map((row) => normalizeVehicle(normalizeVehicleImportRow(row)));
  } catch (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }

  const ids = vehicles.map((vehicle) => vehicle.id);
  const { data: existing = [] } = await supabase
    .from("vehicles")
    .select("id,created_date")
    .in("id", ids);
  const createdById = new Map(existing.map((vehicle) => [vehicle.id, vehicle.created_date]));
  vehicles = vehicles.map((vehicle) => ({
    ...vehicle,
    created_date: createdById.get(vehicle.id) || vehicle.created_date,
  }));

  const { error } = await supabase
    .from("vehicles")
    .upsert(vehicles, { onConflict: "id" });

  if (error) return Response.json({ error: error.message }, { status: 500 });

  await writeAdminLog(supabase, {
    actorId: actorUser.id,
    action: "veiculos_importados",
    details: { count: vehicles.length },
  });

  return Response.json({ imported: vehicles.length });
}
