import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import ProfileForm from "@/components/profile/profile-form";
import AddressesPanel from "@/components/profile/addresses-panel";
import PaymentMethods from "@/components/profile/payment-methods";
import { stripe } from "@/lib/stripe";

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/auth/login?callbackUrl=/dashboard/profile");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { addresses: true },
  });

  if (!user) {
    redirect("/");
  }

  const paymentMethods = user.stripeCustomerId
    ? await stripe.paymentMethods.list({ customer: user.stripeCustomerId, type: "card" })
    : { data: [] };

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-10">
      <div>
        <h1 className="text-3xl font-semibold text-slate-900">Account settings</h1>
        <p className="mt-2 text-sm text-slate-600">Update your contact information and saved delivery addresses.</p>
      </div>
      <ProfileForm user={user} />
      <AddressesPanel addresses={user.addresses} />
      <PaymentMethods paymentMethods={paymentMethods.data} />
    </div>
  );
}
