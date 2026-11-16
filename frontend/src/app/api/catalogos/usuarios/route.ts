import { NextRequest, NextResponse } from "next/server";
import { dbGetUsuarios } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const areaId = Number(searchParams.get("area_id")) || 1;
    const usuarios = await dbGetUsuarios(areaId);
    return NextResponse.json(usuarios);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
