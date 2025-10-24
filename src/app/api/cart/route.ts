import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { getOrCreateCart, upsertCartItem, computeCartTotals } from "@/lib/cart";
import { cartItemSchema } from "@/schemas/cart";
import { rateLimit } from "@/lib/rate-limit";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  const cart = await getOrCreateCart(session?.user?.id ?? null);
  const totals = await computeCartTotals(cart.id, Number(process.env.DEFAULT_TAX_RATE ?? 0.09), Number(process.env.DELIVERY_FEE ?? 25));
  return NextResponse.json(totals);
}

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for") ?? "anonymous";
  if (!rateLimit(`cart:${ip}`, 20)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const session = await getServerSession(authOptions);
  const cart = await getOrCreateCart(session?.user?.id ?? null);

  const payload = await request.json();
  const parsed = cartItemSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  let cartItem;
  try {
    cartItem = await upsertCartItem({
      cartId: cart.id,
      itemId: parsed.data.itemId,
      quantity: parsed.data.quantity,
      notes: parsed.data.notes,
      optionIds: parsed.data.options.map((option) => option.modifierOptionId),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to update cart" },
      { status: 400 }
    );
  }

  const totals = await computeCartTotals(cart.id, Number(process.env.DEFAULT_TAX_RATE ?? 0.09), Number(process.env.DELIVERY_FEE ?? 25));

  return NextResponse.json({ cartItem, totals: totals.totals });
}
