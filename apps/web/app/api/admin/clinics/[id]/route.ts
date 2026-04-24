import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@clinicabot/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session || session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  const clinic = await prisma.clinic.findUnique({
    where: { id: params.id },
    include: {
      doctors: {
        where: { isActive: true },
        include: { specialty: { select: { name: true } } },
        orderBy: { name: "asc" },
      },
      specialties: {
        where: { isActive: true },
        orderBy: { name: "asc" },
      },
      appointments: {
        orderBy: { scheduledAt: "desc" },
        take: 10,
        include: {
          doctor: { select: { name: true, specialty: { select: { name: true } } } },
        },
      },
      users: {
        select: { id: true, name: true, email: true, role: true, createdAt: true },
        orderBy: { createdAt: "asc" },
      },
      _count: {
        select: {
          appointments: true,
          chatSessions: true,
          doctors: true,
          specialties: true,
          users: true,
        },
      },
    },
  });

  if (!clinic) {
    return NextResponse.json({ error: "Clínica não encontrada" }, { status: 404 });
  }

  return NextResponse.json(clinic);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session || session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  const body = await req.json() as {
    isActive?: boolean;
    renewalDate?: string | null;
    internalNotes?: string | null;
  };

  const clinic = await prisma.clinic.update({
    where: { id: params.id },
    data: {
      ...(body.isActive !== undefined && { isActive: body.isActive }),
      ...(body.renewalDate !== undefined && {
        renewalDate: body.renewalDate ? new Date(body.renewalDate) : null,
      }),
      ...(body.internalNotes !== undefined && { internalNotes: body.internalNotes }),
    },
  });

  return NextResponse.json(clinic);
}
