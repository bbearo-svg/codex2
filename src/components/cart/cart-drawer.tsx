"use client";

import { X } from "lucide-react";
import { useCart } from "@/components/cart/cart-context";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { currencyFormatter } from "@/lib/utils";

export default function CartDrawer() {
  const { cart, isOpen, toggleCart, removeItem, totals } = useCart();

  return (
    <aside
      className={`fixed inset-y-0 right-0 z-50 w-full max-w-md transform bg-white shadow-xl transition-transform duration-300 ${
        isOpen ? "translate-x-0" : "translate-x-full"
      }`}
      role="dialog"
      aria-modal="true"
    >
      <div className="flex items-center justify-between border-b border-slate-200 p-4">
        <h2 className="text-lg font-semibold">Your cart</h2>
        <button onClick={() => toggleCart(false)} aria-label="Close cart">
          <X className="h-5 w-5" />
        </button>
      </div>
      <div className="flex h-full flex-col">
        <div className="flex-1 overflow-y-auto p-4">
          {!cart || cart.items.length === 0 ? (
            <p className="text-sm text-slate-500">Your cart is empty.</p>
          ) : (
            <ul className="space-y-4">
              {cart.items.map((item) => (
                <li key={item.id} className="rounded border border-slate-200 p-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-sm font-semibold">{item.item.name}</h3>
                      <p className="text-xs text-slate-500">Qty: {item.quantity}</p>
                      {item.options.length > 0 ? (
                        <ul className="mt-2 space-y-1 text-xs text-slate-500">
                          {item.options.map((option) => (
                            <li key={option.id}>
                              {option.modifierOption.name} ({currencyFormatter.format(Number(option.priceDelta))})
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </div>
                    <div className="text-right text-sm font-medium">
                      {currencyFormatter.format(Number(item.total))}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    className="mt-2 h-auto px-0 text-xs text-red-600"
                    onClick={() => removeItem(item.id)}
                  >
                    Remove
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="border-t border-slate-200 p-4 text-sm">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>{totals?.subtotal ?? "$0.00"}</span>
          </div>
          <div className="flex justify-between font-semibold">
            <span>Total (est.)</span>
            <span>{totals?.total ?? "$0.00"}</span>
          </div>
          <Button asChild className="mt-4 w-full" disabled={!cart || cart.items.length === 0}>
            <Link href="/checkout" onClick={() => toggleCart(false)}>
              Proceed to checkout
            </Link>
          </Button>
        </div>
      </div>
    </aside>
  );
}
