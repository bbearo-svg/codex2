"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { cartItemSchema, type CartItemInput } from "@/schemas/cart";
import type { CategoryWithItems } from "@/components/menu/menu-grid";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCart } from "@/components/cart/cart-context";
import { currencyFormatter } from "@/lib/utils";
import { calculateLineTotal } from "@/lib/pricing";

interface ItemDetailDialogProps {
  isOpen: boolean;
  onClose: () => void;
  item: CategoryWithItems["items"][number];
  category: CategoryWithItems;
}

export default function ItemDetailDialog({ isOpen, onClose, item }: ItemDetailDialogProps) {
  const { addItem } = useCart();
  const optionMetadata = useMemo(() => {
    const map = new Map<
      string,
      {
        modifierId: string;
        priceDelta: number;
      }
    >();
    item.modifiers.forEach((modifier) => {
      modifier.options.forEach((option) => {
        map.set(option.id, {
          modifierId: modifier.id,
          priceDelta: Number(option.priceDelta),
        });
      });
    });
    return map;
  }, [item.modifiers]);

  const defaultOptions = useMemo(() => {
    return item.modifiers.flatMap((modifier) => {
      const defaults = modifier.options.filter((option) => option.isDefault);
      const remainingRequired = Math.max(modifier.min - defaults.length, 0);
      const fallback = remainingRequired
        ? modifier.options
            .filter((option) => !defaults.some((existing) => existing.id === option.id))
            .slice(0, remainingRequired)
        : [];
      return [...defaults, ...fallback].map((option) => ({
        modifierOptionId: option.id,
        priceDelta: Number(option.priceDelta),
      }));
    });
  }, [item.modifiers]);

  const form = useForm<CartItemInput>({
    resolver: zodResolver(cartItemSchema),
    defaultValues: {
      itemId: item.id,
      quantity: 10,
      notes: "",
      options: defaultOptions,
    },
  });

  const [modifierErrors, setModifierErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setModifierErrors({});
    setSubmitError(null);
    form.reset({
      itemId: item.id,
      quantity: 10,
      notes: "",
      options: defaultOptions,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, item.id, defaultOptions]);

  const selectedOptions = form.watch("options") ?? [];
  const selectedOptionIds = selectedOptions.map((option) => option.modifierOptionId);
  const quantity = form.watch("quantity") ?? 1;

  const total = useMemo(
    () =>
      calculateLineTotal({
        basePrice: Number(item.basePrice),
        quantity,
        options: selectedOptions.map((option) => ({
          id: option.modifierOptionId,
          priceDelta: optionMetadata.get(option.modifierOptionId)?.priceDelta ?? option.priceDelta,
        })),
      }),
    [item.basePrice, quantity, selectedOptions, optionMetadata]
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal>
      <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">{item.name}</h2>
          <button onClick={onClose} className="text-sm text-slate-500" aria-label="Close">
            Close
          </button>
        </div>
        <p className="mt-2 text-sm text-slate-600">{item.description}</p>
        <form
          className="mt-6 space-y-4"
          onSubmit={form.handleSubmit(async (values) => {
            const nextErrors: Record<string, string> = {};
            item.modifiers.forEach((modifier) => {
              const count = values.options.filter(
                (option) => optionMetadata.get(option.modifierOptionId)?.modifierId === modifier.id
              ).length;
              if (count < modifier.min) {
                nextErrors[modifier.id] = `Select at least ${modifier.min} option${modifier.min === 1 ? "" : "s"}.`;
              }
              if (count > modifier.max) {
                nextErrors[modifier.id] = `Select no more than ${modifier.max} option${modifier.max === 1 ? "" : "s"}.`;
              }
            });

            if (Object.keys(nextErrors).length) {
              setModifierErrors(nextErrors);
              return;
            }

            try {
              setSubmitError(null);
              await addItem({
                itemId: values.itemId,
                quantity: values.quantity,
                notes: values.notes,
                optionIds: values.options.map((option) => option.modifierOptionId),
              });
              onClose();
            } catch (error) {
              setSubmitError(error instanceof Error ? error.message : "Unable to add item to cart");
            }
          })}
        >
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            Quantity
            <Input
              type="number"
              min={1}
              max={300}
              aria-describedby="quantity-help"
              {...form.register("quantity", { valueAsNumber: true })}
            />
            <span id="quantity-help" className="text-xs font-normal text-slate-500">
              Minimum order quantity is 1, maximum 300 servings per line item.
            </span>
          </label>
          <div className="space-y-4">
            {item.modifiers.map((modifier) => (
              <fieldset key={modifier.id} className="space-y-2">
                <legend className="text-sm font-semibold text-slate-700">
                  {modifier.name}
                  <span className="ml-2 text-xs text-slate-500">
                    Choose {modifier.min} - {modifier.max}
                  </span>
                </legend>
                <div className="space-y-2">
                  {modifier.options.map((option) => {
                    const isSelected = selectedOptionIds.includes(option.id);
                    return (
                      <label key={option.id} className="flex items-center justify-between rounded border border-slate-200 p-3">
                        <div>
                          <span className="text-sm font-medium text-slate-800">{option.name}</span>
                          {Number(option.priceDelta) !== 0 ? (
                            <span className="ml-2 text-xs text-slate-500">
                              {Number(option.priceDelta) > 0 ? "+" : ""}
                              {currencyFormatter.format(Number(option.priceDelta))}
                            </span>
                          ) : null}
                        </div>
                        <input
                          type={modifier.max > 1 ? "checkbox" : "radio"}
                          name={modifier.id}
                          value={option.id}
                          checked={isSelected}
                          onChange={(event) => {
                            const current = form.getValues("options") ?? [];
                            const modifierSelections = current.filter(
                              (opt) => optionMetadata.get(opt.modifierOptionId)?.modifierId === modifier.id
                            );

                            const clearModifierError = () => {
                              setModifierErrors((prev) => {
                                if (!prev[modifier.id]) return prev;
                                const { [modifier.id]: _removed, ...rest } = prev;
                                return rest;
                              });
                            };

                            if (modifier.max === 1) {
                              if (!event.target.checked) {
                                if (modifier.min > 0) {
                                  setModifierErrors((prev) => ({
                                    ...prev,
                                    [modifier.id]: `Select at least ${modifier.min} option${modifier.min === 1 ? "" : "s"}.`,
                                  }));
                                  return;
                                }
                                form.setValue(
                                  "options",
                                  current.filter((opt) => optionMetadata.get(opt.modifierOptionId)?.modifierId !== modifier.id),
                                  { shouldDirty: true, shouldValidate: true }
                                );
                                clearModifierError();
                                return;
                              }

                              form.setValue(
                                "options",
                                [
                                  ...current.filter(
                                    (opt) => optionMetadata.get(opt.modifierOptionId)?.modifierId !== modifier.id
                                  ),
                                  { modifierOptionId: option.id, priceDelta: Number(option.priceDelta) },
                                ],
                                { shouldDirty: true, shouldValidate: true }
                              );
                              clearModifierError();
                              return;
                            }

                            if (event.target.checked) {
                              if (modifierSelections.length >= modifier.max) {
                                setModifierErrors((prev) => ({
                                  ...prev,
                                  [modifier.id]: `Select no more than ${modifier.max} option${modifier.max === 1 ? "" : "s"}.`,
                                }));
                                return;
                              }
                              if (current.some((opt) => opt.modifierOptionId === option.id)) {
                                return;
                              }
                              form.setValue(
                                "options",
                                [...current, { modifierOptionId: option.id, priceDelta: Number(option.priceDelta) }],
                                { shouldDirty: true, shouldValidate: true }
                              );
                              clearModifierError();
                            } else {
                              if (!current.some((opt) => opt.modifierOptionId === option.id)) {
                                return;
                              }
                              if (modifierSelections.length <= modifier.min) {
                                setModifierErrors((prev) => ({
                                  ...prev,
                                  [modifier.id]: `Select at least ${modifier.min} option${modifier.min === 1 ? "" : "s"}.`,
                                }));
                                return;
                              }
                              form.setValue(
                                "options",
                                current.filter((opt) => opt.modifierOptionId !== option.id),
                                { shouldDirty: true, shouldValidate: true }
                              );
                              clearModifierError();
                            }
                          }}
                          className="h-4 w-4"
                        />
                      </label>
                    );
                  })}
                </div>
                {modifierErrors[modifier.id] ? (
                  <p className="text-xs text-red-600" aria-live="polite">
                    {modifierErrors[modifier.id]}
                  </p>
                ) : null}
              </fieldset>
            ))}
          </div>
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            Notes
            <textarea
              {...form.register("notes")}
              placeholder="Add preparation details"
              rows={3}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            />
          </label>
          <div className="flex items-center justify-between border-t border-slate-200 pt-4">
            <span className="text-sm text-slate-600">Estimated line total</span>
            <span className="text-lg font-semibold">{currencyFormatter.format(total)}</span>
          </div>
          {submitError ? (
            <p className="text-sm text-red-600" aria-live="assertive">
              {submitError}
            </p>
          ) : null}
          <Button type="submit" className="w-full">
            Add to cart
          </Button>
        </form>
      </div>
    </div>
  );
}
