import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import AdminDashboard from "@/components/admin/admin-dashboard";

export default async function AdminPage() {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") {
    redirect("/");
  }

  const [ordersToday, revenueToday, topItems, categories, items, orders, customers, discounts] = await Promise.all([
    prisma.order.count({ where: { createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } } }),
    prisma.order.aggregate({ _sum: { total: true }, where: { createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } } }),
    prisma.orderItem.groupBy({ by: ["itemId", "nameSnapshot"], _sum: { quantity: true }, orderBy: { _sum: { quantity: "desc" } }, take: 5 }),
    prisma.category.findMany({ orderBy: { sort: "asc" } }),
    prisma.item.findMany({ include: { category: true, modifiers: { include: { options: true } } }, orderBy: { name: "asc" } }),
    prisma.order.findMany({ orderBy: { createdAt: "desc" }, include: { user: true }, take: 20 }),
    prisma.user.findMany({ where: { role: "CUSTOMER" }, include: { orders: true } }),
    prisma.discount.findMany({ orderBy: { code: "asc" } }),
  ]);

  const kpis = {
    ordersToday,
    revenueToday: Number(revenueToday._sum.total ?? 0),
    topItems,
  };

  const customerSummaries = customers.map((customer) => ({
    id: customer.id,
    name: customer.name,
    email: customer.email,
    orders: customer.orders.length,
    ltv: customer.orders.reduce((sum, order) => sum + Number(order.total), 0),
  }));

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-10">
      <AdminDashboard
        kpis={kpis}
        categories={categories}
        items={items}
        orders={orders}
        customers={customerSummaries}
        discounts={discounts}
      />
    </div>
  );
}
