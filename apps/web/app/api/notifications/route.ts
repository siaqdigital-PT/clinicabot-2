import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@clinicabot/db";

/** GET /api/notifications?since=ISO_DATE */
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const clinicId = session.user.clinicId;
  if (!clinicId) {
    return NextResponse.json({ notifications: [], unseenCount: 0 });
  }

  const since = req.nextUrl.searchParams.get("since");
  let sinceDate: Date;
  try {
    sinceDate = since ? new Date(since) : new Date(Date.now() - 24 * 60 * 60 * 1000);
    if (isNaN(sinceDate.getTime())) throw new Error("invalid");
  } catch {
    sinceDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
  }

  // Janela máxima: últimas 24h
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const appointments = await prisma.appointment.findMany({
    where: {
      clinicId,
      createdAt: { gte: cutoff },
      chatSessionId: { not: null }, // apenas marcações feitas pelo chatbot
    },
    select: {
      id: true,
      patientName: true,
      scheduledAt: true,
      createdAt: true,
      doctor: {
        select: {
          name: true,
          specialty: { select: { name: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  const notifications = appointments.map((a) => ({
    id: a.id,
    patientName: a.patientName,
    doctorName: a.doctor.name,
    specialtyName: a.doctor.specialty?.name ?? null,
    scheduledAt: a.scheduledAt.toISOString(),
    createdAt: a.createdAt.toISOString(),
    isNew: a.createdAt > sinceDate,
  }));

  const unseenCount = notifications.filter((n) => n.isNew).length;

  return NextResponse.json({ notifications, unseenCount });
}
