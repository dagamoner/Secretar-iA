import { NextRequest, NextResponse } from "next/server";
import { dbGetCatalogosDestinos, dbCreateDestino, dbDeleteDestino } from "@/lib/db";

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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const dest = await dbCreateDestino(body);
    return NextResponse.json(dest, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ detail: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = Number(searchParams.get("id"));
    if (!id) return NextResponse.json({ error: "ID requerido" }, { status: 400 });
    await dbDeleteDestino(id);
    return NextResponse.json({ deleted: true });
  } catch (error: any) {
    return NextResponse.json({ detail: error.message }, { status: 500 });
  }
}
