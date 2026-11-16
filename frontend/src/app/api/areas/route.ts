import { NextRequest, NextResponse } from "next/server";
import { dbGetAreas, dbCreateArea, dbDeleteArea } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const areas = await dbGetAreas();
    return NextResponse.json(areas);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const area = await dbCreateArea(body);
    return NextResponse.json(area, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ detail: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = Number(searchParams.get("id"));
    if (!id) return NextResponse.json({ error: "ID requerido" }, { status: 400 });
    await dbDeleteArea(id);
    return NextResponse.json({ deleted: true });
  } catch (error: any) {
    return NextResponse.json({ detail: error.message }, { status: 500 });
  }
}
