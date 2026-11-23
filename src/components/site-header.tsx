import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, Menu } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/auth/actions";
import { PendingSubmitButton } from "@/components/ui/pending-submit-button";

export async function SiteHeader() {
  let signedIn = false;
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    signedIn = Boolean(user);
  }
  return (
    <header className="relative z-20 border-b border-black/[0.06] bg-white/80 backdrop-blur-xl">
      <div className="container-wide flex h-[76px] items-center justify-between">
        <Link href="/" className="flex shrink-0 items-center" aria-label="EventSphere home">
          <Image
            src="/eventsphere-logo.svg"
            alt="EventSphere"
            width={240}
            height={84}
            priority
            className="h-auto w-[112px] sm:w-[160px]"
          />
        </Link>
        <nav className="hidden items-center gap-8 text-sm font-semibold text-[#625d6d] md:flex">
          <Link className="transition hover:text-[#6d35e8]" href="/events">Discover</Link>
          <Link className="transition hover:text-[#6d35e8]" href="/#categories">Categories</Link>
          <Link className="transition hover:text-[#6d35e8]" href="/#organizers">For organizers</Link>
        </nav>
        <div className="flex items-center gap-3">
          {signedIn ? <><Link href="/account" className="px-3 py-2 text-sm font-bold text-[#282333] hover:text-[#6d35e8]">My account</Link><form action={signOut}><PendingSubmitButton pendingText="Logging out..." className="min-w-24 rounded-full border border-black/10 px-4 py-2.5 text-sm font-bold">Log out</PendingSubmitButton></form></> : <><Link href="/login" className="hidden px-3 py-2 text-sm font-bold text-[#282333] hover:text-[#6d35e8] sm:inline-flex">Log in</Link><Link href="/register" className="inline-flex items-center gap-2 rounded-full bg-[#6d35e8] px-3 py-2.5 text-xs font-bold text-white shadow-lg shadow-violet-200 transition hover:-translate-y-0.5 hover:bg-[#5927cb] sm:px-5 sm:py-3 sm:text-sm">Get started <ArrowUpRight size={16} /></Link></>}
          <button className="grid size-9 place-items-center rounded-full border border-black/10 md:hidden" aria-label="Open menu"><Menu size={19} /></button>
        </div>
      </div>
    </header>
  );
}
