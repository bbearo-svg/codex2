import ItemCard from "@/components/menu/item-card";
import type { Category, Item, Modifier, ModifierOption } from "@prisma/client";

export interface CategoryWithItems extends Category {
  items: Array<
    Item & {
      modifiers: Array<Modifier & { options: ModifierOption[] }>;
    }
  >;
}

export default function MenuGrid({ categories }: { categories: CategoryWithItems[] }) {
  return (
    <div className="space-y-12">
      {categories.map((category) => (
        <section key={category.id} aria-labelledby={`category-${category.id}`}>
          <div className="mb-6">
            <h2 id={`category-${category.id}`} className="text-2xl font-semibold text-slate-900">
              {category.name}
            </h2>
            {category.description ? (
              <p className="mt-2 max-w-2xl text-sm text-slate-600">{category.description}</p>
            ) : null}
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {category.items.map((item) => (
              <ItemCard key={item.id} item={item} category={category} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
