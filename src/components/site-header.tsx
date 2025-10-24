"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import dynamic from "next/dynamic";

const CartTrigger = dynamic(() => import("@/components/cart/cart-trigger"), { ssr: false });
import { useSession, signOut } from "next-auth/react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/menu", label: "Menu" },
  { href: "/dashboard/profile", label: "Account" },
  { href: "/dashboard/orders", label: "Orders" },
  { href: "/dashboard/admin", label: "Admin" },
];

export default function SiteHeader() {
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link href="/" className="text-xl font-semibold text-brand" aria-label="Green Leaf Catering">
          Green Leaf Catering
        </Link>
        <nav aria-label="Main navigation" className="hidden items-center gap-6 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "text-sm font-medium text-slate-700 transition-colors hover:text-brand",
                pathname?.startsWith(item.href) && "text-brand"
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <CartTrigger />
          {session?.user ? (
            <Button variant="outline" onClick={() => signOut()}>
              Sign out
            </Button>
          ) : (
            <Button asChild>
              <Link href="/auth/login">Sign in</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
