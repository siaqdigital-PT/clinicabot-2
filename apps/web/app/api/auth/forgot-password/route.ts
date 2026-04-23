import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@clinicabot/db";
import { Resend } from "resend";
import crypto from "crypto";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  const { email } = await req.json() as { email: string };

  if (!email) {
    return NextResponse.json({ error: "Email obrigatório" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email } });

  // Sempre retornar sucesso para não revelar se o email existe
  if (!user) {
    return NextResponse.json({ success: true });
  }

  // Gerar token de reset
  const token = crypto.randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 1000 * 60 * 60); // 1 hora

  // Guardar token na BD
  await prisma.verificationToken.upsert({
    where: { identifier_token: { identifier: email, token: "reset" } },
    update: { token, expires },
    create: { identifier: email, token, expires },
  });

  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}&email=${encodeURIComponent(email)}`;

  // Enviar email
  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL ?? "noreply@clinicabot.pt",
    to: email,
    subject: "Redefinir password — ClinicaBot",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
        <div style="background: #1D9E75; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
          <h1 style="color: white; margin: 0; font-size: 20px;">ClinicaBot</h1>
          <p style="color: rgba(255,255,255,0.8); margin: 4px 0 0;">Painel de Gestão</p>
        </div>
        <h2 style="color: #111827; font-size: 18px;">Redefinir a sua password</h2>
        <p style="color: #6b7280; font-size: 14px;">
          Recebemos um pedido para redefinir a password da sua conta.
          Clique no botão abaixo para continuar. O link expira em 1 hora.
        </p>
        <a href="${resetUrl}" style="display: inline-block; background: #1D9E75; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px; margin: 16px 0;">
          Redefinir Password
        </a>
        <p style="color: #9ca3af; font-size: 12px; margin-top: 24px;">
          Se não pediu a redefinição da password, ignore este email. A sua conta está segura.
        </p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
        <p style="color: #9ca3af; font-size: 11px; text-align: center;">ClinicaBot · suporte@clinicabot.pt</p>
      </div>
    `,
  });

  return NextResponse.json({ success: true });
}
