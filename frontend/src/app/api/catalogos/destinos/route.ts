import { NextRequest, NextResponse } from "next/server";
import { dbGetCatalogosDestinos } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const areaId = Number(searchParams.get("area_id")) || 1;
    const destinos = await dbGetCatalogosDestinos(areaId);
    return NextResponse.json(destinos);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
