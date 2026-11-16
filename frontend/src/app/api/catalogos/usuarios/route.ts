import { NextRequest, NextResponse } from "next/server";
import { dbGetUsuarios, dbCreateUsuario, dbDeleteUsuario } from "@/lib/db";

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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const user = await dbCreateUsuario(body);
    return NextResponse.json(user, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ detail: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = Number(searchParams.get("id"));
    if (!id) return NextResponse.json({ error: "ID requerido" }, { status: 400 });
    await dbDeleteUsuario(id);
    return NextResponse.json({ deleted: true });
  } catch (error: any) {
    return NextResponse.json({ detail: error.message }, { status: 500 });
  }
}
