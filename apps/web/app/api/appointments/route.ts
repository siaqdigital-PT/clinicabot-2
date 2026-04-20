import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@clinicabot/db";
import { generateCancelToken } from "@clinicabot/utils";
import { sendAppointmentConfirmation, sendClinicNotification } from "@/lib/email";
import { getPaginationParams } from "@clinicabot/utils";

// ─── Schema de validação ──────────────────────────────────────────────────────

const createSchema = z.object({
  clinicId: z.string().cuid().optional(),
  doctorId: z.string().cuid(),
  patientName: z.string().min(2).max(100),
  patientEmail: z.string().email(),
  patientPhone: z.string().optional(),
  specialtyName: z.string().min(1).optional(),
  scheduledAt: z.string().datetime(),
  durationMin: z.number().int().min(10).max(240).default(30),
  insuranceName: z.string().optional(),
  notes: z.string().max(500).optional(),
  chatSessionId: z.string().cuid().optional(),
  status: z.enum(["PENDING", "CONFIRMED"]).optional(),
});

const listSchema = z.object({
  page: z.coerce.number().default(1),
  pageSize: z.coerce.number().default(20),
  status: z.enum(["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED", "NO_SHOW"]).optional(),
  doctorId: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  search: z.string().optional(),
});

// ─── GET /api/appointments ────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const parsed = listSchema.safeParse(
    Object.fromEntries(req.nextUrl.searchParams.entries())
  );
  if (!parsed.success) {
    return NextResponse.json({ error: "Parâmetros inválidos" }, { status: 400 });
  }

  const { page, pageSize, status, doctorId, from, to, search } = parsed.data;
  const { skip, take } = getPaginationParams(page, pageSize);

  // Super Admin vê todas; Clinic Admin/Receptionist vê apenas a sua clínica
  const clinicFilter =
    session.user.role === "SUPER_ADMIN" ? {} : { clinicId: session.user.clinicId ?? "" };

  const where = {
    ...clinicFilter,
    ...(status && { status }),
    ...(doctorId && { doctorId }),
    ...(from && { scheduledAt: { gte: new Date(from) } }),
    ...(to && { scheduledAt: { lte: new Date(to) } }),
    ...(search && {
      OR: [
        { patientName: { contains: search, mode: "insensitive" as const } },
        { patientEmail: { contains: search, mode: "insensitive" as const } },
      ],
    }),
  };

  const [appointments, total] = await Promise.all([
    prisma.appointment.findMany({
      where,
      include: {
        doctor: { select: { name: true, specialty: { select: { name: true } } } },
      },
      orderBy: { scheduledAt: "asc" },
      skip,
      take,
    }),
    prisma.appointment.count({ where }),
  ]);

  return NextResponse.json({
    data: appointments,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / take),
  });
}

// ─── POST /api/appointments ───────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  // Endpoint acessível com sessão autenticada OU via chatbot (sem sessão, mas com clinicId no body)
  const session = await auth();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body inválido" }, { status: 400 });
  }

  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const data = parsed.data;

  // Resolver clinicId: sessão tem prioridade; SUPER_ADMIN sem clinicId deriva do médico
  let clinicId: string | null | undefined = session?.user.clinicId ?? data.clinicId;
  if (!clinicId && data.doctorId) {
    const doctorRecord = await prisma.doctor.findUnique({
      where: { id: data.doctorId },
      select: { clinicId: true },
    });
    clinicId = doctorRecord?.clinicId;
  }
  if (!clinicId) {
    return NextResponse.json({ error: "clinicId em falta" }, { status: 400 });
  }

  // Verificar que a clínica existe
  const clinic = await prisma.clinic.findUnique({
    where: { id: clinicId, isActive: true },
    include: { settings: true },
  });
  if (!clinic) {
    return NextResponse.json({ error: "Clínica não encontrada" }, { status: 404 });
  }

  // Verificar que o médico pertence à clínica
  const doctor = await prisma.doctor.findFirst({
    where: { id: data.doctorId, clinicId, isActive: true },
    include: { specialty: true },
  });
  if (!doctor) {
    return NextResponse.json({ error: "Médico não encontrado" }, { status: 404 });
  }

  // Verificar conflito de horário
  const scheduledAt = new Date(data.scheduledAt);
  const conflictingAppt = await prisma.appointment.findFirst({
    where: {
      doctorId: data.doctorId,
      status: { notIn: ["CANCELLED"] },
      scheduledAt: {
        gte: new Date(scheduledAt.getTime() - data.durationMin * 60 * 1000),
        lt: new Date(scheduledAt.getTime() + data.durationMin * 60 * 1000),
      },
    },
  });

  if (conflictingAppt) {
    return NextResponse.json(
      { error: "Conflito de horário — esse slot já está ocupado" },
      { status: 409 }
    );
  }

  const cancelToken = generateCancelToken();

  // Marcações manuais (com sessão) ficam CONFIRMED; chatbot fica PENDING
  const appointmentStatus = data.status ?? (session ? "CONFIRMED" : "PENDING");

  const appointment = await prisma.appointment.create({
    data: {
      clinicId,
      doctorId: data.doctorId,
      patientName: data.patientName,
      patientEmail: data.patientEmail,
      patientPhone: data.patientPhone,
      scheduledAt,
      durationMin: data.durationMin,
      insuranceName: data.insuranceName,
      notes: data.notes,
      chatSessionId: data.chatSessionId,
      cancelToken,
      status: appointmentStatus,
    },
    include: {
      doctor: { select: { name: true, specialty: { select: { name: true } } } },
      clinic: { select: { name: true, address: true, phone: true, email: true } },
    },
  });

  // Enviar emails de confirmação (em paralelo, sem bloquear a resposta)
  void Promise.all([
    sendAppointmentConfirmation({
      appointmentId: appointment.id,
      patientName: appointment.patientName,
      patientEmail: appointment.patientEmail,
      clinicName: appointment.clinic.name,
      clinicAddress: appointment.clinic.address ?? "",
      clinicPhone: appointment.clinic.phone ?? "",
      doctorName: appointment.doctor.name,
      specialtyName: appointment.doctor?.specialty?.name ?? data.specialtyName ?? "Consulta",
      scheduledAt: appointment.scheduledAt,
      durationMin: appointment.durationMin,
      cancelToken,
      appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "",
    }).catch((err: unknown) => console.error("[email] Erro ao enviar confirmação:", err)),
    sendClinicNotification(appointment.clinic.email ?? "", {
      patientName: appointment.patientName,
      specialtyName: appointment.doctor?.specialty?.name ?? data.specialtyName ?? "Consulta",
      scheduledAt: appointment.scheduledAt,
      doctorName: appointment.doctor.name,
    }).catch((err: unknown) => console.error("[email] Erro ao notificar clínica:", err)),
  ]);

  return NextResponse.json(appointment, { status: 201 });
}
