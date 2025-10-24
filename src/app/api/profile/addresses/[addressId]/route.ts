import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/prisma";

export async function DELETE(_: Request, { params }: { params: { addressId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await prisma.address.deleteMany({
    where: { id: params.addressId, userId: session.user.id },
  });

  return NextResponse.json({ status: "ok" });
}
