import { NextResponse } from "next/server";
import { getCachedVehiclesCatalog } from "@/lib/serverPublicData";

export async function GET() {
  const vehicles = await getCachedVehiclesCatalog();
  return NextResponse.json(
    { vehicles },
    { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } }
  );
}
