import { NextResponse } from "next/server";
import { getCachedPublicTaxonomies } from "@/lib/serverPublicData";

export async function GET() {
  const taxonomies = await getCachedPublicTaxonomies();
  return NextResponse.json(
    taxonomies,
    { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" } }
  );
}
