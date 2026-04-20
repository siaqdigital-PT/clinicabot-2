import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@clinicabot/db";
import { generateTimeSlots, combineDateAndTime } from "@clinicabot/utils";
import { format, getDay, parseISO, isAfter } from "date-fns";

/**
 * GET /api/availability/slots?doctorId=X&date=YYYY-MM-DD
 * Retorna horários disponíveis para um médico numa data específica.
 */
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const doctorId = req.nextUrl.searchParams.get("doctorId");
  const date = req.nextUrl.searchParams.get("date");

  if (!doctorId || !date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "doctorId e date (YYYY-MM-DD) são obrigatórios" }, { status: 400 });
  }

  const clinicId =
    session.user.role === "SUPER_ADMIN"
      ? (req.nextUrl.searchParams.get("clinicId") ?? "")
      : (session.user.clinicId ?? "");

  // Carregar médico com disponibilidades e especialidade
  const doctor = await prisma.doctor.findFirst({
    where: { id: doctorId, clinicId: clinicId || undefined, isActive: true },
    include: {
      availabilities: { where: { isActive: true } },
      specialty: { select: { durationMin: true } },
    },
  });

  if (!doctor) {
    return NextResponse.json({ error: "Médico não encontrado" }, { status: 404 });
  }

  const durationMin = doctor.specialty?.durationMin ?? 30;
  const dayOfWeek = getDay(parseISO(date)); // 0=Dom, 6=Sab

  const dayAvailabilities = doctor.availabilities.filter(
    (a) => a.dayOfWeek === dayOfWeek
  );

  if (dayAvailabilities.length === 0) {
    return NextResponse.json({ slots: [] });
  }

  // Marcações já existentes nesse dia para este médico
  const dayStart = parseISO(`${date}T00:00:00`);
  const dayEnd = parseISO(`${date}T23:59:59`);

  const existing = await prisma.appointment.findMany({
    where: {
      doctorId,
      status: { notIn: ["CANCELLED"] },
      scheduledAt: { gte: dayStart, lte: dayEnd },
    },
    select: { scheduledAt: true, durationMin: true },
  });

  const thirtyMinFromNow = new Date(Date.now() + 30 * 60 * 1000);
  const availableSlots: string[] = [];

  for (const avail of dayAvailabilities) {
    const times = generateTimeSlots(avail.startTime, avail.endTime, durationMin);

    for (const timeStr of times) {
      const slotStart = combineDateAndTime(date, timeStr);

      if (!isAfter(slotStart, thirtyMinFromNow)) continue;

      const isBooked = existing.some((appt) => {
        const diff = Math.abs(appt.scheduledAt.getTime() - slotStart.getTime());
        return diff < durationMin * 60 * 1000;
      });

      if (!isBooked) {
        availableSlots.push(format(slotStart, "HH:mm"));
      }
    }
  }

  return NextResponse.json({ slots: availableSlots, durationMin });
}
