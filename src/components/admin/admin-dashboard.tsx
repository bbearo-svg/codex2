"use client";

import { useEffect, useMemo, useState } from "react";
import type {
  Category,
  Discount,
  Item,
  Modifier,
  ModifierOption,
  Order,
  OrderStatus,
} from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { currencyFormatter } from "@/lib/utils";

interface KPIProps {
  ordersToday: number;
  revenueToday: number;
  topItems: Array<{ itemId: string | null; nameSnapshot: string; _sum: { quantity: number | null } }>;
}

type ModifierWithOptions = Modifier & { options: ModifierOption[] };
type ItemWithRelations = Item & { category: Category; modifiers: ModifierWithOptions[] };
type OrderWithUser = Order & { user: { name: string | null; email: string } | null };
type CustomerSummary = { id: string; name: string | null; email: string; orders: number; ltv: number };

type AdminDashboardProps = {
  kpis: KPIProps;
  categories: Category[];
  items: ItemWithRelations[];
  orders: OrderWithUser[];
  customers: CustomerSummary[];
  discounts: Discount[];
};

async function requestJson<T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
  const response = await fetch(input, init);
  const text = await response.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch (error) {
      console.error("Failed to parse JSON response", error);
    }
  }
  if (!response.ok) {
    const errorMessage =
      typeof data === "object" && data && "error" in data ? String((data as { error?: string }).error) : "Request failed";
    throw new Error(errorMessage);
  }
  return (data as T) ?? ({} as T);
}

export default function AdminDashboard({
  kpis,
  categories: initialCategories,
  items: initialItems,
  orders,
  customers,
  discounts: initialDiscounts,
}: AdminDashboardProps) {
  const [categories, setCategories] = useState(initialCategories);
  const [items, setItems] = useState<ItemWithRelations[]>(initialItems);
  const [discounts, setDiscounts] = useState(initialDiscounts);
  const [orderList, setOrderList] = useState(orders);

  const [categoryForm, setCategoryForm] = useState({ name: "", sort: "0" });
  const [itemForm, setItemForm] = useState({
    name: "",
    basePrice: "",
    categoryId: initialItems[0]?.categoryId ?? categories[0]?.id ?? "",
  });
  const [modifierForm, setModifierForm] = useState({
    itemId: initialItems[0]?.id ?? "",
    name: "",
    min: 0,
    max: 1,
    sort: 0,
  });
  const [optionForm, setOptionForm] = useState({
    modifierId: initialItems[0]?.modifiers[0]?.id ?? "",
    name: "",
    priceDelta: "0",
    sort: 0,
    isDefault: false,
  });
  const [discountForm, setDiscountForm] = useState({
    code: "",
    type: "PERCENT" as Discount["type"],
    value: "",
    minSubtotal: "",
    active: true,
  });

  const [categoryError, setCategoryError] = useState<string | null>(null);
  const [itemError, setItemError] = useState<string | null>(null);
  const [modifierError, setModifierError] = useState<string | null>(null);
  const [optionError, setOptionError] = useState<string | null>(null);
  const [discountError, setDiscountError] = useState<string | null>(null);
  const [orderFeedback, setOrderFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const [isCategorySubmitting, setIsCategorySubmitting] = useState(false);
  const [isItemSubmitting, setIsItemSubmitting] = useState(false);
  const [isModifierSubmitting, setIsModifierSubmitting] = useState(false);
  const [isOptionSubmitting, setIsOptionSubmitting] = useState(false);
  const [isDiscountSubmitting, setIsDiscountSubmitting] = useState(false);

  const sortedModifiers = useMemo(() =>
    items.flatMap((item) =>
      item.modifiers
        .slice()
        .sort((a, b) => (a.sort - b.sort !== 0 ? a.sort - b.sort : a.name.localeCompare(b.name)))
        .map((modifier) => ({ ...modifier, itemId: item.id, itemName: item.name }))
    )
  , [items]);

  useEffect(() => {
    if (categories.length && !categories.find((category) => category.id === itemForm.categoryId)) {
      setItemForm((prev) => ({ ...prev, categoryId: categories[0].id }));
    }
  }, [categories, itemForm.categoryId]);

  useEffect(() => {
    if (items.length && !items.find((item) => item.id === modifierForm.itemId)) {
      setModifierForm((prev) => ({ ...prev, itemId: items[0].id }));
    }
  }, [items, modifierForm.itemId]);

  useEffect(() => {
    if (sortedModifiers.length && !sortedModifiers.find((modifier) => modifier.id === optionForm.modifierId)) {
      setOptionForm((prev) => ({ ...prev, modifierId: sortedModifiers[0].id }));
    }
  }, [sortedModifiers, optionForm.modifierId]);

  const createCategory = async () => {
    setCategoryError(null);
    setIsCategorySubmitting(true);
    try {
      const body = await requestJson<{ category: Category }>("/api/admin/menu/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: categoryForm.name, sort: Number(categoryForm.sort) }),
      });
      setCategories((prev) =>
        [...prev, body.category].sort((a, b) => (a.sort - b.sort !== 0 ? a.sort - b.sort : a.name.localeCompare(b.name)))
      );
      setCategoryForm({ name: "", sort: "0" });
    } catch (error) {
      setCategoryError(error instanceof Error ? error.message : "Unable to create category");
    } finally {
      setIsCategorySubmitting(false);
    }
  };

  const createItem = async () => {
    setItemError(null);
    setIsItemSubmitting(true);
    try {
      const body = await requestJson<{ item: Item }>("/api/admin/menu/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categoryId: itemForm.categoryId,
          name: itemForm.name,
          basePrice: Number(itemForm.basePrice),
        }),
      });
      const category = categories.find((entry) => entry.id === itemForm.categoryId);
      if (!category) throw new Error("Category not found");
      setItems((prev) =>
        [...prev, { ...body.item, category, modifiers: [] }].sort((a, b) => a.name.localeCompare(b.name))
      );
      setItemForm({ name: "", basePrice: "", categoryId: category.id });
    } catch (error) {
      setItemError(error instanceof Error ? error.message : "Unable to create item");
    } finally {
      setIsItemSubmitting(false);
    }
  };

  const createModifier = async () => {
    setModifierError(null);
    setIsModifierSubmitting(true);
    try {
      const body = await requestJson<{ modifier: Modifier }>("/api/admin/menu/modifiers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemId: modifierForm.itemId,
          name: modifierForm.name,
          min: Number(modifierForm.min),
          max: Number(modifierForm.max),
          sort: Number(modifierForm.sort),
        }),
      });
      setItems((prev) =>
        prev.map((item) =>
          item.id === body.modifier.itemId
            ? {
                ...item,
                modifiers: [...item.modifiers, { ...body.modifier, options: [] }].sort((a, b) =>
                  a.sort - b.sort !== 0 ? a.sort - b.sort : a.name.localeCompare(b.name)
                ),
              }
            : item
        )
      );
      setModifierForm((prev) => ({ ...prev, name: "", min: 0, max: 1, sort: 0 }));
      setOptionForm((prev) => ({ ...prev, modifierId: body.modifier.id }));
    } catch (error) {
      setModifierError(error instanceof Error ? error.message : "Unable to create modifier");
    } finally {
      setIsModifierSubmitting(false);
    }
  };

  const createModifierOption = async () => {
    if (!optionForm.modifierId) {
      setOptionError("Select a modifier before adding options");
      return;
    }
    setOptionError(null);
    setIsOptionSubmitting(true);
    try {
      const body = await requestJson<{ option: ModifierOption }>(
        `/api/admin/menu/modifiers/${optionForm.modifierId}/options`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: optionForm.name,
            priceDelta: Number(optionForm.priceDelta),
            sort: Number(optionForm.sort),
            isDefault: optionForm.isDefault,
          }),
        }
      );
      setItems((prev) =>
        prev.map((item) => ({
          ...item,
          modifiers: item.modifiers.map((modifier) =>
            modifier.id === optionForm.modifierId
              ? {
                  ...modifier,
                  options: [...modifier.options, body.option].sort((a, b) =>
                    a.sort - b.sort !== 0 ? a.sort - b.sort : a.name.localeCompare(b.name)
                  ),
                }
              : modifier
          ),
        }))
      );
      setOptionForm((prev) => ({ ...prev, name: "", priceDelta: "0", sort: 0, isDefault: false }));
    } catch (error) {
      setOptionError(error instanceof Error ? error.message : "Unable to create option");
    } finally {
      setIsOptionSubmitting(false);
    }
  };

  const createDiscount = async () => {
    setDiscountError(null);
    setIsDiscountSubmitting(true);
    try {
      const body = await requestJson<{ discount: Discount }>("/api/admin/discounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: discountForm.code,
          type: discountForm.type,
          value: Number(discountForm.value),
          minSubtotal: discountForm.minSubtotal ? Number(discountForm.minSubtotal) : undefined,
          active: discountForm.active,
        }),
      });
      setDiscounts((prev) =>
        [...prev, body.discount].sort((a, b) => a.code.localeCompare(b.code))
      );
      setDiscountForm({ code: "", type: "PERCENT", value: "", minSubtotal: "", active: true });
    } catch (error) {
      setDiscountError(error instanceof Error ? error.message : "Unable to create discount");
    } finally {
      setIsDiscountSubmitting(false);
    }
  };

  const updateOrderStatus = async (orderId: string, status: OrderStatus) => {
    setOrderFeedback(null);
    try {
      const body = await requestJson<{ order: Order }>(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      setOrderList((prev) => prev.map((order) => (order.id === orderId ? { ...order, status: body.order.status } : order)));
      setOrderFeedback({ type: "success", message: "Order status updated" });
    } catch (error) {
      setOrderFeedback({
        type: "error",
        message: error instanceof Error ? error.message : "Unable to update order",
      });
    }
  };

  const refundOrder = async (orderId: string) => {
    setOrderFeedback(null);
    try {
      const body = await requestJson<{ order: Order }>(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "refund" }),
      });
      setOrderList((prev) => prev.map((order) => (order.id === orderId ? { ...order, status: body.order.status } : order)));
      setOrderFeedback({ type: "success", message: "Refund initiated" });
    } catch (error) {
      setOrderFeedback({
        type: "error",
        message: error instanceof Error ? error.message : "Unable to process refund",
      });
    }
  };

  const resendInvoice = async (orderId: string) => {
    setOrderFeedback(null);
    try {
      await requestJson<{ status: string }>(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "resend_invoice" }),
      });
      setOrderFeedback({ type: "success", message: "Invoice email sent" });
    } catch (error) {
      setOrderFeedback({
        type: "error",
        message: error instanceof Error ? error.message : "Unable to resend invoice",
      });
    }
  };

  return (
    <div className="space-y-8">
      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="text-sm text-slate-500">Orders today</h3>
          <p className="text-2xl font-semibold">{kpis.ordersToday}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="text-sm text-slate-500">Revenue today</h3>
          <p className="text-2xl font-semibold">{currencyFormatter.format(kpis.revenueToday)}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="text-sm text-slate-500">Top items</h3>
          <ul className="mt-2 space-y-1 text-xs text-slate-600">
            {kpis.topItems.map((item) => (
              <li key={`${item.itemId}-${item.nameSnapshot}`}>
                {item.nameSnapshot}: {item._sum.quantity ?? 0}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Categories</h2>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <Input
            value={categoryForm.name}
            onChange={(event) => setCategoryForm((prev) => ({ ...prev, name: event.target.value }))}
            placeholder="Name"
            className="sm:w-1/3"
          />
          <Input
            type="number"
            value={categoryForm.sort}
            onChange={(event) => setCategoryForm((prev) => ({ ...prev, sort: event.target.value }))}
            placeholder="Sort"
            className="sm:w-32"
          />
          <Button onClick={createCategory} disabled={!categoryForm.name || isCategorySubmitting}>
            {isCategorySubmitting ? "Adding..." : "Add category"}
          </Button>
        </div>
        {categoryError ? <p className="mt-2 text-sm text-red-600">{categoryError}</p> : null}
        <ul className="mt-4 space-y-2 text-sm">
          {categories.map((category) => (
            <li key={category.id} className="flex items-center justify-between">
              <span>{category.name}</span>
              <span className="text-xs text-slate-500">Sort: {category.sort}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Items</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-4">
          <Input
            value={itemForm.name}
            onChange={(event) => setItemForm((prev) => ({ ...prev, name: event.target.value }))}
            placeholder="Item name"
          />
          <Input
            type="number"
            min="0"
            step="0.5"
            value={itemForm.basePrice}
            onChange={(event) => setItemForm((prev) => ({ ...prev, basePrice: event.target.value }))}
            placeholder="Base price"
          />
          <select
            className="rounded-md border border-slate-300 p-2 text-sm"
            value={itemForm.categoryId}
            onChange={(event) => setItemForm((prev) => ({ ...prev, categoryId: event.target.value }))}
          >
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          <Button onClick={createItem} disabled={!itemForm.name || !itemForm.basePrice || isItemSubmitting}>
            {isItemSubmitting ? "Adding..." : "Add item"}
          </Button>
        </div>
        {itemError ? <p className="mt-2 text-sm text-red-600">{itemError}</p> : null}
        <ul className="mt-4 space-y-2 text-sm">
          {items.map((item) => (
            <li key={item.id} className="flex items-center justify-between">
              <div>
                <p className="font-medium">{item.name}</p>
                <p className="text-xs text-slate-500">{item.category.name}</p>
              </div>
              <span>{currencyFormatter.format(Number(item.basePrice))}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Modifiers &amp; options</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-6">
          <select
            className="rounded-md border border-slate-300 p-2 text-sm"
            value={modifierForm.itemId}
            onChange={(event) => setModifierForm((prev) => ({ ...prev, itemId: event.target.value }))}
          >
            {items.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
          <Input
            value={modifierForm.name}
            onChange={(event) => setModifierForm((prev) => ({ ...prev, name: event.target.value }))}
            placeholder="Modifier name"
          />
          <Input
            type="number"
            min="0"
            value={modifierForm.min}
            onChange={(event) => setModifierForm((prev) => ({ ...prev, min: Number(event.target.value) }))}
            placeholder="Min"
          />
          <Input
            type="number"
            min={1}
            value={modifierForm.max}
            onChange={(event) => setModifierForm((prev) => ({ ...prev, max: Number(event.target.value) }))}
            placeholder="Max"
          />
          <Input
            type="number"
            min={0}
            value={modifierForm.sort}
            onChange={(event) => setModifierForm((prev) => ({ ...prev, sort: Number(event.target.value) }))}
            placeholder="Sort"
          />
          <Button
            onClick={createModifier}
            disabled={!modifierForm.name || !modifierForm.itemId || isModifierSubmitting}
          >
            {isModifierSubmitting ? "Adding..." : "Add modifier"}
          </Button>
        </div>
        {modifierError ? <p className="mt-2 text-sm text-red-600">{modifierError}</p> : null}

        <div className="mt-6 grid gap-3 sm:grid-cols-6">
          <select
            className="rounded-md border border-slate-300 p-2 text-sm"
            value={optionForm.modifierId}
            onChange={(event) => setOptionForm((prev) => ({ ...prev, modifierId: event.target.value }))}
          >
            {sortedModifiers.map((modifier) => (
              <option key={modifier.id} value={modifier.id}>
                {modifier.itemName} — {modifier.name}
              </option>
            ))}
          </select>
          <Input
            value={optionForm.name}
            onChange={(event) => setOptionForm((prev) => ({ ...prev, name: event.target.value }))}
            placeholder="Option name"
          />
          <Input
            type="number"
            step="0.25"
            value={optionForm.priceDelta}
            onChange={(event) => setOptionForm((prev) => ({ ...prev, priceDelta: event.target.value }))}
            placeholder="Price delta"
          />
          <Input
            type="number"
            min={0}
            value={optionForm.sort}
            onChange={(event) => setOptionForm((prev) => ({ ...prev, sort: Number(event.target.value) }))}
            placeholder="Sort"
          />
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={optionForm.isDefault}
              onChange={(event) => setOptionForm((prev) => ({ ...prev, isDefault: event.target.checked }))}
            />
            Default
          </label>
          <Button
            onClick={createModifierOption}
            disabled={!optionForm.name || !optionForm.modifierId || isOptionSubmitting}
            className="sm:col-span-6 sm:w-auto"
          >
            {isOptionSubmitting ? "Adding..." : "Add option"}
          </Button>
        </div>
        {optionError ? <p className="mt-2 text-sm text-red-600">{optionError}</p> : null}

        <div className="mt-6 space-y-4">
          {items.map((item) => (
            <div key={item.id} className="rounded border border-slate-200 p-4">
              <h3 className="text-sm font-semibold text-slate-800">{item.name}</h3>
              {item.modifiers.length ? (
                <ul className="mt-3 space-y-3 text-sm">
                  {item.modifiers
                    .slice()
                    .sort((a, b) => (a.sort - b.sort !== 0 ? a.sort - b.sort : a.name.localeCompare(b.name)))
                    .map((modifier) => (
                      <li key={modifier.id}>
                        <p className="font-medium">
                          {modifier.name}
                          <span className="ml-2 text-xs text-slate-500">
                            Min {modifier.min} / Max {modifier.max}
                          </span>
                        </p>
                        {modifier.options.length ? (
                          <ul className="mt-1 space-y-1 text-xs text-slate-600">
                            {modifier.options
                              .slice()
                              .sort((a, b) => (a.sort - b.sort !== 0 ? a.sort - b.sort : a.name.localeCompare(b.name)))
                              .map((option) => (
                                <li key={option.id}>
                                  {option.name}
                                  {Number(option.priceDelta) !== 0 ? (
                                    <span className="ml-2">
                                      ({Number(option.priceDelta) > 0 ? "+" : ""}
                                      {currencyFormatter.format(Number(option.priceDelta))})
                                    </span>
                                  ) : null}
                                  {option.isDefault ? <span className="ml-2 text-green-600">Default</span> : null}
                                </li>
                              ))}
                          </ul>
                        ) : (
                          <p className="text-xs text-slate-500">No options yet</p>
                        )}
                      </li>
                    ))}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-slate-500">No modifiers configured</p>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Discounts</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-5">
          <Input
            value={discountForm.code}
            onChange={(event) => setDiscountForm((prev) => ({ ...prev, code: event.target.value.toUpperCase() }))}
            placeholder="Code"
          />
          <select
            className="rounded-md border border-slate-300 p-2 text-sm"
            value={discountForm.type}
            onChange={(event) => setDiscountForm((prev) => ({ ...prev, type: event.target.value as Discount["type"] }))}
          >
            <option value="PERCENT">Percent</option>
            <option value="FIXED">Fixed</option>
          </select>
          <Input
            type="number"
            min="0"
            value={discountForm.value}
            onChange={(event) => setDiscountForm((prev) => ({ ...prev, value: event.target.value }))}
            placeholder="Value"
          />
          <Input
            type="number"
            min="0"
            value={discountForm.minSubtotal}
            onChange={(event) => setDiscountForm((prev) => ({ ...prev, minSubtotal: event.target.value }))}
            placeholder="Min subtotal"
          />
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={discountForm.active}
              onChange={(event) => setDiscountForm((prev) => ({ ...prev, active: event.target.checked }))}
            />
            Active
          </label>
          <Button
            onClick={createDiscount}
            disabled={!discountForm.code || !discountForm.value || isDiscountSubmitting}
            className="sm:col-span-5 sm:w-auto"
          >
            {isDiscountSubmitting ? "Adding..." : "Add discount"}
          </Button>
        </div>
        {discountError ? <p className="mt-2 text-sm text-red-600">{discountError}</p> : null}
        <ul className="mt-4 space-y-2 text-sm">
          {discounts.map((discount) => (
            <li key={discount.id} className="flex items-center justify-between">
              <span>
                {discount.code} · {discount.type}
              </span>
              <span className="text-xs text-slate-500">
                Value {Number(discount.value)} · {discount.active ? "Active" : "Inactive"}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Recent orders</h2>
        {orderFeedback ? (
          <p className={`mt-2 text-sm ${orderFeedback.type === "error" ? "text-red-600" : "text-green-600"}`}>
            {orderFeedback.message}
          </p>
        ) : null}
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase text-slate-500">
                <th className="px-2 py-1">Order</th>
                <th className="px-2 py-1">Customer</th>
                <th className="px-2 py-1">Status</th>
                <th className="px-2 py-1">Total</th>
              </tr>
            </thead>
            <tbody>
              {orderList.map((order) => (
                <tr key={order.id} className="border-t border-slate-200">
                  <td className="px-2 py-2">{order.number}</td>
                  <td className="px-2 py-2">
                    <div className="flex flex-col">
                      <span>{order.user?.name ?? "Guest"}</span>
                      <span className="text-xs text-slate-500">{order.user?.email}</span>
                    </div>
                  </td>
                  <td className="px-2 py-2">
                    <select
                      className="rounded-md border border-slate-300 p-1 text-xs"
                      value={order.status}
                      onChange={(event) => updateOrderStatus(order.id, event.target.value as OrderStatus)}
                    >
                      {[
                        "PENDING",
                        "PAID",
                        "PREPARING",
                        "READY",
                        "COMPLETED",
                        "CANCELLED",
                        "REFUNDED",
                      ].map((status) => (
                        <option key={status}>{status}</option>
                      ))}
                    </select>
                    <div className="mt-2 flex gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        className="h-auto px-2 text-xs"
                        onClick={() => refundOrder(order.id)}
                      >
                        Refund
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        className="h-auto px-2 text-xs"
                        onClick={() => resendInvoice(order.id)}
                      >
                        Resend invoice
                      </Button>
                    </div>
                  </td>
                  <td className="px-2 py-2">{currencyFormatter.format(Number(order.total))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Customers</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase text-slate-500">
                <th className="px-2 py-1">Name</th>
                <th className="px-2 py-1">Email</th>
                <th className="px-2 py-1">Orders</th>
                <th className="px-2 py-1">Lifetime value</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((customer) => (
                <tr key={customer.id} className="border-t border-slate-200">
                  <td className="px-2 py-2">{customer.name ?? "-"}</td>
                  <td className="px-2 py-2">{customer.email}</td>
                  <td className="px-2 py-2">{customer.orders}</td>
                  <td className="px-2 py-2">{currencyFormatter.format(customer.ltv)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
