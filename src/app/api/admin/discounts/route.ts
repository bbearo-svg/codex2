import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/prisma";
import { discountSchema } from "@/schemas/admin";
import { toDecimal } from "@/lib/pricing";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const discounts = await prisma.discount.findMany({ orderBy: { code: "asc" } });
  return NextResponse.json({ discounts });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const payload = await request.json();
  const parsed = discountSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const discount = await prisma.discount.create({
    data: {
      ...parsed.data,
      value: toDecimal(parsed.data.value),
      minSubtotal: parsed.data.minSubtotal ? toDecimal(parsed.data.minSubtotal) : undefined,
      startsAt: parsed.data.startsAt ? new Date(parsed.data.startsAt) : undefined,
      endsAt: parsed.data.endsAt ? new Date(parsed.data.endsAt) : undefined,
    },
  });

  return NextResponse.json({ discount }, { status: 201 });
}
