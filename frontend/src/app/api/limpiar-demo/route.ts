import { NextRequest, NextResponse } from "next/server";
import { dbLimpiarDatosPrueba } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const areaId = searchParams.get("area_id") ? Number(searchParams.get("area_id")) : undefined;
    const res = await dbLimpiarDatosPrueba(areaId);
    return NextResponse.json(res);
  } catch (error: any) {
    return NextResponse.json({ detail: error.message }, { status: 500 });
  }
}
