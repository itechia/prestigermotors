import { NextResponse } from "next/server";
import { getCachedVehicleDetail } from "@/lib/serverPublicData";

export async function GET(_request, { params }) {
  const vehicle = await getCachedVehicleDetail(params.id);
  if (!vehicle) {
    return NextResponse.json({ error: "Veiculo nao encontrado." }, { status: 404 });
  }

  return NextResponse.json(
    { vehicle },
    { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } }
  );
}
