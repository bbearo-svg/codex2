import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Features } from "@/components/features";

export default function LandingPage() {
  return (
    <div className="bg-white">
      <section className="relative overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1600&q=80"
          alt="Catering"
          width={1600}
          height={900}
          className="h-[500px] w-full object-cover"
          priority
        />
        <div className="absolute inset-0 bg-black/50" aria-hidden="true" />
        <div className="absolute inset-0 flex items-center justify-center px-4">
          <div className="max-w-3xl text-center text-white">
            <h1 className="text-4xl font-bold sm:text-5xl">Elevate every gathering.</h1>
            <p className="mt-4 text-lg">
              Thoughtfully prepared menus, dedicated event coordination, and seamless delivery for
              corporate and social events across the city.
            </p>
            <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link href="/menu">Explore Menu</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="bg-white/90 text-slate-900">
                <Link href="/auth/register">Create an Account</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
      <Features />
      <section className="bg-brand px-4 py-16 text-brand-foreground">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-semibold">Ready for your next event?</h2>
          <p className="mt-4 text-lg">
            Tell us about your event and we&apos;ll craft a tailored menu with precise scheduling to
            keep everything on time.
          </p>
          <Button asChild className="mt-6 bg-white text-brand hover:bg-brand-foreground/80">
            <Link href="/menu">Build Your Order</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
