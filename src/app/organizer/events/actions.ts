"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const categories = ["Music", "Technology", "Business", "Arts", "Food", "Wellness"] as const;
const currencies = ["USD", "GBP", "EUR", "NGN", "CAD", "SGD", "AUD", "KES", "GHS", "ZAR"] as const;

function value(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function toIsoDate(value: string, timezone: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value);
  if (!match) return null;
  const [, year, month, day, hour, minute] = match;
  const targetUtc = Date.UTC(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute));
  let guess = targetUtc;
  try {
    for (let i = 0; i < 4; i += 1) {
      const parts = new Intl.DateTimeFormat("en-GB", {
        timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit",
        hour: "2-digit", minute: "2-digit", hourCycle: "h23"
      }).formatToParts(new Date(guess));
      const part = (type: string) => Number(parts.find((item) => item.type === type)?.value);
      const representedUtc = Date.UTC(part("year"), part("month") - 1, part("day"), part("hour"), part("minute"));
      const adjustment = targetUtc - representedUtc;
      guess += adjustment;
      if (adjustment === 0) break;
    }
  } catch { return null; }
  const result = new Date(guess);
  return Number.isNaN(result.getTime()) ? null : result.toISOString();
}

async function organizerClient() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/organizer/dashboard");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (!profile || !["organizer", "admin"].includes(profile.role)) redirect("/account");
  return { supabase, user, isAdmin: profile.role === "admin" };
}

function parseEvent(formData: FormData) {
  const title = value(formData, "title");
  const category = value(formData, "category");
  const description = value(formData, "description");
  const timezone = value(formData, "timezone") || "UTC";
  const startsAt = toIsoDate(value(formData, "starts_at"), timezone);
  const endsAtRaw = value(formData, "ends_at");
  const endsAt = endsAtRaw ? toIsoDate(endsAtRaw, timezone) : null;
  const venueName = value(formData, "venue_name");
  const address = value(formData, "address");
  const city = value(formData, "city");
  const country = value(formData, "country");
  const countryCode = value(formData, "country_code").toUpperCase();
  const currency = value(formData, "currency").toUpperCase();
  const price = Number(value(formData, "price_from"));
  const imageUrl = value(formData, "image_url");
  const status = value(formData, "intent") === "review" ? "pending" : "draft";
  const slug = title.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  if (title.length < 4 || title.length > 120) throw new Error("Event title must be between 4 and 120 characters.");
  if (!categories.includes(category as (typeof categories)[number])) throw new Error("Choose a valid event category.");
  if (!startsAt || new Date(startsAt) <= new Date()) throw new Error("Choose a valid future start date and time.");
  if (endsAtRaw && (!endsAt || new Date(endsAt) <= new Date(startsAt))) throw new Error("The end time must be after the start time.");
  if (!venueName || !city || !country) throw new Error("Venue, city and country are required.");
  if (!currencies.includes(currency as (typeof currencies)[number])) throw new Error("Choose a supported currency.");
  if (!Number.isFinite(price) || price < 0 || price > 100000000) throw new Error("Enter a valid ticket starting price.");
  if (countryCode && !/^[A-Z]{2}$/.test(countryCode)) throw new Error("Country code must contain two letters.");
  if (description.length > 10000) throw new Error("Description is too long.");
  if (imageUrl && !/^https:\/\//i.test(imageUrl)) throw new Error("Event image must use a secure HTTPS URL.");

  const exponent = ["JPY", "KRW"].includes(currency) ? 0 : 2;
  return {
    slug: `${slug || "event"}-${crypto.randomUUID().slice(0, 8)}`,
    title, category, description, starts_at: startsAt, ends_at: endsAt,
    timezone, venue_name: venueName, address: address || null, city, country,
    country_code: countryCode || null, currency, currency_exponent: exponent,
    price_from_minor: Math.round(price * 10 ** exponent), image_url: imageUrl || null,
    status
  };
}

export async function createEventAction(formData: FormData) {
  const { supabase, user } = await organizerClient();
  let payload;
  try { payload = parseEvent(formData); }
  catch (error) { redirect(`/organizer/events/new?error=${encodeURIComponent(error instanceof Error ? error.message : "Invalid event details")}`); }
  const { error } = await supabase.from("events").insert({ ...payload, organizer_id: user.id });
  if (error) redirect(`/organizer/events/new?error=${encodeURIComponent(error.message)}`);
  redirect("/organizer/dashboard?created=1");
}

export async function updateEventAction(formData: FormData) {
  const { supabase, user, isAdmin } = await organizerClient();
  const id = value(formData, "id");
  let payload;
  try { payload = parseEvent(formData); }
  catch (error) { redirect(`/organizer/events/${id}/edit?error=${encodeURIComponent(error instanceof Error ? error.message : "Invalid event details")}`); }
  const { slug: _newSlug, ...updatePayload } = payload;
  let updateQuery = supabase.from("events").update(updatePayload).eq("id", id);
  if (!isAdmin) updateQuery = updateQuery.eq("organizer_id", user.id);
  const { error } = await updateQuery;
  if (error) redirect(`/organizer/events/${id}/edit?error=${encodeURIComponent(error.message)}`);
  redirect("/organizer/dashboard?updated=1");
}

export async function deleteEventAction(formData: FormData) {
  const { supabase, user, isAdmin } = await organizerClient();
  const id = value(formData, "id");
  let query = supabase.from("events").delete().eq("id", id);
  if (!isAdmin) query = query.eq("organizer_id", user.id);
  const { error } = await query;
  if (error) redirect(`/organizer/dashboard?error=${encodeURIComponent(error.message)}`);
  redirect("/organizer/dashboard?deleted=1");
}

export async function moderateEventAction(formData: FormData) {
  const { supabase, isAdmin } = await organizerClient();
  if (!isAdmin) redirect("/organizer/dashboard");
  const id = value(formData, "id");
  const status = value(formData, "status");
  if (!["published", "rejected", "cancelled"].includes(status)) redirect("/organizer/dashboard?error=Invalid+moderation+status");
  const { error } = await supabase.from("events").update({ status }).eq("id", id);
  if (error) redirect(`/organizer/dashboard?error=${encodeURIComponent(error.message)}`);
  redirect("/organizer/dashboard?updated=1");
}
