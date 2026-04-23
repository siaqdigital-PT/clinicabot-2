import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@clinicabot/db";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { currentPassword, newPassword } = await req.json() as {
    currentPassword: string;
    newPassword: string;
  };

  if (!currentPassword || !newPassword) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }

  if (newPassword.length < 8) {
    return NextResponse.json({ error: "A nova password deve ter pelo menos 8 caracteres" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user?.password) {
    return NextResponse.json({ error: "Conta sem password definida (usa Google OAuth)" }, { status: 400 });
  }

  const isValid = await bcrypt.compare(currentPassword, user.password);
  if (!isValid) {
    return NextResponse.json({ error: "Password atual incorreta" }, { status: 400 });
  }

  const hashed = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({
    where: { email: session.user.email },
    data: { password: hashed },
  });

  return NextResponse.json({ success: true });
}
