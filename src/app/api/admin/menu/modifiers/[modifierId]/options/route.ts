import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/prisma";
import { modifierOptionSchema } from "@/schemas/admin";
import { toDecimal } from "@/lib/pricing";

export async function POST(request: Request, { params }: { params: { modifierId: string } }) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const payload = await request.json();
  const parsed = modifierOptionSchema.safeParse({ ...payload, modifierId: params.modifierId });
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const option = await prisma.modifierOption.create({
    data: {
      ...parsed.data,
      priceDelta: toDecimal(parsed.data.priceDelta),
    },
  });

  return NextResponse.json({ option }, { status: 201 });
}
