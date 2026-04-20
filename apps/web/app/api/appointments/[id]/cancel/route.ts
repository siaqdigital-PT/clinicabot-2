import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@clinicabot/db";

const cancelSchema = z.object({
  cancelToken: z.string().min(1),
  reason: z.string().max(300).optional(),
});

/**
 * POST /api/appointments/:id/cancel
 * Cancelamento via token de email — não requer login.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body inválido" }, { status: 400 });
  }

  const parsed = cancelSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Token inválido" }, { status: 400 });
  }

  const { cancelToken, reason } = parsed.data;

  const appointment = await prisma.appointment.findUnique({
    where: { id: params.id },
    include: {
      clinic: { include: { settings: true } },
    },
  });

  if (!appointment) {
    return NextResponse.json({ error: "Marcação não encontrada" }, { status: 404 });
  }

  // Verificar token
  if (appointment.cancelToken !== cancelToken) {
    return NextResponse.json({ error: "Token inválido ou expirado" }, { status: 403 });
  }

  if (appointment.status === "CANCELLED") {
    return NextResponse.json({ error: "Marcação já foi cancelada" }, { status: 409 });
  }

  // Verificar janela de cancelamento
  const settings = appointment.clinic.settings;
  if (settings?.allowCancellation) {
    const cancellationDeadline = new Date(
      appointment.scheduledAt.getTime() - (settings.cancellationHours ?? 2) * 60 * 60 * 1000
    );
    if (new Date() > cancellationDeadline) {
      return NextResponse.json(
        { error: `Não é possível cancelar com menos de ${settings.cancellationHours}h de antecedência` },
        { status: 409 }
      );
    }
  }

  await prisma.appointment.update({
    where: { id: params.id },
    data: {
      status: "CANCELLED",
      cancelledAt: new Date(),
      cancelReason: reason ?? "Cancelado pelo paciente via email",
    },
  });

  return NextResponse.json({ message: "Marcação cancelada com sucesso" });
}
