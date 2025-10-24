import { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import MenuGrid from "@/components/menu/menu-grid";
import SearchFilters from "@/components/menu/search-filters";

export const metadata: Metadata = {
  title: "Menu | Green Leaf Catering",
};

export default async function MenuPage({ searchParams }: { searchParams: { q?: string } }) {
  const search = searchParams.q?.toLowerCase();
  const categories = await prisma.category.findMany({
    orderBy: { sort: "asc" },
    include: {
      items: {
        where: {
          isActive: true,
          ...(search
            ? {
                OR: [
                  { name: { contains: search, mode: "insensitive" } },
                  { description: { contains: search, mode: "insensitive" } },
                ],
              }
            : {}),
        },
        orderBy: { name: "asc" },
        include: {
          modifiers: {
            orderBy: { sort: "asc" },
            include: {
              options: {
                orderBy: { sort: "asc" },
              },
            },
          },
        },
      },
    },
  });

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-10">
      <SearchFilters />
      <MenuGrid categories={categories} />
    </div>
  );
}
