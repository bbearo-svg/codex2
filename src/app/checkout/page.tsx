import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import CheckoutForm from "@/components/checkout/checkout-form";

export default async function CheckoutPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/auth/login?callbackUrl=/checkout");
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-10">
      <div>
        <h1 className="text-3xl font-semibold text-slate-900">Checkout</h1>
        <p className="mt-2 text-sm text-slate-600">Confirm your event details and securely submit payment.</p>
      </div>
      <CheckoutForm />
    </div>
  );
}
