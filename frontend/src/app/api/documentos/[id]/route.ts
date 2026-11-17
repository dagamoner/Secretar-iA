import { NextRequest, NextResponse } from "next/server";
import { dbGetDocumentoDetalle, dbUpdateDocumento } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const docId = Number(params.id);
    const areaId = Number(searchParams.get("area_id")) || 1;

    const doc = await dbGetDocumentoDetalle(docId, areaId);
    if (!doc) {
      return NextResponse.json({ detail: "Documento no encontrado" }, { status: 404 });
    }
    return NextResponse.json(doc);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const docId = Number(params.id);
    const body = await request.json();
    const areaId = Number(body.area_id) || 1;

    const updated = await dbUpdateDocumento(docId, areaId, body);
    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
