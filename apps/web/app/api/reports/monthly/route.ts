import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@clinicabot/db";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";

/** GET /api/reports/monthly?months=6 — dados mensais para gráficos */
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const months = Number(req.nextUrl.searchParams.get("months") ?? "6");
  const clinicFilter =
    session.user.role === "SUPER_ADMIN" ? {} : { clinicId: session.user.clinicId ?? "" };

  const now = new Date();
  const results = [];

  for (let i = months - 1; i >= 0; i--) {
    const monthDate = subMonths(now, i);
    const monthStart = startOfMonth(monthDate);
    const monthEnd = endOfMonth(monthDate);

    const [total, completed, cancelled, noShow, apptWithSpecialty] = await Promise.all([
      prisma.appointment.count({
        where: { ...clinicFilter, scheduledAt: { gte: monthStart, lte: monthEnd } },
      }),
      prisma.appointment.count({
        where: { ...clinicFilter, scheduledAt: { gte: monthStart, lte: monthEnd }, status: "COMPLETED" },
      }),
      prisma.appointment.count({
        where: { ...clinicFilter, scheduledAt: { gte: monthStart, lte: monthEnd }, status: "CANCELLED" },
      }),
      prisma.appointment.count({
        where: { ...clinicFilter, scheduledAt: { gte: monthStart, lte: monthEnd }, status: "NO_SHOW" },
      }),
      // Agregar por especialidade através da relação doctor → specialty
      prisma.appointment.findMany({
        where: { ...clinicFilter, scheduledAt: { gte: monthStart, lte: monthEnd } },
        select: { doctor: { select: { specialty: { select: { name: true } } } } },
      }),
    ]);

    const bySpecialty: Record<string, number> = {};
    for (const appt of apptWithSpecialty) {
      const name = appt.doctor?.specialty?.name;
      if (name) bySpecialty[name] = (bySpecialty[name] ?? 0) + 1;
    }

    results.push({
      month: format(monthDate, "yyyy-MM"),
      label: format(monthDate, "MMM yyyy"),
      total,
      completed,
      cancelled,
      noShow,
      bySpecialty,
    });
  }

  return NextResponse.json(results);
}
