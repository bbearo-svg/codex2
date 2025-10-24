import { prisma } from "@/lib/prisma";
import { discountCodeSchema } from "@/schemas/cart";
import { DiscountType } from "@prisma/client";

export async function validateDiscount(code: string, subtotal: number) {
  const parsed = discountCodeSchema.safeParse({ code });
  if (!parsed.success) return null;

  const discount = await prisma.discount.findFirst({
    where: {
      code: parsed.data.code,
      active: true,
      OR: [
        { startsAt: null },
        { startsAt: { lte: new Date() } },
      ],
      AND: [
        { endsAt: null },
        { endsAt: { gte: new Date() } },
      ],
    },
  });

  if (!discount) return null;

  if (discount.minSubtotal && subtotal < Number(discount.minSubtotal)) {
    return null;
  }

  return discount;
}

export function applyDiscount(subtotal: number, discount?: { type: DiscountType; value: number } | null) {
  if (!discount) return { discountTotal: 0, discountedSubtotal: subtotal };

  if (discount.type === DiscountType.PERCENT) {
    const discountTotal = subtotal * (discount.value / 100);
    return { discountTotal, discountedSubtotal: subtotal - discountTotal };
  }

  return { discountTotal: discount.value, discountedSubtotal: Math.max(0, subtotal - discount.value) };
}
