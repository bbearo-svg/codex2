import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/prisma";
import fs from "fs";

export async function GET(_: Request, { params }: { params: { orderId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const order = await prisma.order.findUnique({ where: { id: params.orderId } });
  if (!order || !order.invoiceUrl) {
    return new NextResponse("Not found", { status: 404 });
  }

  if (order.userId && order.userId !== session.user.id && session.user.role !== "ADMIN") {
    return new NextResponse("Forbidden", { status: 403 });
  }

  if (!fs.existsSync(order.invoiceUrl)) {
    return new NextResponse("Invoice not available", { status: 404 });
  }

  const file = fs.readFileSync(order.invoiceUrl);
  return new NextResponse(file, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename=${order.number}.pdf`,
    },
  });
}
