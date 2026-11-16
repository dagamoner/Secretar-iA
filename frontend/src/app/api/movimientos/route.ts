import { NextRequest, NextResponse } from "next/server";
import { dbRegistrarMovimiento } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const mov = await dbRegistrarMovimiento(body);
    return NextResponse.json(mov, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ detail: error.message }, { status: 500 });
  }
}
