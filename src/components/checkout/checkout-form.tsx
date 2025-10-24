"use client";

import { FormEvent, useEffect, useState } from "react";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { useCart } from "@/components/cart/cart-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { currencyFormatter } from "@/lib/utils";
import { useForm } from "react-hook-form";
import { checkoutSchema, type CheckoutInput } from "@/schemas/cart";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "");

type TotalsResponse = {
  subtotal: number;
  discountTotal: number;
  tax: number;
  deliveryFee: number;
  tip: number;
  total: number;
};

type DiscountResponse = {
  code: string;
  type: string;
  value: number;
} | null;

function normalizeCheckoutValues(values: CheckoutInput): CheckoutInput {
  const payload: CheckoutInput = {
    ...values,
    notes: values.notes?.trim() ? values.notes.trim() : undefined,
    promoCode: values.promoCode?.trim() ? values.promoCode.trim() : undefined,
  };

  if (payload.fulfillment === "PICKUP") {
    (payload as { deliveryAddress?: CheckoutInput["deliveryAddress"] }).deliveryAddress = undefined;
  } else if (payload.deliveryAddress) {
    payload.deliveryAddress = {
      line1: payload.deliveryAddress.line1.trim(),
      line2: payload.deliveryAddress.line2?.trim() || undefined,
      city: payload.deliveryAddress.city.trim(),
      state: payload.deliveryAddress.state.trim().toUpperCase(),
      zip: payload.deliveryAddress.zip.trim(),
    };
  }

  return payload;
}

function CheckoutFormInner({
  clientSecret,
  totals,
  discount,
  values,
}: {
  clientSecret: string;
  totals: TotalsResponse;
  discount: DiscountResponse;
  values: CheckoutInput;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const { cart } = useCart();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!stripe || !elements || !cart) return;
    setIsProcessing(true);
    setError(null);

    const { error: stripeError, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: "if_required",
      confirmParams: {
        return_url: `${window.location.origin}/dashboard/orders`,
      },
    });

    if (stripeError) {
      setError(stripeError.message ?? "Payment failed");
      setIsProcessing(false);
      return;
    }

    if (!paymentIntent) {
      setError("Payment processing error");
      setIsProcessing(false);
      return;
    }

    const response = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        cartId: cart.id,
        paymentIntentId: paymentIntent.id,
        fulfillment: values.fulfillment,
        eventAt: values.eventAt,
        tip: values.tip,
        notes: values.notes,
        promoCode: values.promoCode,
        deliveryAddress: values.deliveryAddress,
      }),
    });

    if (!response.ok) {
      const body = await response.json();
      setError(body.error ?? "Unable to create order");
      setIsProcessing(false);
      return;
    }

    router.push("/dashboard/orders?status=PAID");
  };

  return (
    <form className="grid gap-6" onSubmit={onSubmit}>
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Payment</h2>
        <PaymentElement options={{ layout: "tabs" }} />
        {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
        <Button type="submit" className="mt-6 w-full" disabled={!stripe || isProcessing}>
          {isProcessing ? "Processing..." : `Pay ${currencyFormatter.format(totals.total)}`}
        </Button>
      </div>
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Order summary</h2>
        <dl className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <dt>Subtotal</dt>
            <dd>{currencyFormatter.format(totals.subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt>Discount</dt>
            <dd>-{currencyFormatter.format(totals.discountTotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt>Tax</dt>
            <dd>{currencyFormatter.format(totals.tax)}</dd>
          </div>
          <div className="flex justify-between">
            <dt>Delivery</dt>
            <dd>{currencyFormatter.format(totals.deliveryFee)}</dd>
          </div>
          <div className="flex justify-between">
            <dt>Tip</dt>
            <dd>{currencyFormatter.format(totals.tip)}</dd>
          </div>
          <div className="flex justify-between border-t border-slate-200 pt-2 text-base font-semibold">
            <dt>Total</dt>
            <dd>{currencyFormatter.format(totals.total)}</dd>
          </div>
          {discount ? (
            <div className="text-xs text-slate-500">
              Discount {discount.code} ({discount.type} - {discount.value}) applied.
            </div>
          ) : null}
        </dl>
      </div>
    </form>
  );
}

export default function CheckoutForm() {
  const { cart } = useCart();
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [totals, setTotals] = useState<TotalsResponse | null>(null);
  const [discount, setDiscount] = useState<DiscountResponse>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formValues, setFormValues] = useState<CheckoutInput | null>(null);

  const form = useForm<CheckoutInput>({
    resolver: zodResolver(checkoutSchema),
    shouldUnregister: true,
    defaultValues: {
      cartId: cart?.id ?? "",
      fulfillment: "DELIVERY",
      eventAt: new Date(Date.now() + 3 * 24 * 3600 * 1000).toISOString().slice(0, 16),
      tip: 0,
      notes: "",
      promoCode: "",
      savePaymentMethod: false,
      deliveryAddress: {
        line1: "",
        line2: "",
        city: "",
        state: "",
        zip: "",
      },
    },
  });

  const createSession = async (values: CheckoutInput) => {
    if (!cart) return;
    setIsLoading(true);
    setError(null);
    const payload = normalizeCheckoutValues(values);
    payload.cartId = cart.id;
    const response = await fetch("/api/checkout/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const body = await response.json();
      setError(body.error ?? "Unable to prepare payment");
      setIsLoading(false);
      return;
    }
    const data = await response.json();
    setClientSecret(data.clientSecret);
    setTotals(data.totals);
    setDiscount(data.discount);
    setFormValues(payload);
    setIsLoading(false);
  };

  useEffect(() => {
    if (cart?.id) {
      const values = form.getValues();
      form.setValue("cartId", cart.id);
      void createSession(values as CheckoutInput);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cart?.id]);

  if (!cart || cart.items.length === 0) {
    return <p className="text-center text-sm text-slate-600">Your cart is empty.</p>;
  }

  return (
    <div className="grid gap-6 md:grid-cols-[1.5fr_1fr]">
      <div className="space-y-6">
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Event details</h2>
          <form
            className="mt-4 grid gap-4"
            onSubmit={form.handleSubmit((values) => {
              if (!cart) return;
              void createSession(values);
            })}
          >
            <input type="hidden" value={cart.id} {...form.register("cartId")} />
            <label className="text-sm font-medium text-slate-700">
              Fulfillment
              <select
                className="mt-1 w-full rounded-md border border-slate-300 p-2 text-sm"
                {...form.register("fulfillment")}
              >
                <option value="DELIVERY">Delivery</option>
                <option value="PICKUP">Pickup</option>
              </select>
            </label>
            {form.formState.errors.fulfillment ? (
              <p className="text-xs text-red-600">{form.formState.errors.fulfillment.message as string}</p>
            ) : null}
            <label className="text-sm font-medium text-slate-700">
              Event date &amp; time
              <Input type="datetime-local" {...form.register("eventAt")} required />
            </label>
            {form.formState.errors.eventAt ? (
              <p className="text-xs text-red-600">{form.formState.errors.eventAt.message as string}</p>
            ) : null}
            {form.watch("fulfillment") === "DELIVERY" ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="text-sm font-medium text-slate-700 sm:col-span-2">
                  Address line 1
                  <Input {...form.register("deliveryAddress.line1")} placeholder="123 Market St" required />
                </label>
                {form.formState.errors.deliveryAddress?.line1 ? (
                  <p className="text-xs text-red-600 sm:col-span-2">
                    {form.formState.errors.deliveryAddress.line1.message as string}
                  </p>
                ) : null}
                <label className="text-sm font-medium text-slate-700">
                  Address line 2
                  <Input {...form.register("deliveryAddress.line2")} placeholder="Suite" />
                </label>
                <label className="text-sm font-medium text-slate-700">
                  City
                  <Input {...form.register("deliveryAddress.city")} required />
                </label>
                {form.formState.errors.deliveryAddress?.city ? (
                  <p className="text-xs text-red-600 sm:col-span-2">
                    {form.formState.errors.deliveryAddress.city.message as string}
                  </p>
                ) : null}
                <label className="text-sm font-medium text-slate-700">
                  State
                  <Input {...form.register("deliveryAddress.state")} required maxLength={2} />
                </label>
                {form.formState.errors.deliveryAddress?.state ? (
                  <p className="text-xs text-red-600 sm:col-span-2">
                    {form.formState.errors.deliveryAddress.state.message as string}
                  </p>
                ) : null}
                <label className="text-sm font-medium text-slate-700">
                  ZIP
                  <Input {...form.register("deliveryAddress.zip")} required />
                </label>
                {form.formState.errors.deliveryAddress?.zip ? (
                  <p className="text-xs text-red-600 sm:col-span-2">
                    {form.formState.errors.deliveryAddress.zip.message as string}
                  </p>
                ) : null}
              </div>
            ) : null}
            <label className="text-sm font-medium text-slate-700">
              Tip (USD)
              <Input type="number" min={0} step="1" {...form.register("tip", { valueAsNumber: true })} />
            </label>
            {form.formState.errors.tip ? (
              <p className="text-xs text-red-600">{form.formState.errors.tip.message as string}</p>
            ) : null}
            <label className="text-sm font-medium text-slate-700">
              Notes for the kitchen &amp; delivery team
              <textarea
                className="mt-1 w-full rounded-md border border-slate-300 p-2 text-sm"
                rows={3}
                {...form.register("notes")}
              />
            </label>
            {form.formState.errors.notes ? (
              <p className="text-xs text-red-600">{form.formState.errors.notes.message as string}</p>
            ) : null}
            <label className="text-sm font-medium text-slate-700">
              Promo code
              <Input {...form.register("promoCode")} placeholder="SAVE10" />
            </label>
            {form.formState.errors.promoCode ? (
              <p className="text-xs text-red-600">{form.formState.errors.promoCode.message as string}</p>
            ) : null}
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" {...form.register("savePaymentMethod")} /> Save payment method for faster checkout
            </label>
            <Button type="submit" variant="outline" disabled={isLoading}>
              {isLoading ? "Updating..." : "Update totals"}
            </Button>
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
          </form>
        </div>
        {clientSecret && totals && formValues ? (
          <Elements stripe={stripePromise} options={{ clientSecret }}>
            <CheckoutFormInner clientSecret={clientSecret} totals={totals} discount={discount} values={formValues} />
          </Elements>
        ) : (
          <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-600">
            Preparing payment...
          </div>
        )}
      </div>
      <div className="space-y-4">
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Cart</h2>
          <ul className="mt-4 space-y-3 text-sm">
            {cart.items.map((item) => (
              <li key={item.id} className="border-b border-slate-200 pb-3 last:border-none last:pb-0">
                <div className="flex justify-between">
                  <span className="font-medium">{item.item.name}</span>
                  <span>{currencyFormatter.format(Number(item.total))}</span>
                </div>
                <p className="text-xs text-slate-500">Quantity: {item.quantity}</p>
                {item.options.length ? (
                  <ul className="mt-2 text-xs text-slate-500">
                    {item.options.map((option) => (
                      <li key={option.id}>{option.modifierOption.name}</li>
                    ))}
                  </ul>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
