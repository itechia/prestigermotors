import { NextResponse } from "next/server";
import { getCachedVehicleEmbed, getCachedVehicleBySlug } from "@/lib/serverPublicData";
import { isUuid } from "@/lib/vehicleUrl";

// O HTML do tour 360 é buscado pelo id; quando a rota recebe a slug,
// resolvemos o id antes.
export async function GET(_request, { params }) {
  const { id } = await params;
  const key = decodeURIComponent(id || "");
  let vehicleId = key;

  if (!isUuid(key)) {
    const vehicle = await getCachedVehicleBySlug(key);
    if (!vehicle) return NextResponse.json({ embed_html: "" });
    vehicleId = vehicle.id;
  }

  const embedHtml = await getCachedVehicleEmbed(vehicleId);
  return NextResponse.json(
    { embed_html: embedHtml },
    { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" } }
  );
}
