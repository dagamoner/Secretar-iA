import { NextResponse } from "next/server";
import { initializeVercelDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const result = await initializeVercelDb();
  return NextResponse.json(result);
}

export async function POST() {
  const result = await initializeVercelDb();
  return NextResponse.json(result);
}
