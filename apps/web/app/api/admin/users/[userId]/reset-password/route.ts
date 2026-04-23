import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@clinicabot/db";
import { Resend } from "resend";
import crypto from "crypto";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  const session = await auth();
  if (!session || session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  const user = await prisma.user.findUnique({
    where: { id: params.userId },
  });

  if (!user) {
    return NextResponse.json({ error: "Utilizador não encontrado" }, { status: 404 });
  }

  // Gerar token de reset
  const token = crypto.randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 1000 * 60 * 60 * 24); // 24 horas

  await prisma.verificationToken.upsert({
    where: { identifier_token: { identifier: user.email, token: "reset" } },
    update: { token, expires },
    create: { identifier: user.email, token, expires },
  });

  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}&email=${encodeURIComponent(user.email)}`;

  // Enviar email
  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL ?? "noreply@clinicabot.pt",
    to: user.email,
    subject: "Redefinir password — ClinicaBot",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
        <div style="background: #1D9E75; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
          <h1 style="color: white; margin: 0; font-size: 20px;">ClinicaBot</h1>
          <p style="color: rgba(255,255,255,0.8); margin: 4px 0 0;">Painel de Gestão</p>
        </div>
        <h2 style="color: #111827; font-size: 18px;">Redefinir a sua password</h2>
        <p style="color: #6b7280; font-size: 14px;">
          O administrador do sistema solicitou a redefinição da sua password.
          Clique no botão abaixo para definir uma nova password. O link expira em 24 horas.
        </p>
        <a href="${resetUrl}" style="display: inline-block; background: #1D9E75; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px; margin: 16px 0;">
          Redefinir Password
        </a>
        <p style="color: #9ca3af; font-size: 12px; margin-top: 24px;">
          Se não esperava este email, contacte o suporte em suporte@clinicabot.pt
        </p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
        <p style="color: #9ca3af; font-size: 11px; text-align: center;">ClinicaBot · suporte@clinicabot.pt</p>
      </div>
    `,
  });

  return NextResponse.json({ success: true, email: user.email });
}
