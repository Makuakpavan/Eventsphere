import Image from "next/image";
import Link from "next/link";
import { MapPin, CalendarDays, ArrowUpRight } from "lucide-react";
import type { EventSummary } from "@/types/event";

const currencyLocales: Record<string, string> = {
  USD: "en-US", GBP: "en-GB", SGD: "en-SG", NGN: "en-NG"
};

function formatPrice(amount: number, currency: string) {
  return new Intl.NumberFormat(currencyLocales[currency] ?? "en", {
    style: "currency",
    currency,
    maximumFractionDigits: 0
  }).format(amount);
}

export function EventCard({ event }: { event: EventSummary }) {
  return (
    <article className="event-card group overflow-hidden rounded-[25px] border border-black/[0.06] bg-white transition hover:-translate-y-1 hover:shadow-xl hover:shadow-[#33205d]/10">
      <Link href={`/events/${event.slug}`} className="block">
        <div className="relative h-[220px] overflow-hidden bg-[#eee8fa]">
          <Image
            src={event.imageUrl}
            alt={event.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="event-image object-cover"
          />
          <span className="absolute left-4 top-4 rounded-full bg-white/95 px-3 py-1.5 text-[11px] font-black uppercase tracking-wider text-[#6d35e8] shadow-sm">
            {event.category}
          </span>
          <span className="absolute bottom-4 right-4 grid size-10 place-items-center rounded-full bg-white text-[#6d35e8] shadow-lg transition group-hover:rotate-45">
            <ArrowUpRight size={19} />
          </span>
        </div>
        <div className="p-5">
          <div className="mb-3 flex items-center gap-2 text-xs font-bold text-[#8a8494]">
            <CalendarDays size={14} className="text-[#ed438d]" /> {event.dateLabel}
          </div>
          <h3 className="mb-3 text-lg font-black leading-snug tracking-[-.4px] text-[#211d2b]">{event.title}</h3>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#777180]">
            <MapPin size={14} className="shrink-0 text-[#ed438d]" />
            {event.venue}, {event.city}
          </div>
          <div className="mt-5 flex items-center justify-between border-t border-black/[0.06] pt-4">
            <span className="text-xs font-semibold text-[#898391]">Tickets from</span>
            <span className="text-base font-black text-[#6d35e8]">{formatPrice(event.priceFrom, event.currency)}</span>
          </div>
        </div>
      </Link>
    </article>
  );
}
