import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/prisma";
import { discountSchema } from "@/schemas/admin";
import { toDecimal } from "@/lib/pricing";

export async function PUT(request: Request, { params }: { params: { discountId: string } }) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const payload = await request.json();
  const parsed = discountSchema.partial().safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const data = {
    ...parsed.data,
    ...(parsed.data.value !== undefined ? { value: toDecimal(parsed.data.value) } : {}),
    ...(parsed.data.minSubtotal !== undefined ? { minSubtotal: toDecimal(parsed.data.minSubtotal) } : {}),
    ...(parsed.data.startsAt ? { startsAt: new Date(parsed.data.startsAt) } : {}),
    ...(parsed.data.endsAt ? { endsAt: new Date(parsed.data.endsAt) } : {}),
  };

  const discount = await prisma.discount.update({ where: { id: params.discountId }, data });
  return NextResponse.json({ discount });
}

export async function DELETE(_: Request, { params }: { params: { discountId: string } }) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.discount.delete({ where: { id: params.discountId } });
  return NextResponse.json({ status: "ok" });
}
