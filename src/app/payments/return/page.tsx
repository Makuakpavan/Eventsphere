import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
export default async function PaymentReturnPage({ searchParams }: { searchParams: Promise<{ booking?: string }> }) {
  const { booking } = await searchParams;
  if (!booking) redirect("/bookings");
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(`/payments/return?booking=${booking}`)}`);
  const { data } = await supabase.from("bookings").select("id,reference,status").eq("id", booking).eq("user_id", user.id).maybeSingle();
  if (!data) redirect("/bookings");
  return <main className="min-h-screen bg-[#fffdf9] px-5 py-16"><section className="mx-auto max-w-xl rounded-3xl border border-black/5 bg-white p-8 text-center"><p className="text-xs font-black uppercase tracking-widest text-[#8b8298]">Payment update</p><h1 className="mt-3 text-3xl font-black">{data.status === "confirmed" ? "You're all set!" : "We're confirming your payment"}</h1><p className="mt-3 text-sm leading-6 text-[#777180]">{data.status === "confirmed" ? "Your payment has been verified and your booking is confirmed." : "Your payment provider has returned you to EventSphere. Confirmation happens securely through the provider webhook; refresh this page in a moment if the status has not updated."}</p><p className="mt-5 font-bold">{data.reference}</p><Link href={`/bookings/${data.id}`} className="mt-7 inline-flex rounded-full bg-[#6d35e8] px-6 py-3 text-sm font-bold text-white">View booking</Link></section></main>;
}
