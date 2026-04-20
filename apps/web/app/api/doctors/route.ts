import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@clinicabot/db";

/** GET /api/doctors?specialtyId=X — listar médicos da clínica (filtrados por especialidade) */
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  // SUPER_ADMIN pode passar clinicId como query param; outros usam o da sessão
  const clinicId =
    session.user.role === "SUPER_ADMIN"
      ? (req.nextUrl.searchParams.get("clinicId") ?? null)
      : (session.user.clinicId ?? null);

  const specialtyId = req.nextUrl.searchParams.get("specialtyId") ?? undefined;

  const doctors = await prisma.doctor.findMany({
    where: {
      ...(clinicId ? { clinicId } : {}),
      isActive: true,
      ...(specialtyId ? { specialtyId } : {}),
    },
    select: {
      id: true,
      name: true,
      email: true,
      specialty: { select: { id: true, name: true, durationMin: true } },
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(doctors);
}

const createDoctorSchema = z.object({
  clinicId: z.string().cuid(),
  name: z.string().min(2).max(100),
  email: z.string().email().optional().or(z.literal("")).transform(v => v || null),
  specialtyId: z.string().cuid().nullable().optional(),
  bio: z.string().max(500).optional(),
  photoUrl: z.string().url().optional(),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body inválido" }, { status: 400 });
  }

  const parsed = createDoctorSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos", details: parsed.error.flatten() }, { status: 400 });
  }

  const { clinicId, ...data } = parsed.data;

  // Verificar acesso à clínica
  if (session.user.role !== "SUPER_ADMIN" && session.user.clinicId !== clinicId) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  const doctor = await prisma.doctor.create({
    data: { clinicId, ...data },
    include: { specialty: { select: { name: true, color: true } } },
  });

  return NextResponse.json(doctor, { status: 201 });
}
