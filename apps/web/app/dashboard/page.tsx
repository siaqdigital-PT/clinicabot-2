import { auth } from "@/auth";
import { prisma } from "@clinicabot/db";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { UpcomingAppointments } from "@/components/dashboard/upcoming-appointments";
import { MonthlyChart } from "@/components/dashboard/monthly-chart";
import { formatAppointmentDate } from "@clinicabot/utils";
import { startOfDay, endOfDay, addDays } from "date-fns";

export default async function DashboardPage() {
  const session = await auth();
  if (!session) return null;

  const clinicFilter =
    session.user.role === "SUPER_ADMIN"
      ? {}
      : { clinicId: session.user.clinicId ?? "" };

  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);
  const tomorrowEnd = endOfDay(addDays(now, 1));

  const [
    appointmentsToday,
    upcomingAppointments,
  ] = await Promise.all([
    prisma.appointment.count({
      where: { ...clinicFilter, scheduledAt: { gte: todayStart, lte: todayEnd }, status: { notIn: ["CANCELLED"] } },
    }),
    prisma.appointment.findMany({
      where: {
        ...clinicFilter,
        scheduledAt: { gte: now, lte: tomorrowEnd },
        status: { notIn: ["CANCELLED"] },
      },
      include: { doctor: { select: { name: true, specialty: { select: { name: true, color: true } } } } },
      orderBy: { scheduledAt: "asc" },
      take: 10,
    }),
  ]);

  return (
    <div className="space-y-6">
      {/* Título */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Visão Geral</h1>
        <p className="text-sm text-gray-500">
          Bem-vindo ao painel da {session.user.clinic?.name ?? "ClinicaBot"}
        </p>
      </div>

      {/* Cards de métricas */}
      <StatsCards clinicFilter={clinicFilter} />

      {/* Grid: gráfico + próximas marcações */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <MonthlyChart />

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-gray-900">
            Próximas Marcações ({appointmentsToday} hoje)
          </h2>
          <UpcomingAppointments appointments={upcomingAppointments.map(a => ({
            id: a.id,
            patientName: a.patientName,
            specialtyName: a.doctor.specialty?.name ?? "—",
            doctorName: a.doctor.name,
            scheduledAt: formatAppointmentDate(a.scheduledAt),
            color: a.doctor.specialty?.color ?? "#6b7280",
            status: a.status,
          }))} />
        </div>
      </div>
    </div>
  );
}
