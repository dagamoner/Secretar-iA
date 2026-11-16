import { NextRequest, NextResponse } from "next/server";
import { dbRegistrarMovimiento, dbGetMovimientosRecientes } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const areaId = Number(searchParams.get("area_id")) || 1;
    const limit = Number(searchParams.get("limit")) || 100;
    const movs = await dbGetMovimientosRecientes(areaId, limit);
    return NextResponse.json(movs);
  } catch (error: any) {
    return NextResponse.json({ detail: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const mov = await dbRegistrarMovimiento(body);
    return NextResponse.json(mov, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ detail: error.message }, { status: 500 });
  }
}
