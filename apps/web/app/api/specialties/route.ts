import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@clinicabot/db";

const createSchema = z.object({
  name: z.string().min(2).max(100),
  durationMin: z.number().int().min(5).max(480).default(30),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#1D9E75"),
  description: z.string().max(500).optional(),
});

// ─── GET /api/specialties ─────────────────────────────────────────────────────

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const clinicId =
    session.user.role === "SUPER_ADMIN" ? undefined : (session.user.clinicId ?? "");

  const specialties = await prisma.specialty.findMany({
    where: { ...(clinicId ? { clinicId } : {}), isActive: true },
    include: {
      _count: { select: { doctors: true } },
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(specialties);
}

// ─── POST /api/specialties ────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const clinicId = session.user.clinicId;
  if (!clinicId && session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Clínica não associada" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body inválido" }, { status: 400 });
  }

  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  // Verificar duplicado
  const existing = await prisma.specialty.findFirst({
    where: { clinicId: clinicId!, name: { equals: parsed.data.name, mode: "insensitive" } },
  });
  if (existing) {
    return NextResponse.json(
      { error: "Já existe uma especialidade com este nome" },
      { status: 409 }
    );
  }

  const specialty = await prisma.specialty.create({
    data: { clinicId: clinicId!, ...parsed.data },
    include: { _count: { select: { doctors: true } } },
  });

  return NextResponse.json(specialty, { status: 201 });
}
