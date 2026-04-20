import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@clinicabot/db";
import { sendAppointmentReminder } from "@/lib/email";
import { generateCancelToken } from "@clinicabot/utils";

/**
 * GET /api/cron/reminders
 *
 * Chamado pelo Vercel Cron Jobs todos os dias às 8h UTC.
 * Envia lembretes de consulta para marcações das próximas 24-26h.
 *
 * vercel.json: { "crons": [{ "path": "/api/cron/reminders", "schedule": "0 8 * * *" }] }
 *
 * Autorização:
 *   - Header: Authorization: Bearer <CRON_SECRET>
 *   - Query param: ?secret=<CRON_SECRET>  (para testes manuais)
 */

function isAuthorized(req: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return false;
  const header = req.headers.get("authorization");
  const param = req.nextUrl.searchParams.get("secret");
  return header === `Bearer ${cronSecret}` || param === cronSecret;
}

async function runReminders() {
  const now = new Date();
  const results = { sent: 0, errors: 0, skipped: 0 };

  // Buscar todas as clínicas ativas com configurações de lembrete
  const clinics = await prisma.clinic.findMany({
    where: { isActive: true },
    include: { settings: true },
  });

  for (const clinic of clinics) {
    const hoursBeforeReminder = clinic.settings?.reminderHoursBefore ?? 24;

    // Janela de 2h: entre agora+hours e agora+hours+2h (nunca perde marcações)
    const windowStart = new Date(now.getTime() + hoursBeforeReminder * 60 * 60 * 1000);
    const windowEnd = new Date(windowStart.getTime() + 2 * 60 * 60 * 1000);

    const appointments = await prisma.appointment.findMany({
      where: {
        clinicId: clinic.id,
        status: { in: ["PENDING", "CONFIRMED"] },
        reminderSent: false,
        scheduledAt: { gte: windowStart, lt: windowEnd },
      },
      include: {
        doctor: {
          select: {
            name: true,
            specialty: { select: { name: true } },
          },
        },
      },
    });

    for (const appt of appointments) {
      try {
        // Garantir cancelToken
        const cancelToken = appt.cancelToken ?? generateCancelToken();
        if (!appt.cancelToken) {
          await prisma.appointment.update({
            where: { id: appt.id },
            data: { cancelToken },
          });
        }

        const specialtyName = appt.doctor.specialty?.name ?? "Consulta";

        await sendAppointmentReminder({
          appointmentId: appt.id,
          patientName: appt.patientName,
          patientEmail: appt.patientEmail,
          clinicName: clinic.name,
          clinicAddress: clinic.address ?? "",
          clinicPhone: clinic.phone ?? "",
          doctorName: appt.doctor.name,
          specialtyName,
          scheduledAt: appt.scheduledAt,
          durationMin: appt.durationMin,
          cancelToken,
          appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "",
        });

        await prisma.appointment.update({
          where: { id: appt.id },
          data: { reminderSent: true },
        });

        results.sent++;
      } catch (err) {
        console.error(`[cron] Erro ao enviar lembrete para ${appt.patientEmail}:`, err);
        results.errors++;
      }
    }
  }

  console.log("[cron/reminders] Concluído:", results);
  return results;
}

// GET — Vercel Cron Jobs (Authorization header) + testes manuais (?secret=)
export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }
  const results = await runReminders();
  return NextResponse.json({ ok: true, ...results });
}

// POST — compatibilidade com chamadas programáticas via Authorization header
export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }
  const results = await runReminders();
  return NextResponse.json({ ok: true, ...results });
}
