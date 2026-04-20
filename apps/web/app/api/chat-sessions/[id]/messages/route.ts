import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@clinicabot/db";

// ─── GET /api/chat-sessions/[id]/messages ─────────────────────────────────────

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const clinicId =
    session.user.role === "SUPER_ADMIN" ? undefined : (session.user.clinicId ?? "");

  // Verificar que a sessão pertence à clínica do utilizador
  const chatSession = await prisma.chatSession.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      clinicId: true,
      patientName: true,
      patientEmail: true,
      createdAt: true,
      lastActiveAt: true,
      appointments: {
        select: {
          id: true,
          patientName: true,
          scheduledAt: true,
          status: true,
        },
      },
    },
  });

  if (!chatSession) {
    return NextResponse.json({ error: "Sessão não encontrada" }, { status: 404 });
  }

  if (clinicId && chatSession.clinicId !== clinicId) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  const messages = await prisma.chatMessage.findMany({
    where: { sessionId: params.id },
    orderBy: { createdAt: "asc" },
    select: { id: true, role: true, content: true, createdAt: true },
  });

  // Filtrar mensagens SYSTEM (não são relevantes para visualização)
  const visible = messages.filter((m) => m.role !== "SYSTEM");

  return NextResponse.json({ session: chatSession, messages: visible });
}
