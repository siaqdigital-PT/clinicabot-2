import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { auth } from "@/auth";
import { prisma } from "@clinicabot/db";
import { slugify } from "@clinicabot/utils";

const createClinicSchema = z.object({
  name: z.string().min(2).max(100),
  slug: z.string().min(2).max(60).optional(),
  email: z.string().email(),
  phone: z.string().optional(),
  address: z.string().optional(),
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#1D9E75"),
});

async function guardSuperAdmin() {
  const session = await auth();
  if (!session) return { error: "Não autorizado", status: 401 } as const;
  if (session.user.role !== "SUPER_ADMIN") return { error: "Acesso negado", status: 403 } as const;
  return { session };
}

export async function GET() {
  const guard = await guardSuperAdmin();
  if ("error" in guard)
    return NextResponse.json({ error: guard.error }, { status: guard.status });

  const clinics = await prisma.clinic.findMany({
    include: {
      _count: { select: { appointments: true, chatSessions: true, users: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(clinics);
}

export async function POST(req: NextRequest) {
  const guard = await guardSuperAdmin();
  if ("error" in guard)
    return NextResponse.json({ error: guard.error }, { status: guard.status });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body inválido" }, { status: 400 });
  }

  const parsed = createClinicSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: "Dados inválidos", details: parsed.error.flatten() }, { status: 400 });

  const { name, email, phone, address, primaryColor } = parsed.data;
  const slug = parsed.data.slug ?? slugify(name);

  const existingSlug = await prisma.clinic.findUnique({ where: { slug } });
  if (existingSlug)
    return NextResponse.json({ error: "Slug já em uso. Escolhe outro." }, { status: 409 });

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser)
    return NextResponse.json({ error: "Já existe um utilizador com este email." }, { status: 409 });

  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  const tempPassword = Array.from({ length: 8 }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join("");

  const hashedPassword = await bcrypt.hash(tempPassword, 12);

  const clinic = await prisma.$transaction(async (tx) => {
    const newClinic = await tx.clinic.create({
      data: { name, slug, email, phone, address, primaryColor, plan: "CLINIC" },
    });

    await tx.clinicSettings.create({
      data: { clinicId: newClinic.id },
    });

    await tx.user.create({
      data: {
        clinicId: newClinic.id,
        email,
        name: `Admin ${name}`,
        password: hashedPassword,
        role: "CLINIC_ADMIN",
      },
    });

    return newClinic;
  });

  return NextResponse.json(
    { clinic, tempPassword, adminEmail: email },
    { status: 201 }
  );
}
