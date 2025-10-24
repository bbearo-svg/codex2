"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { CartWithRelations } from "@/types/cart";
import { currencyFormatter } from "@/lib/utils";

interface CartContextValue {
  cart: CartWithRelations | null;
  isOpen: boolean;
  toggleCart: (open?: boolean) => void;
  addItem: (payload: {
    itemId: string;
    quantity: number;
    optionIds: string[];
    notes?: string;
  }) => Promise<void>;
  removeItem: (cartItemId: string) => Promise<void>;
  totals: {
    subtotal: string;
    total: string;
  } | null;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartWithRelations | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [totals, setTotals] = useState<CartContextValue["totals"]>(null);

  useEffect(() => {
    void fetchCart();
  }, []);

  async function fetchCart() {
    const response = await fetch("/api/cart");
    if (!response.ok) return;
    const data = await response.json();
    setCart(data.cart);
    setTotals({
      subtotal: currencyFormatter.format(data.totals.subtotal),
      total: currencyFormatter.format(data.totals.total),
    });
  }

  async function addItem(payload: {
    itemId: string;
    quantity: number;
    optionIds: string[];
    notes?: string;
  }) {
    const response = await fetch("/api/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const body = await response.json().catch(() => null);
      throw new Error(body?.error ?? "Unable to add item to cart");
    }
    await fetchCart();
    setIsOpen(true);
  }

  async function removeItem(cartItemId: string) {
    const response = await fetch(`/api/cart/${cartItemId}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      const body = await response.json().catch(() => null);
      throw new Error(body?.error ?? "Unable to remove item");
    }
    await fetchCart();
  }

  const value: CartContextValue = {
    cart,
    isOpen,
    toggleCart: (open) => setIsOpen(open ?? !isOpen),
    addItem,
    removeItem,
    totals,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
