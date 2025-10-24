import { Cart, CartItem, CartItemOption, Category, Item, ModifierOption } from "@prisma/client";

export type CartItemWithRelations = CartItem & {
  item: Item & { category: Category };
  options: Array<CartItemOption & { modifierOption: ModifierOption }>;
};

export type CartWithRelations = Cart & {
  items: CartItemWithRelations[];
};
