import { NextResponse } from "next/server";
import { getCachedVehicleEmbed } from "@/lib/serverPublicData";

export async function GET(_request, { params }) {
  const embedHtml = await getCachedVehicleEmbed(params.id);
  return NextResponse.json(
    { embed_html: embedHtml },
    { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" } }
  );
}
