import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Resend } from "resend";
import crypto from "crypto";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  const { email } = await req.json();

  if (!email?.endsWith("@amplifica.io")) {
    return NextResponse.json({ ok: true }); // don't reveal if email exists
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return NextResponse.json({ ok: true });

  // Delete any existing token for this email
  await prisma.passwordResetToken.deleteMany({ where: { email } });

  const token = crypto.randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 1000 * 60 * 60); // 1 hour

  await prisma.passwordResetToken.create({ data: { email, token, expires } });

  const resetUrl = `${process.env.NEXTAUTH_URL}/reset/${token}`;

  await resend.emails.send({
    from: "CRM Amplifica <noreply@amplifica.io>",
    to: email,
    subject: "Recuperación de contraseña — CRM Amplifica",
    html: `
      <div style="font-family: Inter, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; background: #121755; border-radius: 16px; color: #fff;">
        <h2 style="font-size: 20px; font-weight: 700; margin: 0 0 16px;">Recupera tu contraseña</h2>
        <p style="font-size: 14px; color: rgba(255,255,255,0.7); margin: 0 0 24px;">
          Hola ${user.name ?? email}, recibimos una solicitud para restablecer tu contraseña del CRM.
        </p>
        <a href="${resetUrl}" style="display:inline-block; padding: 12px 24px; background: #4548FF; color: #fff; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">
          Restablecer contraseña
        </a>
        <p style="font-size: 12px; color: rgba(255,255,255,0.4); margin: 24px 0 0;">
          Este enlace expira en 1 hora. Si no solicitaste esto, ignora este correo.
        </p>
      </div>
    `,
  });

  return NextResponse.json({ ok: true });
}
