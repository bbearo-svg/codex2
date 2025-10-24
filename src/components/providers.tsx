"use client";

import { ReactNode } from "react";
import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";
import { CartProvider } from "@/components/cart/cart-context";
import dynamic from "next/dynamic";

const CartDrawer = dynamic(() => import("@/components/cart/cart-drawer"), { ssr: false });

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider attribute="class" enableSystem disableTransitionOnChange>
        <CartProvider>
          {children}
          <CartDrawer />
        </CartProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}
