import { NextRequest, NextResponse } from "next/server";
import { dbGetDocumentos, dbCreateDocumento } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const areaId = Number(searchParams.get("area_id")) || 1;
    const search = searchParams.get("search") || undefined;
    const estado = searchParams.get("estado") || undefined;
    const portador = searchParams.get("portador") || undefined;
    const destino = searchParams.get("destino") || undefined;
    const prioridad = searchParams.get("prioridad") || undefined;

    const documentos = await dbGetDocumentos(areaId, {
      search,
      estado,
      portador,
      destino,
      prioridad,
    });
    return NextResponse.json(documentos);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const doc = await dbCreateDocumento(body);
    return NextResponse.json(doc, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ detail: error.message }, { status: 500 });
  }
}
