"use client";

import { ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/components/cart/cart-context";

export default function CartTrigger() {
  const { toggleCart, cart } = useCart();

  return (
    <Button variant="ghost" onClick={() => toggleCart(true)} className="relative">
      <ShoppingBag className="mr-2 h-4 w-4" />
      Cart
      {cart && cart.items.length > 0 ? (
        <span className="ml-2 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-brand px-1 text-xs text-brand-foreground">
          {cart.items.length}
        </span>
      ) : null}
    </Button>
  );
}
