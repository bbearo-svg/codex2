import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { renderOrderConfirmationEmail } from "@/emails/order-confirmation";
import { sendOrderConfirmationEmail } from "@/lib/email";
import type { OrderWithRelations } from "@/lib/invoice";

export async function PATCH(request: Request, { params }: { params: { orderId: string } }) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const payload = await request.json();
  if (payload.status) {
    const order = await prisma.order.update({ where: { id: params.orderId }, data: { status: payload.status } });
    return NextResponse.json({ order });
  }

  if (payload.action === "refund") {
    const order = await prisma.order.findUnique({ where: { id: params.orderId } });
    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

    if (order.status === "REFUNDED") {
      return NextResponse.json({ order });
    }

    if (order.stripePaymentIntentId) {
      await stripe.refunds.create({ payment_intent: order.stripePaymentIntentId });
    }

    const updated = await prisma.order.update({ where: { id: order.id }, data: { status: "REFUNDED" } });
    return NextResponse.json({ order: updated });
  }

  if (payload.action === "resend_invoice") {
    const order = await prisma.order.findUnique({
      where: { id: params.orderId },
      include: { user: true, items: { include: { options: true } } },
    });
    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
    if (!order.user?.email) return NextResponse.json({ error: "No customer email" }, { status: 400 });

    const html = renderOrderConfirmationEmail(order as OrderWithRelations);
    await sendOrderConfirmationEmail({
      to: order.user.email,
      subject: `Order ${order.number} invoice`,
      html,
      invoicePath: order.invoiceUrl ?? undefined,
    });

    return NextResponse.json({ status: "sent" });
  }

  return NextResponse.json({ error: "Unsupported action" }, { status: 400 });
}
