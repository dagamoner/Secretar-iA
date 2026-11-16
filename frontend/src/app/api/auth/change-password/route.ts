import { NextRequest, NextResponse } from "next/server";
import { dbChangePassword } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_id, old_password, new_password } = body;

    if (!user_id || !old_password || !new_password) {
      return NextResponse.json({ error: "Datos incompletos para cambio de contraseña" }, { status: 400 });
    }

    const result = await dbChangePassword(Number(user_id), old_password, new_password);
    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
