import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays, MapPin, Ticket } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { getPublishedEventBySlug } from "@/lib/supabase/events";

export default async function EventDetailsPage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const event = await getPublishedEventBySlug(slug);
  if (!event) notFound();

  return (
    <main className="min-h-screen">
      <SiteHeader />
      <section className="container-wide py-10">
        <Link href="/events" className="mb-7 inline-flex items-center gap-2 text-sm font-bold text-[#6d35e8]"><ArrowLeft size={16}/> All events</Link>
        <div className="grid gap-8 lg:grid-cols-[1.4fr_.8fr]">
          <div>
            <div className="relative h-[300px] overflow-hidden rounded-[30px] sm:h-[440px]">
              <Image src={event.imageUrl} alt={event.title} fill priority sizes="(max-width: 1024px) 100vw, 65vw" className="object-cover"/>
            </div>
            <span className="mt-7 inline-flex rounded-full bg-[#f0e9ff] px-3 py-1.5 text-xs font-black uppercase tracking-wider text-[#6d35e8]">{event.category}</span>
            <h1 className="mt-4 text-4xl font-black tracking-[-1.5px] sm:text-5xl">{event.title}</h1>
            <div className="mt-5 flex flex-wrap gap-5 text-sm font-semibold text-[#777180]">
              <span className="inline-flex items-center gap-2"><CalendarDays size={17}/>{event.dateLabel}</span>
              <span className="inline-flex items-center gap-2"><MapPin size={17}/>{event.venue}, {event.city}, {event.country}</span>
            </div>
            <h2 className="mt-10 text-xl font-black">About this event</h2>
            <p className="mt-3 max-w-2xl leading-7 text-[#777180]">Get ready for an experience worth sharing. Event details, organizer information, venue guidance and attendee updates will be available here as this event is published.</p>
          </div>
          <aside className="h-fit rounded-[28px] border border-black/[0.07] bg-white p-6 shadow-xl shadow-[#33205d]/[0.06]">
            <p className="text-xs font-black uppercase tracking-wider text-[#898391]">Tickets</p>
            <p className="mt-2 text-3xl font-black text-[#6d35e8]">From {new Intl.NumberFormat("en", { style: "currency", currency: event.currency, maximumFractionDigits: 2 }).format(event.priceFrom)}</p>
            <p className="mt-2 text-sm text-[#777180]">Choose your ticket type at checkout.</p>
            <Link href={`/events/${event.slug}/book`} className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-[#6d35e8] px-5 py-4 text-sm font-extrabold text-white"><Ticket size={17}/> Choose tickets</Link>
            <p className="mt-4 text-xs leading-5 text-[#9891a2]">Reserve your tickets now. Payment will be enabled in the next milestone.</p>
          </aside>
        </div>
      </section>
    </main>
  );
}
