import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@clinicabot/db";

const patchSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  durationMin: z.number().int().min(5).max(480).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  description: z.string().max(500).nullable().optional(),
  isActive: z.boolean().optional(),
});

// ─── Helper: verificar acesso à especialidade ─────────────────────────────────

async function resolveSpecialty(id: string, clinicId: string | null | undefined, isSuperAdmin: boolean) {
  const specialty = await prisma.specialty.findUnique({ where: { id } });
  if (!specialty) return null;
  if (!isSuperAdmin && specialty.clinicId !== clinicId) return null;
  return specialty;
}

// ─── PATCH /api/specialties/[id] ─────────────────────────────────────────────

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const specialty = await resolveSpecialty(
    params.id,
    session.user.clinicId,
    session.user.role === "SUPER_ADMIN"
  );
  if (!specialty) return NextResponse.json({ error: "Especialidade não encontrada" }, { status: 404 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body inválido" }, { status: 400 });
  }

  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  // Verificar duplicado de nome (se alterou o nome)
  if (parsed.data.name && parsed.data.name !== specialty.name) {
    const existing = await prisma.specialty.findFirst({
      where: {
        clinicId: specialty.clinicId,
        name: { equals: parsed.data.name, mode: "insensitive" },
        id: { not: specialty.id },
      },
    });
    if (existing) {
      return NextResponse.json(
        { error: "Já existe uma especialidade com este nome" },
        { status: 409 }
      );
    }
  }

  const updated = await prisma.specialty.update({
    where: { id: specialty.id },
    data: parsed.data,
    include: { _count: { select: { doctors: true } } },
  });

  return NextResponse.json(updated);
}

// ─── DELETE /api/specialties/[id] — desativa (soft delete) ───────────────────

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const specialty = await resolveSpecialty(
    params.id,
    session.user.clinicId,
    session.user.role === "SUPER_ADMIN"
  );
  if (!specialty) return NextResponse.json({ error: "Especialidade não encontrada" }, { status: 404 });

  const updated = await prisma.specialty.update({
    where: { id: specialty.id },
    data: { isActive: !specialty.isActive },
    include: { _count: { select: { doctors: true } } },
  });

  return NextResponse.json(updated);
}
