import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const categories = await prisma.category.findMany({
    orderBy: { sort: "asc" },
    include: {
      items: {
        orderBy: { name: "asc" },
        where: { isActive: true },
        include: {
          modifiers: {
            orderBy: { sort: "asc" },
            include: { options: { orderBy: { sort: "asc" } } },
          },
        },
      },
    },
  });

  return NextResponse.json({ categories });
}
