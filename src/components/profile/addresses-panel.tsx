"use client";

import { useState } from "react";
import type { Address } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { addressSchema } from "@/schemas/cart";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import type { z } from "zod";

const AddressFormSchema = addressSchema;
type AddressValues = z.infer<typeof AddressFormSchema>;

export default function AddressesPanel({ addresses }: { addresses: Address[] }) {
  const [items, setItems] = useState(addresses);
  const [error, setError] = useState<string | null>(null);
  const form = useForm<AddressValues>({
    resolver: zodResolver(AddressFormSchema),
    defaultValues: {
      line1: "",
      line2: "",
      city: "",
      state: "",
      zip: "",
      isDefault: false,
    },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setError(null);
    const response = await fetch("/api/profile/addresses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });

    if (!response.ok) {
      const body = await response.json();
      setError(body.error ?? "Unable to add address");
      return;
    }

    const body = await response.json();
    setItems((prev) => [...prev.map((item) => ({ ...item, isDefault: values.isDefault ? false : item.isDefault })), body.address]);
    form.reset();
  });

  const remove = async (id: string) => {
    await fetch(`/api/profile/addresses/${id}`, { method: "DELETE" });
    setItems((prev) => prev.filter((address) => address.id !== id));
  };

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">Saved addresses</h2>
      <ul className="mt-4 space-y-3 text-sm">
        {items.map((address) => (
          <li key={address.id} className="flex items-center justify-between rounded border border-slate-200 px-4 py-3">
            <div>
              <p className="font-medium">
                {address.line1}, {address.city}, {address.state} {address.zip}
              </p>
              {address.line2 ? <p className="text-xs text-slate-500">{address.line2}</p> : null}
              {address.isDefault ? <span className="text-xs text-brand">Default</span> : null}
            </div>
            <Button variant="ghost" onClick={() => remove(address.id)} className="text-xs text-red-600">
              Remove
            </Button>
          </li>
        ))}
      </ul>
      <form className="mt-6 grid gap-3" onSubmit={onSubmit}>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm font-medium text-slate-700 sm:col-span-2">
            Address line 1
            <Input {...form.register("line1")} required />
          </label>
          <label className="text-sm font-medium text-slate-700">
            Address line 2
            <Input {...form.register("line2")} />
          </label>
          <label className="text-sm font-medium text-slate-700">
            City
            <Input {...form.register("city")} required />
          </label>
          <label className="text-sm font-medium text-slate-700">
            State
            <Input {...form.register("state")} required maxLength={2} />
          </label>
          <label className="text-sm font-medium text-slate-700">
            ZIP
            <Input {...form.register("zip")} required />
          </label>
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" {...form.register("isDefault")} /> Set as default
        </label>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <Button type="submit" className="w-full sm:w-auto" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Adding..." : "Add address"}
        </Button>
      </form>
    </div>
  );
}
