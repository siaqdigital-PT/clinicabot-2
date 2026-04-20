import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { z } from "zod";

const schema = z.object({ lastSeenAt: z.string().datetime() });

/** POST /api/notifications/mark-read — estado guardado no client (localStorage) */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    schema.parse(body);
  } catch {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
