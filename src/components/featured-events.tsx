import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { featuredEvents } from "@/lib/events";
import { EventCard } from "@/components/event-card";

export function FeaturedEvents() {
  return (
    <section id="discover" className="container-wide py-10 sm:py-16">
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <p className="mb-2 text-xs font-black uppercase tracking-[.2em] text-[#8b7da5]">Handpicked for you</p>
          <h2 className="text-3xl font-black tracking-[-1.5px] sm:text-4xl">Events worth <span className="gradient-text">showing up for.</span></h2>
          <p className="mt-2 text-sm text-[#777180]">Fresh experiences, big ideas and unforgettable nights.</p>
        </div>
        <Link href="/events" className="hidden items-center gap-2 text-sm font-extrabold text-[#6d35e8] sm:inline-flex">Explore all <ArrowRight size={16}/></Link>
      </div>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {featuredEvents.map((event) => <EventCard key={event.id} event={event} />)}
      </div>
      <Link href="/events" className="mt-7 inline-flex items-center gap-2 rounded-full border border-[#6d35e8]/20 px-5 py-3 text-sm font-extrabold text-[#6d35e8] sm:hidden">Explore all events <ArrowRight size={16}/></Link>
    </section>
  );
}
