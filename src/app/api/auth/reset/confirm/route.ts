import { NextResponse } from "next/server";
import { resetPasswordConfirmSchema } from "@/schemas/auth";
import { prisma } from "@/lib/prisma";
import { hash } from "bcryptjs";

export async function POST(request: Request) {
  const payload = await request.json();
  const parsed = resetPasswordConfirmSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const token = await prisma.passwordResetToken.findUnique({ where: { token: parsed.data.token } });
  if (!token || token.expiresAt < new Date()) {
    return NextResponse.json({ error: "Token expired" }, { status: 400 });
  }

  const passwordHash = await hash(parsed.data.password, 12);
  await prisma.user.update({ where: { email: token.email }, data: { passwordHash } });
  await prisma.passwordResetToken.delete({ where: { id: token.id } });

  return NextResponse.json({ status: "ok" });
}
