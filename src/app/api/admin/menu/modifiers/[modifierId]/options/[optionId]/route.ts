import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/prisma";
import { modifierOptionSchema } from "@/schemas/admin";
import { toDecimal } from "@/lib/pricing";

export async function PUT(request: Request, { params }: { params: { modifierId: string; optionId: string } }) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const payload = await request.json();
  const parsed = modifierOptionSchema.partial().safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const data = {
    ...parsed.data,
    ...(parsed.data.priceDelta !== undefined ? { priceDelta: toDecimal(parsed.data.priceDelta) } : {}),
  };

  const option = await prisma.modifierOption.update({ where: { id: params.optionId }, data });
  return NextResponse.json({ option });
}

export async function DELETE(_: Request, { params }: { params: { optionId: string } }) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.modifierOption.delete({ where: { id: params.optionId } });
  return NextResponse.json({ status: "ok" });
}
