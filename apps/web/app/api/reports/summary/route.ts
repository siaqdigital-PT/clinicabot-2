import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@clinicabot/db";
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";
import type { DashboardStats } from "@clinicabot/types";

/** GET /api/reports/summary — métricas para o dashboard */
export async function GET(_req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const clinicFilter =
    session.user.role === "SUPER_ADMIN" ? {} : { clinicId: session.user.clinicId ?? "" };

  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const [
    appointmentsToday,
    appointmentsThisWeek,
    appointmentsThisMonth,
    completedThisMonth,
    cancelledThisMonth,
    noShowThisMonth,
    totalChatSessions,
    chatSessionsWithAppointments,
  ] = await Promise.all([
    prisma.appointment.count({
      where: { ...clinicFilter, scheduledAt: { gte: todayStart, lte: todayEnd }, status: { notIn: ["CANCELLED"] } },
    }),
    prisma.appointment.count({
      where: { ...clinicFilter, scheduledAt: { gte: weekStart, lte: weekEnd }, status: { notIn: ["CANCELLED"] } },
    }),
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
    prisma.chatSession.count({
      where: { ...clinicFilter, createdAt: { gte: monthStart, lte: monthEnd } },
    }),
    prisma.chatSession.count({
      where: {
        ...clinicFilter,
        createdAt: { gte: monthStart, lte: monthEnd },
        appointments: { some: {} },
      },
    }),
  ]);

  const total = completedThisMonth + cancelledThisMonth + noShowThisMonth;
  const occupancyRate = total > 0 ? Math.round((completedThisMonth / total) * 100) : 0;
  const noShowRate = total > 0 ? Math.round((noShowThisMonth / total) * 100) : 0;
  const chatConversionRate =
    totalChatSessions > 0 ? Math.round((chatSessionsWithAppointments / totalChatSessions) * 100) : 0;

  const stats: DashboardStats = {
    appointmentsToday,
    appointmentsThisWeek,
    appointmentsThisMonth,
    occupancyRate,
    noShowRate,
    chatConversionRate,
    totalActivePatients: 0, // TODO: contar pacientes únicos
  };

  return NextResponse.json(stats);
}
