import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { checkoutSchema } from "@/schemas/cart";
import { rateLimit } from "@/lib/rate-limit";
import { getCartById } from "@/lib/cart";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { computeCheckoutTotals, validateCartForEvent } from "@/lib/checkout";

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for") ?? "anonymous";
  if (!rateLimit(`checkout:${ip}`, 5, 60_000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const payload = await request.json();
  const parsed = checkoutSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const eventDate = new Date(parsed.data.eventAt);
  const cart = await getCartById(parsed.data.cartId);
  if (!cart || (cart.userId && cart.userId !== session.user.id)) {
    return NextResponse.json({ error: "Cart not found" }, { status: 404 });
  }
  if (!cart.items.length) {
    return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
  }

  const config = await validateCartForEvent({ cart, eventDate });

  const { totals, discount } = await computeCheckoutTotals({
    cart,
    fulfillment: parsed.data.fulfillment,
    tip: parsed.data.tip,
    promoCode: parsed.data.promoCode,
    configOverride: config,
  });

  const discountResponse = discount
    ? { code: discount.code, type: discount.type, value: Number(discount.value) }
    : null;

  const amount = Math.round(totals.total * 100);

  const shipping =
    parsed.data.fulfillment === "DELIVERY" && parsed.data.deliveryAddress
      ? {
          address: {
            line1: parsed.data.deliveryAddress.line1,
            line2: parsed.data.deliveryAddress.line2 ?? undefined,
            city: parsed.data.deliveryAddress.city,
            state: parsed.data.deliveryAddress.state,
            postal_code: parsed.data.deliveryAddress.zip,
            country: "US",
          },
        }
      : undefined;

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  let customerId = user?.stripeCustomerId ?? undefined;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user?.email ?? undefined,
      name: user?.name ?? undefined,
      phone: user?.phone ?? undefined,
    });
    customerId = customer.id;
    await prisma.user.update({ where: { id: session.user.id }, data: { stripeCustomerId: customerId } });
  }

  const paymentIntent = cart.stripePaymentIntentId
    ? await stripe.paymentIntents.update(cart.stripePaymentIntentId, {
        amount,
        currency: "usd",
        metadata: {
          cartId: cart.id,
          userId: session.user.id,
          fulfillment: parsed.data.fulfillment,
          promoCode: parsed.data.promoCode ?? "",
        },
        setup_future_usage: parsed.data.savePaymentMethod ? "off_session" : null,
        shipping,
      })
    : await stripe.paymentIntents.create({
        amount,
        currency: "usd",
        customer: customerId,
        automatic_payment_methods: { enabled: true },
        metadata: {
          cartId: cart.id,
          userId: session.user.id,
          fulfillment: parsed.data.fulfillment,
          promoCode: parsed.data.promoCode ?? "",
        },
        setup_future_usage: parsed.data.savePaymentMethod ? "off_session" : undefined,
        shipping,
      });

  await prisma.cart.update({
    where: { id: cart.id },
    data: {
      stripePaymentIntentId: paymentIntent.id,
      updatedAt: new Date(),
    },
  });

  return NextResponse.json({
    clientSecret: paymentIntent.client_secret,
    totals,
    cartId: cart.id,
    eventAt,
    discount: discountResponse,
  });
}
