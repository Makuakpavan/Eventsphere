import { createClient } from "@supabase/supabase-js";
import { featuredEvents } from "@/lib/events";
import type { EventSummary } from "@/types/event";

type EventRow = {
  id: string;
  slug: string;
  title: string;
  category: EventSummary["category"];
  starts_at: string;
  venue_name: string;
  city: string;
  country: string;
  price_from_minor: number;
  currency: string;
  currency_exponent: number;
  image_url: string | null;
  timezone: string;
};

function formatEventDate(value: string, timezone: string) {
  return new Intl.DateTimeFormat("en", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: timezone
  }).format(new Date(value));
}

function mapEvent(row: EventRow): EventSummary {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    category: row.category,
    startsAt: row.starts_at,
    dateLabel: formatEventDate(row.starts_at, row.timezone || "UTC"),
    venue: row.venue_name,
    city: row.city,
    country: row.country,
    priceFrom: Number(row.price_from_minor) / 10 ** row.currency_exponent,
    currency: row.currency,
    imageUrl:
      row.image_url ??
      "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1000&q=85"
  };
}

export async function getPublishedEvents(): Promise<EventSummary[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Keep the project usable before Supabase credentials are configured.
  if (!url || !anonKey) return featuredEvents;

  try {
    const supabase = createClient(url, anonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false
      }
    });

    const { data, error } = await supabase
      .from("events")
      .select(
        "id, slug, title, category, starts_at, venue_name, city, country, price_from_minor, currency, currency_exponent, image_url, timezone"
      )
      .eq("status", "published")
      .gte("starts_at", new Date().toISOString())
      .order("starts_at", { ascending: true })
      .limit(100);

    if (error) {
      console.error("Unable to load published events from Supabase:", error.message);
      return featuredEvents;
    }

    return (data as EventRow[]).map(mapEvent);
  } catch (error) {
    console.error("Event catalogue fallback activated:", error);
    return featuredEvents;
  }
}

export async function getPublishedEventBySlug(slug: string) {
  const events = await getPublishedEvents();
  return events.find((event) => event.slug === slug) ?? null;
}
