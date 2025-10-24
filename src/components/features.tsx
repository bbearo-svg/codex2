import { CalendarClock, HandPlatter, Truck } from "lucide-react";

const features = [
  {
    icon: HandPlatter,
    title: "Chef-crafted menus",
    description: "Seasonal dishes prepared with sustainable ingredients and customizable modifiers.",
  },
  {
    icon: CalendarClock,
    title: "Precise scheduling",
    description: "Lead times, blackout dates, and capacity rules keep your event perfectly timed.",
  },
  {
    icon: Truck,
    title: "Seamless delivery",
    description: "Professional staff delivers and sets up on site so you can focus on your guests.",
  },
];

export function Features() {
  return (
    <section className="bg-slate-100 px-4 py-16">
      <div className="mx-auto grid max-w-6xl gap-10 sm:grid-cols-3">
        {features.map((feature) => (
          <article key={feature.title} className="rounded-lg bg-white p-6 shadow-sm">
            <feature.icon className="h-12 w-12 text-brand" aria-hidden="true" />
            <h3 className="mt-4 text-xl font-semibold">{feature.title}</h3>
            <p className="mt-2 text-sm text-slate-600">{feature.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
