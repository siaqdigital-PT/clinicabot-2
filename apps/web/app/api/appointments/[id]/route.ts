import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@clinicabot/db";

const updateSchema = z.object({
  status: z.enum(["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED", "NO_SHOW"]).optional(),
  notes: z.string().max(500).optional(),
  cancelReason: z.string().max(300).optional(),
});

/** PATCH /api/appointments/:id — atualizar estado ou notas */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const appointment = await prisma.appointment.findUnique({
    where: { id: params.id },
    select: { clinicId: true, status: true },
  });

  if (!appointment) {
    return NextResponse.json({ error: "Marcação não encontrada" }, { status: 404 });
  }

  // Verificar que o utilizador tem acesso a esta clínica
  if (
    session.user.role !== "SUPER_ADMIN" &&
    appointment.clinicId !== session.user.clinicId
  ) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body inválido" }, { status: 400 });
  }

  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos", details: parsed.error.flatten() }, { status: 400 });
  }

  const { status, notes, cancelReason } = parsed.data;

  const updated = await prisma.appointment.update({
    where: { id: params.id },
    data: {
      ...(status && { status }),
      ...(notes !== undefined && { notes }),
      ...(status === "CANCELLED" && {
        cancelledAt: new Date(),
        cancelReason: cancelReason ?? "Cancelado pela clínica",
      }),
    },
  });

  return NextResponse.json(updated);
}

/** DELETE /api/appointments/:id — cancelar marcação (alias de PATCH status=CANCELLED) */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const appointment = await prisma.appointment.findUnique({
    where: { id: params.id },
    select: { clinicId: true },
  });

  if (!appointment) {
    return NextResponse.json({ error: "Marcação não encontrada" }, { status: 404 });
  }

  if (
    session.user.role !== "SUPER_ADMIN" &&
    appointment.clinicId !== session.user.clinicId
  ) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  await prisma.appointment.update({
    where: { id: params.id },
    data: { status: "CANCELLED", cancelledAt: new Date(), cancelReason: "Cancelado pela clínica" },
  });

  return new NextResponse(null, { status: 204 });
}
