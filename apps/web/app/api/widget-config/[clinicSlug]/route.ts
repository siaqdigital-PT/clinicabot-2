import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@clinicabot/db";
import type { WidgetConfig } from "@clinicabot/types";

/** GET /api/widget-config/:clinicSlug — configuração pública do widget */
export async function GET(
  _req: NextRequest,
  { params }: { params: { clinicSlug: string } }
) {
  const clinic = await prisma.clinic.findUnique({
    where: { slug: params.clinicSlug, isActive: true },
    select: {
      id: true,
      name: true,
      slug: true,
      primaryColor: true,
      welcomeMessage: true,
      logoUrl: true,
      phone: true,
    },
  });

  if (!clinic) {
    return NextResponse.json({ error: "Clínica não encontrada" }, { status: 404 });
  }

  const config: WidgetConfig = {
    clinicId: clinic.id,
    clinicName: clinic.name,
    slug: clinic.slug,
    primaryColor: clinic.primaryColor,
    welcomeMessage: clinic.welcomeMessage,
    logoUrl: clinic.logoUrl,
    phone: clinic.phone,
  };

  return NextResponse.json(config, {
    headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" },
  });
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
