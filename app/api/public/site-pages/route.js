import { NextResponse } from "next/server";
import { getCachedSitePages } from "@/lib/serverPublicData";

export async function GET() {
  const pages = await getCachedSitePages();
  return NextResponse.json(
    { pages },
    { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" } }
  );
}
