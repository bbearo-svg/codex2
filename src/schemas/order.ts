import { z } from "zod";
import { addressSchema } from "@/schemas/cart";

export const orderCreateSchema = z.object({
  cartId: z.string().cuid(),
  paymentIntentId: z.string(),
  fulfillment: z.enum(["DELIVERY", "PICKUP"]),
  eventAt: z.string(),
  tip: z.number().min(0).max(1000),
  notes: z.string().max(500).optional(),
  promoCode: z.string().optional(),
  deliveryAddress: addressSchema.omit({ isDefault: true }).optional(),
});

export type OrderCreateInput = z.infer<typeof orderCreateSchema>;
