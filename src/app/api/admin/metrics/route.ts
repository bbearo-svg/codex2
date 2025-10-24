import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/prisma";
import { startOfDay } from "date-fns";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const today = startOfDay(new Date());
  const ordersToday = await prisma.order.findMany({ where: { createdAt: { gte: today } } });
  const revenueToday = ordersToday.reduce((sum, order) => sum + Number(order.total), 0);
  const topItems = await prisma.orderItem.groupBy({
    by: ["itemId", "nameSnapshot"],
    _sum: { quantity: true },
    orderBy: { _sum: { quantity: "desc" } },
    take: 5,
  });

  return NextResponse.json({
    ordersToday: ordersToday.length,
    revenueToday,
    topItems,
  });
}
