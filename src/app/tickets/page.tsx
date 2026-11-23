import Link from "next/link";
import QRCode from "qrcode";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function TicketsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: tickets, error } = await supabase.from("issued_tickets")
    .select("id,ticket_code,qr_token,ticket_type_name,status,checked_in_at,created_at,event_id,events(title,slug,starts_at,venue_name,city,country)")
    .eq("user_id", user.id).order("created_at", { ascending: false });
  if (error) throw new Error("Unable to load your tickets. Ensure supabase/tickets.sql has been applied.");
  const cards = await Promise.all((tickets ?? []).map(async (ticket: any) => ({
    ...ticket,
    qr: await QRCode.toDataURL(`${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/check-in?token=${ticket.qr_token}`, { width: 240, margin: 1, errorCorrectionLevel: "M" })
  })));
  return <main className="min-h-screen bg-[#fffdf9] px-5 py-12"><div className="mx-auto max-w-5xl">
    <Link href="/bookings" className="text-sm font-bold text-[#6d35e8]">← My bookings</Link>
    <h1 className="mt-5 text-3xl font-black">My digital tickets</h1>
    <p className="mt-2 text-sm text-[#777180]">Show the QR code at the event entrance. Each ticket admits one person.</p>
    {cards.length ? <div className="mt-8 grid gap-5 md:grid-cols-2">{cards.map((ticket: any) => <article key={ticket.id} className="rounded-3xl border border-black/5 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-widest text-[#8b8298]">{ticket.ticket_type_name}</p><h2 className="mt-2 text-xl font-black">{ticket.events?.title ?? "Event"}</h2><p className="mt-1 text-sm text-[#777180]">{ticket.events?.venue_name}, {ticket.events?.city}</p></div><span className={`rounded-full px-3 py-1 text-xs font-bold ${ticket.status==="valid"?"bg-emerald-50 text-emerald-700":"bg-slate-100 text-slate-600"}`}>{ticket.status}</span></div>
      <div className="mt-5 flex flex-wrap items-center gap-5"><img src={ticket.qr} alt={`QR code for ticket ${ticket.ticket_code}`} width="160" height="160"/><div><p className="text-xs text-[#8b8298]">Ticket code</p><p className="font-mono text-lg font-black">{ticket.ticket_code}</p><p className="mt-3 text-xs text-[#8b8298]">Issued {new Date(ticket.created_at).toLocaleDateString()}</p>{ticket.checked_in_at && <p className="mt-2 text-xs font-bold text-emerald-700">Checked in {new Date(ticket.checked_in_at).toLocaleString()}</p>}</div></div>
      <p className="mt-4 text-xs text-[#777180]">Keep this QR code private. It is your admission credential.</p>
    </article>)}</div> : <div className="mt-8 rounded-2xl border border-dashed border-black/15 p-10 text-center"><p className="font-bold">No tickets issued yet</p><p className="mt-2 text-sm text-[#777180]">Tickets appear here after your payment is confirmed.</p><Link href="/events" className="mt-5 inline-flex rounded-full bg-[#6d35e8] px-5 py-3 text-sm font-bold text-white">Explore events</Link></div>}
  </div></main>;
}
