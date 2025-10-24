import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { currencyFormatter, formatDateTime } from "@/lib/utils";

export default async function OrdersPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/auth/login?callbackUrl=/dashboard/orders");
  }

  const orders = await prisma.order.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: { items: { include: { options: true } } },
  });

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-10">
      <div>
        <h1 className="text-3xl font-semibold text-slate-900">Your orders</h1>
        <p className="mt-2 text-sm text-slate-600">Track upcoming events and download invoices.</p>
      </div>
      {orders.length === 0 ? (
        <p className="text-sm text-slate-600">You haven&apos;t placed any orders yet.</p>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <article key={order.id} className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Order {order.number}</h2>
                  <p className="text-xs text-slate-500">
                    Placed {formatDateTime(order.createdAt)} • Event {formatDateTime(order.eventAt)}
                  </p>
                  {order.fulfillment === "DELIVERY" && order.deliveryLine1 ? (
                    <p className="mt-1 text-xs text-slate-500">
                      Deliver to: {order.deliveryLine1}
                      {order.deliveryLine2 ? `, ${order.deliveryLine2}` : ""}, {order.deliveryCity}, {order.deliveryState} {order.deliveryZip}
                    </p>
                  ) : (
                    <p className="mt-1 text-xs text-slate-500">Pickup at our kitchen</p>
                  )}
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600">
                  {order.status}
                </span>
              </div>
              <ul className="mt-4 space-y-2 text-sm">
                {order.items.map((item) => (
                  <li key={item.id}>
                    <div className="flex justify-between">
                      <span>{item.nameSnapshot}</span>
                      <span>{currencyFormatter.format(Number(item.total))}</span>
                    </div>
                    {item.options.length ? (
                      <ul className="text-xs text-slate-500">
                        {item.options.map((option) => (
                          <li key={option.id}>{option.nameSnapshot}</li>
                        ))}
                      </ul>
                    ) : null}
                  </li>
                ))}
              </ul>
              <div className="mt-4 flex flex-col gap-2 text-sm sm:flex-row sm:items-center sm:justify-between">
                <div className="font-semibold">Total {currencyFormatter.format(Number(order.total))}</div>
                {order.invoiceUrl ? (
                  <a href={`/api/orders/${order.id}/invoice`} className="text-brand hover:underline">
                    Download invoice
                  </a>
                ) : (
                  <span className="text-xs text-slate-500">Invoice processing...</span>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
