import { NextResponse } from "next/server";
import { resetPasswordSchema } from "@/schemas/auth";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { sendOrderConfirmationEmail } from "@/lib/email";

export async function POST(request: Request) {
  const payload = await request.json();
  const parsed = resetPasswordSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (!user) {
    return NextResponse.json({ status: "ok" });
  }

  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

  await prisma.passwordResetToken.create({
    data: {
      email: user.email,
      token,
      expiresAt,
    },
  });

  const resetUrl = `${process.env.NEXTAUTH_URL}/auth/reset-password?token=${token}`;

  await sendOrderConfirmationEmail({
    to: user.email,
    subject: "Reset your password",
    html: `<p>Use the link below to reset your password. This link expires in 60 minutes.</p><p><a href="${resetUrl}">${resetUrl}</a></p>`,
  });

  return NextResponse.json({ status: "ok" });
}
