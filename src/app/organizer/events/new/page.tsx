import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { EventForm } from "@/components/organizer/event-form";

export default async function NewEventPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/organizer/events/new");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (!profile || !["organizer", "admin"].includes(profile.role)) redirect("/account");
  return <main className="min-h-screen bg-[#fffdf9] px-5 py-10 sm:py-14"><div className="mx-auto max-w-3xl"><Link href="/organizer/dashboard" className="text-sm font-bold text-[#6d35e8]">← Back to dashboard</Link><p className="mt-7 text-xs font-black uppercase tracking-[.2em] text-[#8a8294]">Organizer workspace</p><h1 className="mt-2 text-3xl font-black">Create an event</h1><p className="mt-2 text-sm text-[#777180]">Add the details attendees need to discover your experience.</p><div className="mt-8 rounded-3xl border border-[#eee9f2] bg-white p-5 shadow-sm sm:p-8"><EventForm error={error}/></div></div></main>;
}
