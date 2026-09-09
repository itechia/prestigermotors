import { NextResponse } from "next/server";
import { getCachedVehicleDetail, getCachedVehicleBySlug } from "@/lib/serverPublicData";
import { isUuid } from "@/lib/vehicleUrl";

// Aceita tanto a slug (/veiculo/honda-civic-2022) quanto o UUID dos links antigos.
export async function GET(_request, { params }) {
  const key = decodeURIComponent(params.id || "");
  const vehicle = isUuid(key)
    ? await getCachedVehicleDetail(key)
    : await getCachedVehicleBySlug(key);

  if (!vehicle) {
    return NextResponse.json({ error: "Veiculo nao encontrado." }, { status: 404 });
  }

  return NextResponse.json(
    { vehicle },
    { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } }
  );
}
