import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@clinicabot/db";

// ─── GET /api/chat-sessions ───────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const clinicId =
    session.user.role === "SUPER_ADMIN" ? undefined : (session.user.clinicId ?? "");

  const search = req.nextUrl.searchParams.get("search")?.trim() ?? "";

  const sessions = await prisma.chatSession.findMany({
    where: {
      ...(clinicId ? { clinicId } : {}),
      ...(search
        ? {
            OR: [
              { patientName: { contains: search, mode: "insensitive" } },
              { patientEmail: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    include: {
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { content: true, role: true, createdAt: true },
      },
      _count: { select: { messages: true } },
      appointments: { select: { id: true }, take: 1 },
    },
    orderBy: { lastActiveAt: "desc" },
    take: 200,
  });

  const data = sessions.map((s) => ({
    id: s.id,
    patientName: s.patientName,
    patientEmail: s.patientEmail,
    lastActiveAt: s.lastActiveAt,
    createdAt: s.createdAt,
    messageCount: s._count.messages,
    lastMessage: s.messages[0] ?? null,
    hasAppointment: s.appointments.length > 0,
  }));

  // Estatísticas de conversão
  const total = data.length;
  const withAppointment = data.filter((s) => s.hasAppointment).length;

  return NextResponse.json({ sessions: data, total, withAppointment });
}
