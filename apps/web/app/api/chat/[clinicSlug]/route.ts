import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@clinicabot/db";
import { groqClient, GROQ_MODEL } from "@/lib/chatbot/groq-client";
import { buildSystemPrompt } from "@/lib/chatbot/system-prompt";
import { chatbotTools } from "@/lib/chatbot/tools";
import { getAvailableSlots } from "@/lib/availability";
import { generateCancelToken, formatSlotShort } from "@clinicabot/utils";
import { sendAppointmentConfirmation, sendClinicNotification } from "@/lib/email";
import type OpenAI from "openai";

const bodySchema = z.object({
  sessionToken: z.string().nullable().optional(),
  message: z.string().min(1).max(2000),
});

const SSE_HEADERS = {
  "Content-Type": "text/event-stream",
  "Cache-Control": "no-cache",
  Connection: "keep-alive",
  "Access-Control-Allow-Origin": "*",
};

const _enc = new TextEncoder();
function sseChunk(data: object): Uint8Array {
  return _enc.encode(`data: ${JSON.stringify(data)}\n\n`);
}

export async function POST(
  req: NextRequest,
  { params }: { params: { clinicSlug: string } }
) {
  const isStream =
    req.headers.get("accept")?.includes("text/event-stream") ||
    req.nextUrl.searchParams.get("stream") === "true";

  const clinic = await prisma.clinic.findUnique({
    where: { slug: params.clinicSlug, isActive: true },
    include: {
      specialties: { where: { isActive: true }, select: { name: true, durationMin: true } },
      insurances: { include: { insurance: true } },
      settings: true,
    },
  });

  if (!clinic) {
    return NextResponse.json({ error: "Clínica não encontrada" }, { status: 404 });
  }

  let rawBody: unknown;
  try {
    rawBody = await req.json();
  } catch {
    return NextResponse.json({ error: "Body inválido" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }

  const { sessionToken, message } = parsed.data;

  let session = sessionToken
    ? await prisma.chatSession.findUnique({ where: { sessionToken } })
    : null;

  if (!session) {
    session = await prisma.chatSession.create({
      data: { clinicId: clinic.id },
    });
  } else {
    await prisma.chatSession.update({
      where: { id: session.id },
      data: { lastActiveAt: new Date() },
    });
  }

  await prisma.chatMessage.create({
    data: { sessionId: session.id, role: "USER", content: message },
  });

  const history = await prisma.chatMessage.findMany({
    where: { sessionId: session.id, role: { not: "SYSTEM" } },
    orderBy: { createdAt: "asc" },
    take: 20,
  });

  const systemPrompt = buildSystemPrompt({
    name: clinic.name,
    specialties: clinic.specialties,
    insurances: clinic.insurances.map((ci) => ci.insurance.name),
    settings: {
      chatbotPersonality: clinic.settings?.chatbotPersonality ?? "professional",
      aiSystemPrompt: clinic.settings?.aiSystemPrompt,
    },
    phone: clinic.phone,
    address: clinic.address,
  });

  const apiMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: "system", content: systemPrompt },
    ...history.map((m) => ({
      role: m.role.toLowerCase() as "user" | "assistant",
      content: m.content,
    })),
  ];

  const capturedSession = session;
  const capturedClinic = clinic;

  async function runToolCall(toolCall: {
    id: string;
    name: string;
    arguments: string;
  }): Promise<{ result: unknown; metadata: Record<string, unknown> | null }> {
    const { name: toolName } = toolCall;
    const args = JSON.parse(toolCall.arguments) as Record<string, unknown>;

    if (toolName === "check_availability") {
      const slots = await getAvailableSlots(
        capturedClinic.id,
        args.specialtyName as string,
        args.preferredDate as string | undefined,
        6
      );
      if (slots.length === 0) {
        return {
          result: {
            available: false,
            message: "Não foram encontrados horários disponíveis nos próximos 14 dias para esta especialidade.",
          },
          metadata: null,
        };
      }
      return {
        result: {
          available: true,
          horariosDisponiveis: slots.map((s) => ({
            ...s,
            label: formatSlotShort(s.startTime),
          })),
        },
        metadata: null,
      };
    }

    if (toolName === "create_appointment") {
      const apptArgs = args as {
        patientName: string;
        patientEmail: string;
        patientPhone?: string;
        specialtyName: string;
        doctorId: string;
        scheduledAt: string;
        insuranceName?: string;
        notes?: string;
      };

      let doctor = await prisma.doctor.findFirst({
        where: { id: apptArgs.doctorId, clinicId: capturedClinic.id, isActive: true },
      });

      if (!doctor && apptArgs.doctorId) {
        const byName = await prisma.doctor.findFirst({
          where: {
            clinicId: capturedClinic.id,
            isActive: true,
            name: { contains: apptArgs.doctorId, mode: "insensitive" },
          },
        });
        if (byName) doctor = byName;
      }

      if (!doctor) {
        const specialty = await prisma.specialty.findFirst({
          where: {
            clinicId: capturedClinic.id,
            name: { equals: apptArgs.specialtyName, mode: "insensitive" },
          },
        });
        if (specialty) {
          doctor = await prisma.doctor.findFirst({
            where: { clinicId: capturedClinic.id, specialtyId: specialty.id, isActive: true },
          });
        }
      }

      if (!doctor) {
        return {
          result: {
            success: false,
            error: "Não foi possível encontrar o médico. Por favor escolha novamente um dos horários disponíveis.",
          },
          metadata: null,
        };
      }

      apptArgs.doctorId = doctor.id;
      const cancelToken = generateCancelToken();

      const appointment = await prisma.appointment.create({
        data: {
          clinicId: capturedClinic.id,
          doctorId: apptArgs.doctorId,
          patientName: apptArgs.patientName,
          patientEmail: apptArgs.patientEmail,
          patientPhone: apptArgs.patientPhone,
          scheduledAt: new Date(apptArgs.scheduledAt),
          durationMin: 30,
          insuranceName: apptArgs.insuranceName,
          notes: apptArgs.notes,
          chatSessionId: capturedSession.id,
          cancelToken,
        },
        include: { doctor: { select: { name: true } } },
      });

      await prisma.chatSession.update({
        where: { id: capturedSession.id },
        data: {
          patientName: apptArgs.patientName,
          patientEmail: apptArgs.patientEmail,
        },
      });

      void sendAppointmentConfirmation({
        appointmentId: appointment.id,
        patientName: appointment.patientName,
        patientEmail: appointment.patientEmail,
        clinicName: capturedClinic.name,
        clinicAddress: capturedClinic.address ?? "",
        clinicPhone: capturedClinic.phone ?? "",
        doctorName: appointment.doctor.name,
        specialtyName: apptArgs.specialtyName,
        scheduledAt: appointment.scheduledAt,
        durationMin: appointment.durationMin,
        cancelToken,
        appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "",
      }).catch((err: unknown) => console.error("[chat] Erro email:", err));

      void sendClinicNotification(capturedClinic.email ?? "", {
        patientName: appointment.patientName,
        specialtyName: apptArgs.specialtyName,
        scheduledAt: appointment.scheduledAt,
        doctorName: appointment.doctor.name,
      }).catch((err: unknown) => console.error("[chat] Erro email clínica:", err));

      return {
        result: {
          success: true,
          appointmentId: appointment.id,
          message: `Marcação criada para ${apptArgs.patientName} em ${formatSlotShort(apptArgs.scheduledAt)} com ${appointment.doctor.name}.`,
        },
        metadata: { action: "booking_created", appointmentId: appointment.id },
      };
    }

    if (toolName === "get_clinic_info") {
      return {
        result: {
          name: capturedClinic.name,
          address: capturedClinic.address,
          phone: capturedClinic.phone,
          email: capturedClinic.email,
          website: capturedClinic.website,
          specialties: capturedClinic.specialties.map((s) => s.name),
          insurances: capturedClinic.insurances.map((ci) => ci.insurance.name),
        },
        metadata: null,
      };
    }

    return { result: { error: `Função desconhecida: ${toolName}` }, metadata: null };
  }

  if (isStream) {
    return new Response(
      new ReadableStream({
        async start(controller) {
          let finalResponse = "";
          let toolCallsMetadata: Record<string, unknown> | null = null;
          const MAX_TOOL_ROUNDS = 3;
          let round = 0;

          try {
            while (round < MAX_TOOL_ROUNDS) {
              round++;

              const groqStream = await groqClient.chat.completions.create({
                model: GROQ_MODEL,
                messages: apiMessages,
                tools: chatbotTools,
                tool_choice: "auto",
                max_tokens: 1024,
                temperature: 0.7,
                stream: true,
              });

              let textContent = "";
              const toolCallMap = new Map<number, { id: string; name: string; arguments: string }>();

              for await (const chunk of groqStream) {
                const delta = chunk.choices[0]?.delta;
                if (!delta) continue;

                if (delta.content) {
                  textContent += delta.content;
                  controller.enqueue(sseChunk({ type: "text", content: delta.content }));
                }

                if (delta.tool_calls) {
                  for (const tc of delta.tool_calls) {
                    const existing = toolCallMap.get(tc.index) ?? { id: "", name: "", arguments: "" };
                    if (tc.id) existing.id = tc.id;
                    if (tc.function?.name) existing.name += tc.function.name;
                    if (tc.function?.arguments) existing.arguments += tc.function.arguments;
                    toolCallMap.set(tc.index, existing);
                  }
                }
              }

              if (toolCallMap.size === 0) {
                finalResponse = textContent;
                break;
              }

              const toolCalls = Array.from(toolCallMap.entries())
                .sort(([a], [b]) => a - b)
                .map(([, tc]) => ({
                  id: tc.id,
                  type: "function" as const,
                  function: { name: tc.name, arguments: tc.arguments },
                }));

              apiMessages.push({
                role: "assistant",
                content: textContent || null,
                tool_calls: toolCalls,
              });

              for (const toolCall of toolCalls) {
                let toolResult: unknown;
                try {
                  const { result, metadata } = await runToolCall({
                    id: toolCall.id,
                    name: toolCall.function.name,
                    arguments: toolCall.function.arguments,
                  });
                  toolResult = result;
                  if (metadata) toolCallsMetadata = metadata;
                } catch (err) {
                  console.error(`[chat/stream] Erro na tool ${toolCall.function.name}:`, err);
                  toolResult = { error: "Erro interno ao processar o pedido" };
                }

                apiMessages.push({
                  role: "tool",
                  tool_call_id: toolCall.id,
                  content: JSON.stringify(toolResult),
                });
              }
            }

            await prisma.chatMessage.create({
              data: {
                sessionId: capturedSession.id,
                role: "ASSISTANT",
                content: finalResponse,
                metadata: (toolCallsMetadata ?? undefined) as never,
              },
            });

            controller.enqueue(
              sseChunk({
                type: "done",
                message: finalResponse,
                metadata: toolCallsMetadata,
                sessionToken: capturedSession.sessionToken,
              })
            );
          } catch (err) {
            console.error("[chat/stream] Erro:", err);
            controller.enqueue(sseChunk({ type: "error", message: "Ocorreu um erro interno" }));
          } finally {
            controller.close();
          }
        },
      }),
      { headers: SSE_HEADERS }
    );
  }

  let finalResponse = "";
  let toolCallsMetadata: Record<string, unknown> | null = null;
  const MAX_TOOL_ROUNDS = 3;
  let round = 0;

  while (round < MAX_TOOL_ROUNDS) {
    round++;

    const completion = await groqClient.chat.completions.create({
      model: GROQ_MODEL,
      messages: apiMessages,
      tools: chatbotTools,
      tool_choice: "auto",
      max_tokens: 1024,
      temperature: 0.7,
    });

    const choice = completion.choices[0];
    if (!choice) break;

    const assistantMessage = choice.message;

    if (!assistantMessage.tool_calls || assistantMessage.tool_calls.length === 0) {
      finalResponse = assistantMessage.content ?? "";
      break;
    }

    apiMessages.push(assistantMessage);

    for (const toolCall of assistantMessage.tool_calls) {
      let toolResult: unknown;
      try {
        const { result, metadata } = await runToolCall({
          id: toolCall.id,
          name: toolCall.function.name,
          arguments: toolCall.function.arguments,
        });
        toolResult = result;
        if (metadata) toolCallsMetadata = metadata;
      } catch (err) {
        console.error(`[chat] Erro na tool ${toolCall.function.name}:`, err);
        toolResult = { error: "Erro interno ao processar o pedido" };
      }

      apiMessages.push({
        role: "tool",
        tool_call_id: toolCall.id,
        content: JSON.stringify(toolResult),
      });
    }
  }

  await prisma.chatMessage.create({
    data: {
      sessionId: session.id,
      role: "ASSISTANT",
      content: finalResponse,
      metadata: (toolCallsMetadata ?? undefined) as never,
    },
  });

  return NextResponse.json({
    sessionToken: session.sessionToken,
    message: finalResponse,
    metadata: toolCallsMetadata,
  });
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}