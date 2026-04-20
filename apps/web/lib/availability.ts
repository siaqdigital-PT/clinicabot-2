import { prisma } from "@clinicabot/db";
import { generateTimeSlots, combineDateAndTime } from "@clinicabot/utils";
import type { AvailabilitySlot } from "@clinicabot/types";
import { addDays, format, getDay, parseISO, isAfter, startOfDay } from "date-fns";
import { toZonedTime } from "date-fns-tz";

const TIMEZONE = "Europe/Lisbon";
const LOOK_AHEAD_DAYS = 14; // janela de pesquisa de disponibilidade

/**
 * Retorna os slots de consulta disponíveis para uma especialidade numa clínica.
 *
 * @param clinicId - ID da clínica
 * @param specialtyName - Nome da especialidade (case-insensitive)
 * @param preferredDate - Data preferida no formato YYYY-MM-DD (opcional)
 * @param limit - Número máximo de slots a retornar (default: 6)
 */
export async function getAvailableSlots(
  clinicId: string,
  specialtyName: string,
  preferredDate?: string,
  limit = 6
): Promise<AvailabilitySlot[]> {
  // 1. Encontrar a especialidade
  const specialty = await prisma.specialty.findFirst({
    where: {
      clinicId,
      isActive: true,
      name: { equals: specialtyName, mode: "insensitive" },
    },
  });

  if (!specialty) {
    console.error(`[availability] Especialidade não encontrada: ${specialtyName}`);
    return [];
  }

  // 2. Encontrar médicos activos desta especialidade
  const doctors = await prisma.doctor.findMany({
    where: { clinicId, specialtyId: specialty.id, isActive: true },
    include: {
      availabilities: { where: { isActive: true } },
    },
  });

  if (doctors.length === 0) return [];

  // 3. Definir janela de datas a pesquisar
  const nowZoned = toZonedTime(new Date(), TIMEZONE);
  const startDate = preferredDate ? parseISO(preferredDate) : nowZoned;
  const endDate = addDays(startDate, LOOK_AHEAD_DAYS);

  // 4. Buscar marcações já existentes na janela (para exclusão)
  const existingAppointments = await prisma.appointment.findMany({
    where: {
      clinicId,
      status: { notIn: ["CANCELLED"] },
      scheduledAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    select: { doctorId: true, scheduledAt: true, durationMin: true },
  });

  // Indexar marcações por doctorId para lookup rápido
  const bookedByDoctor = new Map<string, Date[]>();
  for (const appt of existingAppointments) {
    if (!bookedByDoctor.has(appt.doctorId)) {
      bookedByDoctor.set(appt.doctorId, []);
    }
    bookedByDoctor.get(appt.doctorId)!.push(appt.scheduledAt);
  }

  // 5. Gerar todos os slots possíveis
  const allSlots: AvailabilitySlot[] = [];
  const durationMin = specialty.durationMin;

  // Iterar pelos dias na janela
  let currentDate = startOfDay(startDate);
  while (currentDate <= endDate && allSlots.length < limit * 3) {
    const dayOfWeek = getDay(currentDate); // 0=Dom, 6=Sab
    const dateStr = format(currentDate, "yyyy-MM-dd");

    for (const doctor of doctors) {
      const dayAvailabilities = doctor.availabilities.filter(
        (a) => a.dayOfWeek === dayOfWeek
      );

      for (const avail of dayAvailabilities) {
        const timeSlots = generateTimeSlots(avail.startTime, avail.endTime, durationMin);
        const booked = bookedByDoctor.get(doctor.id) ?? [];

        for (const timeStr of timeSlots) {
          const slotStart = combineDateAndTime(dateStr, timeStr);

          // Ignorar slots no passado (com margem de 30 min)
          const thirtyMinFromNow = new Date(Date.now() + 30 * 60 * 1000);
          if (!isAfter(slotStart, thirtyMinFromNow)) continue;

          // Verificar se o slot está ocupado
          const isBooked = booked.some((bookedAt) => {
            const diff = Math.abs(bookedAt.getTime() - slotStart.getTime());
            return diff < durationMin * 60 * 1000;
          });

          if (!isBooked) {
            allSlots.push({
              doctorId: doctor.id,
              doctorName: doctor.name,
              specialtyName: specialty.name,
              startTime: slotStart.toISOString(),
              endTime: new Date(slotStart.getTime() + durationMin * 60 * 1000).toISOString(),
              durationMin,
            });
          }
        }
      }
    }

    currentDate = addDays(currentDate, 1);
  }

  // 6. Ordenar por data e limitar
  return allSlots
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
    .slice(0, limit);
}
