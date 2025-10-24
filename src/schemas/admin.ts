import { z } from "zod";

export const categorySchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  sort: z.number().int().min(0).default(0),
  leadTimeDays: z.number().int().min(0).default(2),
  dailyCapacity: z.number().int().min(0).optional(),
});

export const itemSchema = z.object({
  categoryId: z.string().cuid(),
  name: z.string().min(2),
  description: z.string().optional(),
  basePrice: z.number().min(0),
  isActive: z.boolean().default(true),
  imageUrl: z.string().url().optional(),
  leadTimeDays: z.number().int().min(0).default(2),
});

export const modifierSchema = z.object({
  itemId: z.string().cuid(),
  name: z.string().min(2),
  min: z.number().int().min(0),
  max: z.number().int().min(1),
  sort: z.number().int().min(0).default(0),
});

export const modifierOptionSchema = z.object({
  modifierId: z.string().cuid(),
  name: z.string().min(2),
  priceDelta: z.number(),
  sort: z.number().int().min(0).default(0),
  isDefault: z.boolean().default(false),
});

export const discountSchema = z.object({
  code: z.string().min(3).max(32),
  type: z.enum(["PERCENT", "FIXED"]),
  value: z.number().min(0),
  startsAt: z.string().optional(),
  endsAt: z.string().optional(),
  minSubtotal: z.number().min(0).optional(),
  active: z.boolean().default(true),
});
