import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function OrganizerAnalyticsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/organizer/analytics");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (!profile || !["organizer", "admin"].includes(profile.role)) redirect("/account");
  const { data: rows, error } = await supabase.rpc("get_organizer_analytics");
  const events = rows ?? [];
  const totalTickets = events.reduce((sum: number, row: any) => sum + Number(row.tickets_issued), 0);
  const totalCheckins = events.reduce((sum: number, row: any) => sum + Number(row.tickets_checked_in), 0);
  const totalRevenue = events.reduce((sum: number, row: any) => sum + Number(row.revenue_minor), 0);
  const currencies = [...new Set(events.map((row: any) => row.currency))];
  return <main className="min-h-screen bg-[#fffdf9] px-5 py-10 sm:py-14"><div className="mx-auto max-w-6xl">
    <Link href="/organizer/dashboard" className="text-sm font-bold text-[#6d35e8]">← Organizer dashboard</Link>
    <p className="mt-6 text-xs font-black uppercase tracking-[.2em] text-[#8a8294]">Performance overview</p><h1 className="mt-2 text-3xl font-black sm:text-4xl">Event analytics</h1>
    <p className="mt-2 text-sm text-[#777180]">Ticket sales, confirmed booking revenue and admission check-ins.</p>
    {error ? <div className="mt-8 rounded-xl bg-rose-50 p-4 text-sm text-rose-700">Unable to load analytics. Run `supabase/notifications_analytics.sql` and try again.</div> : <>
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <Stat label="Tickets issued" value={totalTickets.toLocaleString()} />
        <Stat label="Checked in" value={totalCheckins.toLocaleString()} />
        <Stat label="Confirmed revenue" value={currencies.length === 1 ? new Intl.NumberFormat("en",{style:"currency",currency:currencies[0] as string}).format(totalRevenue/100) : `${currencies.length} currencies`} />
      </div>
      <section className="mt-10 overflow-hidden rounded-2xl border border-[#eee9f2] bg-white"><div className="border-b border-[#f0edf3] p-5"><h2 className="font-black">Event performance</h2></div>
        {events.length ? <div className="divide-y divide-[#f0edf3]">{events.map((row:any)=><div key={row.event_id} className="grid gap-3 p-5 sm:grid-cols-[2fr_1fr_1fr_1fr] sm:items-center"><div><p className="font-extrabold">{row.event_title}</p><p className="mt-1 text-xs capitalize text-[#777180]">{row.event_status}</p></div><Metric label="Tickets" value={Number(row.tickets_issued).toLocaleString()}/><Metric label="Check-ins" value={Number(row.tickets_checked_in).toLocaleString()}/><Metric label="Revenue" value={new Intl.NumberFormat("en",{style:"currency",currency:row.currency}).format(Number(row.revenue_minor)/100)}/></div>)}</div> : <p className="p-8 text-sm text-[#777180]">Your event performance will appear here once you have events and bookings.</p>}
      </section>
    </>}
  </div></main>;
}
function Stat({label,value}:{label:string;value:string}){return <div className="rounded-2xl border border-[#eee9f2] bg-white p-5"><p className="text-sm text-[#777180]">{label}</p><p className="mt-2 text-2xl font-black">{value}</p></div>}
function Metric({label,value}:{label:string;value:string}){return <div><p className="text-xs text-[#8b8298]">{label}</p><p className="mt-1 font-black">{value}</p></div>}
