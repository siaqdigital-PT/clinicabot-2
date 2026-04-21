import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@clinicabot/db";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const clinicId = session.user.clinicId;
  if (!clinicId && session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Sem clínica associada" }, { status: 403 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const targetClinicId = (formData.get("clinicId") as string) || clinicId;

  if (!file) return NextResponse.json({ error: "Ficheiro não encontrado" }, { status: 400 });

  const allowedTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/svg+xml"];
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json({ error: "Tipo não suportado. Use PNG, JPG, WebP ou SVG." }, { status: 400 });
  }
  if (file.size > 2 * 1024 * 1024) {
    return NextResponse.json({ error: "Ficheiro demasiado grande. Máximo 2MB." }, { status: 400 });
  }

  const { put } = await import("@vercel/blob");
  const ext = file.name.split(".").pop() ?? "png";
  const filename = `logos/${targetClinicId}.${ext}`;

  const blob = await put(filename, file, {
    access: "private",
    addRandomSuffix: false,
  });

  await prisma.clinic.update({
    where: { id: targetClinicId! },
    data: { logoUrl: blob.url },
  });

  return NextResponse.json({ url: blob.url });
}