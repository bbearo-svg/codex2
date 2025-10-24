import { calculateCartTotals } from "@/lib/pricing";
import { validateDiscount } from "@/lib/discounts";
import { getStoreConfiguration } from "@/lib/settings";
import { prisma } from "@/lib/prisma";
import { enforceSchedulingRules } from "@/lib/scheduling";
import type { CartWithRelations } from "@/types/cart";
import { startOfDay, endOfDay } from "date-fns";

export async function validateCartForEvent(params: {
  cart: CartWithRelations;
  eventDate: Date;
}) {
  const config = await getStoreConfiguration();
  const blackoutDates = await prisma.blackoutDate.findMany({
    where: {
      date: {
        gte: startOfDay(params.eventDate),
        lte: endOfDay(params.eventDate),
      },
    },
  });

  for (const cartItem of params.cart.items) {
    const reservations = await prisma.capacityReservation.findMany({
      where: {
        categoryId: cartItem.item.categoryId,
        eventAt: {
          gte: startOfDay(params.eventDate),
          lte: endOfDay(params.eventDate),
        },
      },
    });

    enforceSchedulingRules({
      eventAt: params.eventDate.toISOString(),
      leadTimeDays: Math.max(cartItem.item.leadTimeDays, cartItem.item.category.leadTimeDays),
      blackoutDates: blackoutDates.map((entry) => entry.date),
      closedWeekdays: config.closedWeekdays,
      category: cartItem.item.category,
      reservations,
      quantity: cartItem.quantity,
    });
  }

  return config;
}

export async function computeCheckoutTotals(params: {
  cart: CartWithRelations;
  fulfillment: "DELIVERY" | "PICKUP";
  tip: number;
  promoCode?: string;
  configOverride?: Awaited<ReturnType<typeof getStoreConfiguration>>;
}) {
  const config = params.configOverride ?? (await getStoreConfiguration());
  const discount = params.promoCode
    ? await validateDiscount(
        params.promoCode,
        params.cart.items.reduce((sum, line) => sum + Number(line.total), 0)
      )
    : null;

  const totals = calculateCartTotals(
    params.cart.items.map((item) => ({
      basePrice: Number(item.unitPrice),
      quantity: item.quantity,
      options: item.options.map((option) => ({
        id: option.id,
        priceDelta: Number(option.priceDelta),
      })),
    })),
    {
      taxRate: config.taxRate,
      deliveryFee: params.fulfillment === "DELIVERY" ? config.deliveryFee : 0,
      tip: params.tip,
      discount: discount ? { type: discount.type, value: Number(discount.value) } : null,
    }
  );

  return { totals, discount, config };
}
