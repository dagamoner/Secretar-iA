import { NextRequest, NextResponse } from "next/server";
import { dbImportarDocumentosBatch } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { area_id, items, user_name } = body;

    if (!area_id || !Array.isArray(items)) {
      return NextResponse.json({ error: "Datos incompletos. Se requiere area_id e items." }, { status: 400 });
    }

    const resultado = await dbImportarDocumentosBatch(Number(area_id), items, user_name);
    return NextResponse.json(resultado);
  } catch (error: any) {
    return NextResponse.json({ detail: error.message }, { status: 500 });
  }
}
