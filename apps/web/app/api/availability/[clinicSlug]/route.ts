import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@clinicabot/db";
import { getAvailableSlots } from "@/lib/availability";

const querySchema = z.object({
  specialty: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  limit: z.coerce.number().min(1).max(20).default(6),
});

/** GET /api/availability/:clinicSlug?specialty=Cardiologia&date=2025-01-14 */
export async function GET(
  req: NextRequest,
  { params }: { params: { clinicSlug: string } }
) {
  const clinic = await prisma.clinic.findUnique({
    where: { slug: params.clinicSlug, isActive: true },
    select: { id: true },
  });

  if (!clinic) {
    return NextResponse.json({ error: "Clínica não encontrada" }, { status: 404 });
  }

  const parsed = querySchema.safeParse(
    Object.fromEntries(req.nextUrl.searchParams.entries())
  );

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Parâmetros inválidos", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { specialty, date, limit } = parsed.data;

  const slots = await getAvailableSlots(clinic.id, specialty, date, limit);

  return NextResponse.json({ slots }, {
    headers: { "Cache-Control": "no-store" },
  });
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
