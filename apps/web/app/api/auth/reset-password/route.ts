import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@clinicabot/db";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  const { token, email, password } = await req.json() as {
    token: string;
    email: string;
    password: string;
  };

  if (!token || !email || !password) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }

  if (password.length < 8) {
    return NextResponse.json({ error: "A password deve ter pelo menos 8 caracteres" }, { status: 400 });
  }

  // Verificar token
  const verificationToken = await prisma.verificationToken.findUnique({
    where: { identifier_token: { identifier: email, token: "reset" } },
  });

  if (!verificationToken || verificationToken.token !== token) {
    return NextResponse.json({ error: "Link inválido ou expirado" }, { status: 400 });
  }

  if (verificationToken.expires < new Date()) {
    await prisma.verificationToken.delete({
      where: { identifier_token: { identifier: email, token: "reset" } },
    });
    return NextResponse.json({ error: "Link expirado. Solicite um novo." }, { status: 400 });
  }

  // Atualizar password
  const hashed = await bcrypt.hash(password, 12);
  await prisma.user.update({
    where: { email },
    data: { password: hashed },
  });

  // Apagar token usado
  await prisma.verificationToken.delete({
    where: { identifier_token: { identifier: email, token: "reset" } },
  });

  return NextResponse.json({ success: true });
}
