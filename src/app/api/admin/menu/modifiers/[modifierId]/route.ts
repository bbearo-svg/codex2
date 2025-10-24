import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/prisma";
import { modifierSchema } from "@/schemas/admin";

export async function PUT(request: Request, { params }: { params: { modifierId: string } }) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const payload = await request.json();
  const parsed = modifierSchema.partial().safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const modifier = await prisma.modifier.update({ where: { id: params.modifierId }, data: parsed.data });
  return NextResponse.json({ modifier });
}

export async function DELETE(_: Request, { params }: { params: { modifierId: string } }) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.modifier.delete({ where: { id: params.modifierId } });
  return NextResponse.json({ status: "ok" });
}
