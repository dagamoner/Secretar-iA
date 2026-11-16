import { NextResponse } from "next/server";
import { dbGetAreas } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const areas = await dbGetAreas();
    return NextResponse.json(areas);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
