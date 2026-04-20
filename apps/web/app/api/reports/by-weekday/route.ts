import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@clinicabot/db";
import { subMonths, startOfMonth } from "date-fns";

// ─── GET /api/reports/by-weekday ──────────────────────────────────────────────
// Distribuição de consultas pelos dias da semana (últimos 3 meses)

const DAY_LABELS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const clinicFilter =
    session.user.role === "SUPER_ADMIN" ? {} : { clinicId: session.user.clinicId ?? "" };

  const threeMonthsAgo = startOfMonth(subMonths(new Date(), 2));

  // Buscar todas as consultas dos últimos 3 meses (apenas scheduledAt)
  const appointments = await prisma.appointment.findMany({
    where: {
      ...clinicFilter,
      scheduledAt: { gte: threeMonthsAgo },
      status: { notIn: ["CANCELLED"] },
    },
    select: { scheduledAt: true },
  });

  // Agregar por dia da semana
  const counts = [0, 0, 0, 0, 0, 0, 0]; // índice 0=Dom, 6=Sáb
  for (const { scheduledAt } of appointments) {
    counts[scheduledAt.getDay()]!++;
  }

  // Devolver Seg–Sex (índices 1–5), excluindo fim-de-semana se vazio
  const result = counts.map((count, i) => ({
    day: DAY_LABELS[i]!,
    consultas: count,
  }));

  // Apenas dias com dados ou dias úteis (Seg–Sex)
  const weekdays = result.slice(1, 6); // Seg a Sex

  return NextResponse.json(weekdays);
}
