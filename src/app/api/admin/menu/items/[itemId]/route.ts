import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/prisma";
import { itemSchema } from "@/schemas/admin";
import { toDecimal } from "@/lib/pricing";

export async function PUT(request: Request, { params }: { params: { itemId: string } }) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const payload = await request.json();
  const parsed = itemSchema.partial().safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const data = {
    ...parsed.data,
    ...(parsed.data.basePrice !== undefined ? { basePrice: toDecimal(parsed.data.basePrice) } : {}),
  };

  const item = await prisma.item.update({ where: { id: params.itemId }, data });
  return NextResponse.json({ item });
}

export async function DELETE(_: Request, { params }: { params: { itemId: string } }) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.item.delete({ where: { id: params.itemId } });
  return NextResponse.json({ status: "ok" });
}
