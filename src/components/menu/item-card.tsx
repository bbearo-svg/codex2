"use client";

import Image from "next/image";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import ItemDetailDialog from "@/components/menu/item-detail-dialog";
import { currencyFormatter } from "@/lib/utils";
import type { CategoryWithItems } from "@/components/menu/menu-grid";

interface ItemCardProps {
  item: CategoryWithItems["items"][number];
  category: CategoryWithItems;
}

export default function ItemCard({ item, category }: ItemCardProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <article className="flex h-full flex-col justify-between rounded-lg border border-slate-200 bg-white shadow-sm">
      <div>
        <Image
          src={item.imageUrl ?? "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=80"}
          alt={item.name}
          width={400}
          height={260}
          className="h-48 w-full rounded-t-lg object-cover"
        />
        <div className="p-4">
          <h3 className="text-lg font-semibold text-slate-900">{item.name}</h3>
          <p className="mt-2 text-sm text-slate-600">{item.description}</p>
        </div>
      </div>
      <div className="flex items-center justify-between border-t border-slate-200 p-4">
        <span className="text-sm font-medium text-slate-900">
          {currencyFormatter.format(Number(item.basePrice))}
        </span>
        <Button onClick={() => setIsOpen(true)}>Add to cart</Button>
      </div>
      <ItemDetailDialog isOpen={isOpen} onClose={() => setIsOpen(false)} item={item} category={category} />
    </article>
  );
}
