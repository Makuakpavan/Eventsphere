import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { EventForm } from "@/components/organizer/event-form";

export default async function EditEventPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string }> }) {
  const [{ id }, { error }] = await Promise.all([params, searchParams]);
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/organizer/events/${id}/edit`);
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (!profile || !["organizer", "admin"].includes(profile.role)) redirect("/account");
  const { data: event } = await supabase.from("events").select("id, title, category, description, starts_at, ends_at, timezone, venue_name, address, city, country, country_code, currency, price_from_minor, currency_exponent, image_url, organizer_id").eq("id", id).maybeSingle();
  if (!event || (profile.role !== "admin" && event.organizer_id !== user.id)) notFound();
  return <main className="min-h-screen bg-[#fffdf9] px-5 py-10 sm:py-14"><div className="mx-auto max-w-3xl"><Link href="/organizer/dashboard" className="text-sm font-bold text-[#6d35e8]">← Back to dashboard</Link><p className="mt-7 text-xs font-black uppercase tracking-[.2em] text-[#8a8294]">Organizer workspace</p><h1 className="mt-2 text-3xl font-black">Edit event</h1><p className="mt-2 text-sm text-[#777180]">Update your event information. Changes to submitted events return them to draft or review.</p><div className="mt-8 rounded-3xl border border-[#eee9f2] bg-white p-5 shadow-sm sm:p-8"><EventForm error={error} initial={{ ...event, price_from: Number(event.price_from_minor) / 10 ** event.currency_exponent }}/></div></div></main>;
}
