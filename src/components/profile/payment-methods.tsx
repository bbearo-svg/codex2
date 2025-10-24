import type { Stripe } from "stripe";

export default function PaymentMethods({ paymentMethods }: { paymentMethods: Stripe.PaymentMethod[] }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">Saved payment methods</h2>
      {paymentMethods.length === 0 ? (
        <p className="mt-4 text-sm text-slate-600">No saved cards yet. Save a card during checkout for faster ordering.</p>
      ) : (
        <ul className="mt-4 space-y-3 text-sm">
          {paymentMethods.map((method) => (
            <li key={method.id} className="rounded border border-slate-200 px-4 py-3">
              <div className="flex justify-between">
                <span className="font-medium">{method.card?.brand?.toUpperCase()} •••• {method.card?.last4}</span>
                <span className="text-xs text-slate-500">Exp {method.card?.exp_month}/{method.card?.exp_year}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
