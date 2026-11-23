import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { signOut } from "@/app/auth/actions";
import { createClient } from "@/lib/supabase/server";
import { PendingSubmitButton } from "@/components/ui/pending-submit-button";

export default async function AccountPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/account");
  const { data: profile } = await supabase.from("profiles").select("full_name, role, country, created_at").eq("id", user.id).maybeSingle();
  const name = profile?.full_name || user.user_metadata?.full_name || user.email;
  return <main className="min-h-screen bg-[#fffdf9] px-5 py-12"><div className="mx-auto max-w-3xl">
    <Link href="/" aria-label="EventSphere home"><Image src="/eventsphere-logo.svg" alt="EventSphere" width={200} height={70} className="h-auto w-[150px]" /></Link>
    <div className="mt-8 rounded-[30px] bg-white p-8 shadow-xl shadow-[#33205d]/[0.06] sm:p-10">
      <p className="text-sm font-bold uppercase tracking-[.15em] text-[#8b8298]">Your account</p><h1 className="mt-3 text-3xl font-black tracking-tight">Welcome, {name}</h1>
      <p className="mt-2 text-[#777180]">You’re signed in as {user.email}.</p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2"><div className="rounded-2xl bg-[#f6f1ff] p-5"><p className="text-xs font-bold uppercase tracking-wider text-[#7b6a9b]">Account type</p><p className="mt-2 text-xl font-black capitalize">{profile?.role ?? "attendee"}</p></div><div className="rounded-2xl bg-[#fff2f7] p-5"><p className="text-xs font-bold uppercase tracking-wider text-[#9d6a81]">Member since</p><p className="mt-2 text-xl font-black">{new Date(user.created_at).toLocaleDateString(undefined,{month:"long",year:"numeric"})}</p></div></div>
      <div className="mt-8 flex flex-wrap gap-3"><Link href="/events" className="rounded-full bg-[#6d35e8] px-6 py-3 text-sm font-bold text-white">Discover events</Link><Link href="/bookings" className="rounded-full border border-[#e8e5ed] px-6 py-3 text-sm font-bold">My bookings</Link>{profile?.role === "organizer" && <Link href="/organizer/dashboard" className="rounded-full border border-[#e8e5ed] px-6 py-3 text-sm font-bold">Organizer dashboard</Link>}<form action={signOut}><PendingSubmitButton pendingText="Logging out..." className="min-w-32 rounded-full border border-[#e8e5ed] px-6 py-3 text-sm font-bold">Log out</PendingSubmitButton></form></div>
    </div></div></main>;
}
