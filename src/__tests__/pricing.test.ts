import { calculateCartTotals, calculateLineTotal, roundCurrency } from "@/lib/pricing";
import { DiscountType } from "@prisma/client";

describe("pricing engine", () => {
  it("calculates line total with modifiers", () => {
    const total = calculateLineTotal({
      basePrice: 12,
      quantity: 3,
      options: [
        { id: "1", priceDelta: 2 } as any,
        { id: "2", priceDelta: 1.5 } as any,
      ],
    });

    expect(total).toBe(46.5);
  });

  it("applies discounts and tax", () => {
    const result = calculateCartTotals(
      [
        { basePrice: 10, quantity: 2 },
        { basePrice: 20, quantity: 1 },
      ],
      {
        taxRate: 0.1,
        deliveryFee: 15,
        tip: 5,
        discount: {
          type: DiscountType.PERCENT,
          value: 10,
        },
      }
    );

    expect(result.subtotal).toBe(40);
    expect(result.discountTotal).toBe(4);
    expect(result.tax).toBe(3.6);
    expect(result.total).toBe(59.6);
  });

  it("rounds currency properly", () => {
    expect(roundCurrency(12.345)).toBe(12.35);
  });
});
