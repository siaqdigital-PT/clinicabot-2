import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@clinicabot/db";

/** GET /api/appointments/calendar?month=2026-04 */
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const monthParam = req.nextUrl.searchParams.get("month"); // "2026-04"
  let year: number, month: number;

  if (monthParam && /^\d{4}-\d{2}$/.test(monthParam)) {
    [year, month] = monthParam.split("-").map(Number) as [number, number];
    month -= 1; // 0-indexed
  } else {
    const now = new Date();
    year = now.getFullYear();
    month = now.getMonth();
  }

  const from = new Date(year, month, 1, 0, 0, 0);
  const to = new Date(year, month + 1, 0, 23, 59, 59);

  // Role-based clinic filter
  const clinicFilter =
    session.user.role === "SUPER_ADMIN"
      ? {}
      : { clinicId: session.user.clinicId ?? "__none__" };

  const appointments = await prisma.appointment.findMany({
    where: {
      ...clinicFilter,
      scheduledAt: { gte: from, lte: to },
    },
    select: {
      id: true,
      patientName: true,
      patientEmail: true,
      patientPhone: true,
      scheduledAt: true,
      durationMin: true,
      status: true,
      insuranceName: true,
      doctor: {
        select: {
          name: true,
          specialty: { select: { name: true, color: true } },
        },
      },
    },
    orderBy: { scheduledAt: "asc" },
  });

  return NextResponse.json({ appointments });
}
