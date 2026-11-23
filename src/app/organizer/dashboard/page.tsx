import Link from "next/link";
import { redirect } from "next/navigation";
import { CalendarDays, CirclePlus, Clock3, ExternalLink, Pencil, Ticket, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { deleteEventAction, moderateEventAction } from "@/app/organizer/events/actions";
import { PendingSubmitButton } from "@/components/ui/pending-submit-button";

const statusStyle: Record<string, string> = {
  draft: "bg-slate-100 text-slate-700",
  pending: "bg-amber-100 text-amber-800",
  published: "bg-emerald-100 text-emerald-800",
  rejected: "bg-rose-100 text-rose-800",
  cancelled: "bg-slate-100 text-slate-600"
};

export default async function OrganizerDashboardPage({ searchParams }: { searchParams: Promise<{ created?: string; updated?: string; deleted?: string; error?: string }> }) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/organizer/dashboard");
  const { data: profile } = await supabase.from("profiles").select("role, full_name").eq("id", user.id).maybeSingle();
  if (!profile || !["organizer", "admin"].includes(profile.role)) redirect("/account");

  let query = supabase.from("events").select("id, slug, title, city, country, starts_at, status, currency, price_from_minor, currency_exponent, created_at").order("created_at", { ascending: false });
  if (profile.role !== "admin") query = query.eq("organizer_id", user.id);
  const { data: events, error } = await query;
  const rows = events ?? [];
  const published = rows.filter((event) => event.status === "published").length;
  const pending = rows.filter((event) => event.status === "pending").length;

  return <main className="min-h-screen bg-[#fffdf9] px-5 py-10 sm:py-14"><div className="mx-auto max-w-6xl">
    <div className="flex flex-wrap items-center justify-between gap-4"><div><Link href="/account" className="text-sm font-bold text-[#6d35e8]">← Your account</Link><p className="mt-6 text-xs font-black uppercase tracking-[.2em] text-[#8a8294]">EventSphere for organizers</p><h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Welcome{profile.full_name ? `, ${profile.full_name.split(" ")[0]}` : " back"}.</h1><p className="mt-2 text-sm text-[#777180]">Create experiences people will remember.</p></div><Link href="/organizer/analytics" className="inline-flex items-center gap-2 rounded-xl border border-[#e9e4ef] bg-white px-4 py-3 text-sm font-bold">View analytics</Link><Link href="/organizer/events/new" className="inline-flex items-center gap-2 rounded-xl bg-[#6d35e8] px-5 py-3 text-sm font-bold text-white shadow-lg shadow-[#6d35e8]/20"><CirclePlus size={18}/> Create event</Link></div>
    {params.created && <div className="mt-7 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">Event saved. It is now in your event list.</div>}
    {params.updated && <div className="mt-7 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">Your event was updated.</div>}
    {params.deleted && <div className="mt-7 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">Event deleted.</div>}
    {params.error && <div role="alert" className="mt-7 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-800">{params.error}</div>}
    <div className="mt-8 grid gap-4 sm:grid-cols-3"><Stat label="Total events" value={rows.length} icon={<CalendarDays size={19}/>} /><Stat label="Published" value={published} icon={<Ticket size={19}/>} /><Stat label="Awaiting review" value={pending} icon={<Clock3 size={19}/>} /></div>
    <section className="mt-10"><div className="mb-5 flex items-end justify-between gap-3"><div><h2 className="text-xl font-black">Your events</h2><p className="mt-1 text-sm text-[#777180]">Manage drafts and track review status.</p></div></div>
      {error ? <div className="rounded-2xl bg-rose-50 p-5 text-sm text-rose-700">Unable to load events: {error.message}. Check that you have run `supabase/organizer.sql`.</div> : rows.length === 0 ? <div className="rounded-3xl border border-dashed border-[#dcd3e8] bg-white px-6 py-16 text-center"><div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f0eaff] text-[#6d35e8]"><CalendarDays size={25}/></div><h3 className="mt-5 text-lg font-black">Your first event starts here</h3><p className="mx-auto mt-2 max-w-md text-sm text-[#777180]">Create an event, save it as a draft or submit it for review.</p><Link href="/organizer/analytics" className="inline-flex items-center gap-2 rounded-xl border border-[#e9e4ef] bg-white px-4 py-3 text-sm font-bold">View analytics</Link><Link href="/organizer/events/new" className="mt-6 inline-flex rounded-xl bg-[#6d35e8] px-5 py-3 text-sm font-bold text-white">Create your first event</Link></div> : <div className="overflow-hidden rounded-2xl border border-[#eee9f2] bg-white">{rows.map((event) => <div key={event.id} className="flex flex-col gap-4 border-b border-[#f0edf3] p-5 last:border-0 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="font-extrabold">{event.title}</h3><span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wide ${statusStyle[event.status] ?? statusStyle.draft}`}>{event.status}</span></div><p className="mt-1 text-sm text-[#777180]">{event.city}, {event.country} · {new Date(event.starts_at).toLocaleString()}</p><p className="mt-1 text-xs text-[#9992a2]">From {new Intl.NumberFormat("en", { style: "currency", currency: event.currency }).format(Number(event.price_from_minor) / 10 ** event.currency_exponent)}</p></div><div className="flex shrink-0 flex-wrap items-center gap-2">{profile.role === "admin" && event.status === "pending" && <form action={moderateEventAction} className="flex gap-2"><input type="hidden" name="id" value={event.id}/><PendingSubmitButton name="status" value="published" pendingText="Publishing..." className="inline-flex min-w-24 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white">Publish</PendingSubmitButton><PendingSubmitButton name="status" value="rejected" pendingText="Rejecting..." className="inline-flex min-w-24 items-center justify-center gap-2 rounded-lg border border-rose-200 px-3 py-2 text-xs font-bold text-rose-700">Reject</PendingSubmitButton></form>}<Link href={`/organizer/events/${event.id}/edit`} className="inline-flex items-center gap-2 rounded-lg border border-[#e9e4ef] px-3 py-2 text-xs font-bold"><Pencil size={14}/> Edit</Link><Link href={`/organizer/events/tickets?event=${event.id}`} className="inline-flex items-center gap-2 rounded-lg border border-[#e9e4ef] px-3 py-2 text-xs font-bold"><Ticket size={14}/> Tickets</Link>{event.status === "published" && <Link href={`/events/${event.slug}`} target="_blank" className="rounded-lg border border-[#e9e4ef] p-2" aria-label="View event"><ExternalLink size={15}/></Link>}<form action={deleteEventAction}><input type="hidden" name="id" value={event.id}/><PendingSubmitButton type="submit" pendingText="Deleting..." aria-label={`Delete ${event.title}`} className="inline-flex size-9 items-center justify-center rounded-lg border border-rose-100 p-2 text-rose-600"><Trash2 size={15}/></PendingSubmitButton></form></div></div>)}</div>}
    </section>
    <p className="mt-8 text-xs leading-6 text-[#928b9a]">Events submitted for review are marked as pending. Only an administrator can publish or reject them. Payment processing and attendee check-in will be added in later milestones.</p>
  </div></main>;
}

function Stat({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return <div className="rounded-2xl border border-[#eee9f2] bg-white p-5"><div className="flex items-center justify-between text-[#777180]"><span className="text-sm font-semibold">{label}</span><span className="text-[#6d35e8]">{icon}</span></div><p className="mt-4 text-3xl font-black">{value}</p></div>;
}
