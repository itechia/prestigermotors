import { NextResponse } from "next/server";
import { getCachedPublicSettings } from "@/lib/serverPublicData";

export async function GET() {
  const settings = await getCachedPublicSettings();
  return NextResponse.json(
    { settings },
    { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" } }
  );
}
