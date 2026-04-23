import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@clinicabot/db";

const updateClinicSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  website: z.string().url().optional().or(z.literal("")),
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  welcomeMessage: z.string().min(5).max(300).optional(),
  logoUrl: z.string().nullable().optional(),
  chatbotPersonality: z.enum(["professional", "friendly", "formal"]).optional(),
  reminderHoursBefore: z.number().optional(),
  allowCancellation: z.boolean().optional(),
  cancellationHours: z.number().optional(),
  maxBookingDaysAhead: z.number().optional(),
  aiSystemPrompt: z.string().max(2000).optional(),
  chatbotSchedule: z.string().max(1000).optional(),
  chatbotPrices: z.string().max(1000).optional(),
  chatbotFaq: z.string().max(2000).optional(),
  chatbotExtraInfo: z.string().max(1000).optional(),
  insuranceIds: z.array(z.string()).optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  if (
    session.user.role !== "SUPER_ADMIN" &&
    session.user.clinicId !== params.id
  ) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  const isSuperAdmin = session.user.role === "SUPER_ADMIN";

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body inválido" }, { status: 400 });
  }

  const parsed = updateClinicSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos", details: parsed.error.flatten() }, { status: 400 });
  }

  const {
    insuranceIds,
    chatbotPersonality,
    reminderHoursBefore,
    allowCancellation,
    cancellationHours,
    maxBookingDaysAhead,
    aiSystemPrompt,
    chatbotSchedule,
    chatbotPrices,
    chatbotFaq,
    chatbotExtraInfo,
    ...clinicData
  } = parsed.data;

  const settingsData = {
    ...(chatbotPersonality !== undefined && { chatbotPersonality }),
    ...(reminderHoursBefore !== undefined && { reminderHoursBefore }),
    ...(allowCancellation !== undefined && { allowCancellation }),
    ...(cancellationHours !== undefined && { cancellationHours }),
    ...(maxBookingDaysAhead !== undefined && { maxBookingDaysAhead }),
    ...(isSuperAdmin && aiSystemPrompt !== undefined && { aiSystemPrompt }),
    ...(chatbotSchedule !== undefined && { chatbotSchedule }),
    ...(chatbotPrices !== undefined && { chatbotPrices }),
    ...(chatbotFaq !== undefined && { chatbotFaq }),
    ...(chatbotExtraInfo !== undefined && { chatbotExtraInfo }),
  };

  const updatedClinic = await prisma.$transaction(async (tx) => {
    const clinic = await tx.clinic.update({
      where: { id: params.id },
      data: {
        ...clinicData,
        settings: {
          upsert: {
            create: settingsData,
            update: settingsData,
          },
        },
      },
    });

    if (insuranceIds !== undefined) {
      await tx.clinicInsurance.deleteMany({ where: { clinicId: params.id } });
      if (insuranceIds.length > 0) {
        await tx.clinicInsurance.createMany({
          data: insuranceIds.map((insuranceId) => ({ clinicId: params.id, insuranceId })),
        });
      }
    }

    return clinic;
  });

  return NextResponse.json(updatedClinic);
}