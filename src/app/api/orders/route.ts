import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/prisma";
import { orderCreateSchema } from "@/schemas/order";
import { rateLimit } from "@/lib/rate-limit";
import { getCartById, persistOrderFromCart } from "@/lib/cart";
import { computeCheckoutTotals, validateCartForEvent } from "@/lib/checkout";
import { stripe } from "@/lib/stripe";
import { generateInvoicePdf, type OrderWithRelations } from "@/lib/invoice";
import { renderOrderConfirmationEmail } from "@/emails/order-confirmation";
import { sendOrderConfirmationEmail } from "@/lib/email";
import { OrderStatus } from "@prisma/client";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const status = url.searchParams.get("status") ?? undefined;
  const where = session.user.role === "ADMIN"
    ? status
      ? { status }
      : {}
    : { userId: session.user.id, ...(status ? { status } : {}) };

  const orders = await prisma.order.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      items: { include: { options: true } },
    },
  });

  return NextResponse.json({ orders });
}

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for") ?? "anonymous";
  if (!rateLimit(`orders:${ip}`, 5, 60_000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = await request.json();
  const parsed = orderCreateSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const cart = await getCartById(parsed.data.cartId);
  if (!cart || (cart.userId && cart.userId !== session.user.id)) {
    return NextResponse.json({ error: "Cart not found" }, { status: 404 });
  }

  if (!cart.items.length) {
    return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
  }

  const paymentIntent = await stripe.paymentIntents.retrieve(parsed.data.paymentIntentId);
  if (paymentIntent.metadata.cartId !== cart.id) {
    return NextResponse.json({ error: "Payment mismatch" }, { status: 400 });
  }

  const currency = paymentIntent.currency?.toLowerCase();
  if (currency && currency !== "usd") {
    return NextResponse.json({ error: "Unsupported currency" }, { status: 400 });
  }

  const eventAt = new Date(parsed.data.eventAt);
  if (parsed.data.fulfillment === "DELIVERY" && !parsed.data.deliveryAddress) {
    return NextResponse.json({ error: "Delivery address required" }, { status: 400 });
  }

  let orderStatus: OrderStatus;
  switch (paymentIntent.status) {
    case "succeeded":
      orderStatus = OrderStatus.PAID;
      break;
    case "requires_capture":
      orderStatus = OrderStatus.PAID;
      break;
    case "processing":
      orderStatus = OrderStatus.PENDING;
      break;
    default:
      return NextResponse.json({ error: "Payment not completed" }, { status: 400 });
  }

  const config = await validateCartForEvent({ cart, eventDate: eventAt });
  const { totals, discount } = await computeCheckoutTotals({
    cart,
    fulfillment: parsed.data.fulfillment,
    tip: parsed.data.tip,
    promoCode: parsed.data.promoCode,
    configOverride: config,
  });

  if (Math.round(totals.total * 100) !== paymentIntent.amount) {
    return NextResponse.json(
      { error: "Order total has changed. Please refresh and try again." },
      { status: 409 }
    );
  }

  const deliveryAddress =
    parsed.data.fulfillment === "DELIVERY" && parsed.data.deliveryAddress
      ? {
          line1: parsed.data.deliveryAddress.line1,
          line2: parsed.data.deliveryAddress.line2 ?? undefined,
          city: parsed.data.deliveryAddress.city,
          state: parsed.data.deliveryAddress.state,
          zip: parsed.data.deliveryAddress.zip,
        }
      : undefined;

  const order = await persistOrderFromCart({
    cartId: cart.id,
    userId: session.user.id,
    subtotal: totals.subtotal,
    tax: totals.tax,
    deliveryFee: totals.deliveryFee,
    discountTotal: totals.discountTotal,
    tip: totals.tip,
    total: totals.total,
    fulfillment: parsed.data.fulfillment,
    eventAt,
    notes: parsed.data.notes,
    stripePaymentIntentId: paymentIntent.id,
    discountCode: discount?.code ?? null,
    status: orderStatus,
    deliveryAddress,
  });

  const orderWithRelations = (await prisma.order.findUnique({
    where: { id: order.id },
    include: { items: { include: { options: true } } },
  })) as OrderWithRelations | null;

  if (!orderWithRelations) {
    return NextResponse.json({ error: "Order not found after creation" }, { status: 500 });
  }

  const invoicePath = await generateInvoicePdf(orderWithRelations);
  await prisma.order.update({ where: { id: order.id }, data: { invoiceUrl: invoicePath } });

  const html = renderOrderConfirmationEmail(orderWithRelations);
  if (session.user.email) {
    await sendOrderConfirmationEmail({
      to: session.user.email,
      subject: `Order ${order.number} confirmed`,
      html,
      invoicePath,
    });
  }

  const adminEmails = (process.env.ADMIN_EMAILS ?? "").split(",").map((email) => email.trim()).filter(Boolean);
  await Promise.all(
    adminEmails.map((email) =>
      sendOrderConfirmationEmail({
        to: email,
        subject: `New catering order ${order.number}`,
        html,
        invoicePath,
      })
    )
  );

  return NextResponse.json({ order: { ...orderWithRelations, invoiceUrl: invoicePath } });
}
