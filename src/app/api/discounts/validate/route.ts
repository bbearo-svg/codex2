import { NextResponse } from "next/server";
import { validateDiscount } from "@/lib/discounts";
import { discountCodeSchema } from "@/schemas/cart";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for") ?? "anonymous";
  if (!rateLimit(`discount:${ip}`, 30)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const payload = await request.json();
  const parsed = discountCodeSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const discount = await validateDiscount(parsed.data.code, Number(payload.subtotal ?? 0));

  if (!discount) {
    return NextResponse.json({ valid: false }, { status: 404 });
  }

  return NextResponse.json({
    valid: true,
    discount,
  });
}
