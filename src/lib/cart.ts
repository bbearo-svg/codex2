import { prisma } from "@/lib/prisma";
import { calculateCartTotals, calculateLineTotal, toDecimal } from "@/lib/pricing";
import { FulfillmentType, OrderStatus } from "@prisma/client";

export async function getOrCreateCart(userId: string | null) {
  if (userId) {
    const existing = await prisma.cart.findFirst({
      where: { userId },
      include: {
        items: { include: { options: { include: { modifierOption: true } }, item: { include: { category: true } } } },
      },
    });
    if (existing) return existing;
  }

  return prisma.cart.create({
    data: {
      userId: userId ?? undefined,
    },
    include: {
      items: { include: { options: { include: { modifierOption: true } }, item: { include: { category: true } } } },
    },
  });
}

export async function getCartById(cartId: string) {
  return prisma.cart.findUnique({
    where: { id: cartId },
    include: {
      items: { include: { options: { include: { modifierOption: true } }, item: { include: { category: true } } } },
    },
  });
}

export async function upsertCartItem(params: {
  cartId: string;
  itemId: string;
  quantity: number;
  notes?: string;
  optionIds: string[];
}) {
  const item = await prisma.item.findUnique({
    where: { id: params.itemId },
    include: {
      modifiers: {
        include: { options: true },
      },
      category: true,
    },
  });
  if (!item || !item.isActive) {
    throw new Error("Item is unavailable");
  }

  const options = item.modifiers.flatMap((modifier) =>
    modifier.options.filter((option) => params.optionIds.includes(option.id))
  );

  if (new Set(params.optionIds).size !== params.optionIds.length) {
    throw new Error("Duplicate modifier options are not allowed.");
  }

  if (params.optionIds.length !== options.length) {
    throw new Error("Invalid modifier option selection.");
  }

  for (const modifier of item.modifiers) {
    const count = options.filter((option) => option.modifierId === modifier.id).length;
    if (count < modifier.min) {
      throw new Error(`Select at least ${modifier.min} option${modifier.min === 1 ? "" : "s"} for ${modifier.name}.`);
    }
    if (count > modifier.max) {
      throw new Error(`Select no more than ${modifier.max} option${modifier.max === 1 ? "" : "s"} for ${modifier.name}.`);
    }
  }

  const lineTotal = calculateLineTotal({
    basePrice: Number(item.basePrice),
    quantity: params.quantity,
    options: options.map((option) => ({
      id: option.id,
      priceDelta: Number(option.priceDelta),
    })),
  });

  const cartItem = await prisma.cartItem.upsert({
    where: {
      cartId_itemId: {
        cartId: params.cartId,
        itemId: params.itemId,
      },
    },
    update: {
      quantity: params.quantity,
      notes: params.notes,
      unitPrice: toDecimal(Number(item.basePrice)),
      total: toDecimal(lineTotal),
      options: {
        deleteMany: {},
        create: options.map((option) => ({
          modifierOptionId: option.id,
          priceDelta: toDecimal(Number(option.priceDelta)),
        })),
      },
    },
    create: {
      cartId: params.cartId,
      itemId: params.itemId,
      quantity: params.quantity,
      notes: params.notes,
      unitPrice: toDecimal(Number(item.basePrice)),
      total: toDecimal(lineTotal),
      options: {
        create: options.map((option) => ({
          modifierOptionId: option.id,
          priceDelta: toDecimal(Number(option.priceDelta)),
        })),
      },
    },
    include: {
      options: { include: { modifierOption: true } },
      item: { include: { category: true } },
    },
  });

  return cartItem;
}

export async function deleteCartItem(cartItemId: string, userId?: string) {
  if (userId) {
    const item = await prisma.cartItem.findUnique({
      where: { id: cartItemId },
      include: { cart: true },
    });
    if (!item || (item.cart.userId && item.cart.userId !== userId)) {
      throw new Error("Unauthorized");
    }
  }

  await prisma.cartItem.delete({ where: { id: cartItemId } });
}

export async function emptyCart(cartId: string) {
  await prisma.cartItem.deleteMany({ where: { cartId } });
}

export async function computeCartTotals(cartId: string, taxRate: number, deliveryFee: number) {
  const cart = await prisma.cart.findUnique({
    where: { id: cartId },
    include: {
      items: { include: { options: { include: { modifierOption: true } }, item: { include: { category: true } } } },
    },
  });

  if (!cart) throw new Error("Cart not found");

  const totals = calculateCartTotals(
    cart.items.map((item) => ({
      basePrice: Number(item.unitPrice),
      quantity: item.quantity,
      options: item.options.map((option) => ({
        id: option.modifierOptionId,
        priceDelta: Number(option.priceDelta),
      })),
    })),
    {
      taxRate,
      deliveryFee,
      tip: 0,
      discount: null,
    }
  );

  return { cart, totals };
}

export async function persistOrderFromCart(params: {
  cartId: string;
  userId: string;
  subtotal: number;
  tax: number;
  deliveryFee: number;
  discountTotal: number;
  tip: number;
  total: number;
  fulfillment: FulfillmentType;
  eventAt: Date;
  notes?: string;
  stripePaymentIntentId: string;
  invoiceUrl?: string | null;
  discountCode?: string | null;
  status: OrderStatus;
  deliveryAddress?: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    zip: string;
  };
}) {
  const cart = await prisma.cart.findUnique({
    where: { id: params.cartId },
    include: {
      items: { include: { options: { include: { modifierOption: true } }, item: { include: { category: true } } } },
    },
  });

  if (!cart) throw new Error("Cart not found");

  const order = await prisma.order.create({
    data: {
      userId: params.userId,
      number: `ORD-${Date.now()}`,
      status: params.status,
      subtotal: toDecimal(params.subtotal),
      tax: toDecimal(params.tax),
      deliveryFee: toDecimal(params.deliveryFee),
      discountTotal: toDecimal(params.discountTotal),
      tip: toDecimal(params.tip),
      total: toDecimal(params.total),
      fulfillment: params.fulfillment,
      eventAt: params.eventAt,
      notes: params.notes,
      stripePaymentIntentId: params.stripePaymentIntentId,
      invoiceUrl: params.invoiceUrl ?? undefined,
      discountCode: params.discountCode ?? undefined,
      deliveryLine1: params.deliveryAddress?.line1,
      deliveryLine2: params.deliveryAddress?.line2,
      deliveryCity: params.deliveryAddress?.city,
      deliveryState: params.deliveryAddress?.state,
      deliveryZip: params.deliveryAddress?.zip,
      items: {
        create: cart.items.map((item) => ({
          itemId: item.itemId,
          nameSnapshot: item.item.name,
          quantity: item.quantity,
          unitPrice: toDecimal(Number(item.unitPrice)),
          total: toDecimal(Number(item.total)),
          options: {
            create: item.options.map((option) => ({
              nameSnapshot: option.modifierOption.name,
              priceDelta: toDecimal(Number(option.priceDelta)),
            })),
          },
        })),
      },
    },
  });

  await prisma.capacityReservation.createMany({
    data: cart.items.map((item) => ({
      categoryId: item.item.categoryId,
      eventAt: params.eventAt,
      quantity: item.quantity,
      orderId: order.id,
    })),
  });

  await emptyCart(cart.id);

  return order;
}
