import { z } from "zod";

export const cartItemOptionSchema = z.object({
  modifierOptionId: z.string().cuid(),
  priceDelta: z.number().nonnegative(),
});

export const cartItemSchema = z.object({
  itemId: z.string().cuid(),
  quantity: z.number().int().positive().max(100),
  notes: z.string().max(200).optional(),
  options: z.array(cartItemOptionSchema),
});

export type CartItemInput = z.infer<typeof cartItemSchema>;

export const discountCodeSchema = z.object({
  code: z.string().trim().toUpperCase().min(3).max(32),
});

export const checkoutSchema = z.object({
  cartId: z.string().cuid(),
  fulfillment: z.enum(["DELIVERY", "PICKUP"]),
  eventAt: z.string(),
  addressId: z.string().cuid().optional(),
  deliveryAddress: z
    .object({
      line1: z.string().min(3),
      line2: z.string().optional(),
      city: z.string().min(2),
      state: z.string().min(2).max(2),
      zip: z.string().min(5).max(10),
    })
    .optional(),
  tip: z.number().min(0).max(1000).default(0),
  notes: z.string().max(500).optional(),
  promoCode: z.string().max(32).optional(),
  savePaymentMethod: z.boolean().default(false),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;

export const addressSchema = z.object({
  line1: z.string().min(3),
  line2: z.string().optional(),
  city: z.string().min(2),
  state: z.string().min(2).max(2),
  zip: z.string().min(5).max(10),
  isDefault: z.boolean().optional(),
});
