import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@clinicabot/db";

const PLAN_PRICE: Record<string, number> = {
  PILOT: 0,
  STARTER: 149,
  CLINIC: 299,
  ENTERPRISE: 499,
};

// ─── GET /api/admin/stats — só SUPER_ADMIN ────────────────────────────────────

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  if (session.user.role !== "SUPER_ADMIN")
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });

  const [totalClinics, totalAppointments, totalChatSessions, clinicsByPlan] = await Promise.all([
    prisma.clinic.count(),
    prisma.appointment.count(),
    prisma.chatSession.count(),
    prisma.clinic.groupBy({ by: ["plan"], _count: { id: true } }),
  ]);

  const estimatedRevenue = clinicsByPlan.reduce((sum, row) => {
    return sum + (PLAN_PRICE[row.plan] ?? 0) * row._count.id;
  }, 0);

  return NextResponse.json({
    totalClinics,
    totalAppointments,
    totalChatSessions,
    estimatedRevenue,
    clinicsByPlan: Object.fromEntries(clinicsByPlan.map((r) => [r.plan, r._count.id])),
  });
}
