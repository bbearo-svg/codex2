import { Prisma, DiscountType, type ModifierOption } from "@prisma/client";

export interface PricingItemInput {
  basePrice: number;
  quantity: number;
  options?: Array<Pick<ModifierOption, "priceDelta" | "id">>;
}

export interface PricingContext {
  taxRate: number;
  deliveryFee: number;
  discount?: {
    type: DiscountType;
    value: number;
  } | null;
  tip?: number;
}

export interface PricingResult {
  subtotal: number;
  discountTotal: number;
  tax: number;
  deliveryFee: number;
  tip: number;
  total: number;
}

export function calculateLineTotal(input: PricingItemInput): number {
  const optionTotal = input.options?.reduce((acc, option) => acc + Number(option.priceDelta), 0) ?? 0;
  const unitPrice = input.basePrice + optionTotal;
  return roundCurrency(unitPrice * input.quantity);
}

export function calculateCartTotals(items: PricingItemInput[], context: PricingContext): PricingResult {
  const subtotal = roundCurrency(
    items.reduce((acc, item) => acc + calculateLineTotal(item), 0)
  );

  let discountTotal = 0;
  if (context.discount) {
    if (context.discount.type === DiscountType.PERCENT) {
      discountTotal = roundCurrency(subtotal * (context.discount.value / 100));
    } else {
      discountTotal = roundCurrency(context.discount.value);
    }
    discountTotal = Math.min(discountTotal, subtotal);
  }

  const taxable = subtotal - discountTotal;
  const tax = roundCurrency(taxable * context.taxRate);
  const deliveryFee = roundCurrency(context.deliveryFee);
  const tip = roundCurrency(context.tip ?? 0);

  const total = roundCurrency(taxable + tax + deliveryFee + tip);

  return {
    subtotal,
    discountTotal,
    tax,
    deliveryFee,
    tip,
    total,
  };
}

export function roundCurrency(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function toDecimal(value: number) {
  return new Prisma.Decimal(value.toFixed(2));
}
