import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { EventExplorer } from "@/components/event-explorer";
import { getPublishedEvents } from "@/lib/supabase/events";

export const metadata = {
  title: "Discover events",
  description: "Search concerts, festivals, conferences, workshops and experiences around the world."
};

export default async function EventsPage() {
  const events = await getPublishedEvents();

  return (
    <main className="min-h-screen">
      <SiteHeader />
      <section className="container-wide py-10 sm:py-14">
        <Link href="/" className="mb-7 inline-flex items-center gap-2 text-sm font-bold text-[#6d35e8]"><ArrowLeft size={16}/> Back home</Link>
        <div className="mb-8">
          <p className="text-xs font-black uppercase tracking-[.2em] text-[#8b7da5]">Find your next experience</p>
          <h1 className="mt-2 text-4xl font-black tracking-[-1.5px] sm:text-5xl">Explore <span className="gradient-text">events.</span></h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-[#777180]">From live music and creative gatherings to global conferences, find something worth showing up for.</p>
        </div>
        <EventExplorer events={events}/>
      </section>
    </main>
  );
}
