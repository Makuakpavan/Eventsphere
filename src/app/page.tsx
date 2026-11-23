import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ArrowUpRight, Globe2, Sparkles, Ticket, Search } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { CategoryStrip } from "@/components/category-strip";
import { FeaturedEvents } from "@/components/featured-events";

export default function HomePage() {
  return (
    <main className="page-shell">
      <SiteHeader />

      <section className="container-wide relative pt-10 sm:pt-16">
        <div className="hero-orb soft-shadow relative overflow-hidden rounded-[34px] px-6 py-12 sm:px-12 sm:py-16 lg:px-16">
          <div className="pointer-events-none absolute -right-16 -top-24 size-80 rounded-full border-[1px] border-white/40" />
          <div className="pointer-events-none absolute -right-2 top-10 size-52 rounded-full border-[1px] border-white/40" />
          <div className="relative z-10 max-w-[690px]">
            <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/45 px-4 py-2 text-xs font-extrabold text-[#54318c] backdrop-blur">
              <Sparkles size={14} /> YOUR NEXT GREAT STORY STARTS HERE
            </span>
            <h1 className="max-w-[680px] text-[clamp(3rem,7vw,5.8rem)] font-black leading-[.98] tracking-[-.075em] text-[#211832]">
              Show Up <br /><span className="text-[#6d35e8]">Stand</span> <span className="text-[#C02BD8]">out</span><br /> Celebrate !!!.
            </h1>
            <p className="mt-6 max-w-[510px] text-base leading-7 text-[#51465f] sm:text-lg">
              Find your next concert, creative meetup, big idea or unforgettable night. The world is full of things to experience.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/events" className="inline-flex items-center gap-2 rounded-full bg-[#211832] px-6 py-4 text-sm font-extrabold text-white shadow-xl transition hover:-translate-y-1 hover:bg-[#39245c]">
                Explore events <ArrowUpRight size={17}/>
              </Link>
              <Link href="/register?role=organizer" className="inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/50 px-6 py-4 text-sm font-extrabold text-[#39245c] backdrop-blur transition hover:bg-white">
                Host an event <ArrowRight size={16}/>
              </Link>
            </div>
            <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3 text-xs font-bold text-[#5f526d]">
              <span className="inline-flex items-center gap-2"><Globe2 size={15}/> Discover worldwide</span>
              <span className="inline-flex items-center gap-2"><Ticket size={15}/> Simple, secure booking</span>
            </div>
          </div>

          <div className="relative mt-10 grid grid-cols-2 gap-3 sm:absolute sm:bottom-10 sm:right-10 sm:mt-0 sm:w-[34%] sm:max-w-[360px]">
            <div className="relative mt-8 aspect-[4/5] overflow-hidden rounded-[24px] border-4 border-white/60 shadow-2xl sm:mt-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=700&q=85" alt="Crowd enjoying a live music event" className="h-full w-full object-cover"/>
            </div>
            <div className="relative -mb-4 aspect-[4/5] overflow-hidden rounded-[24px] border-4 border-white/60 shadow-2xl sm:mb-8">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=700&q=85" alt="People connecting at a creative event" className="h-full w-full object-cover"/>
            </div>
          </div>
        </div>
      </section>

      <section className="container-wide -mt-1 pt-8">
        <div className="soft-shadow mx-auto grid max-w-[900px] gap-3 rounded-[22px] border border-black/[0.05] bg-white p-3 sm:grid-cols-[1.3fr_1fr_auto] sm:items-center">
          <label className="flex items-center gap-3 rounded-2xl bg-[#f8f6fb] px-4 py-3">
            <Search size={19} className="text-[#8c7da7]"/>
            <span className="min-w-0 flex-1">
              <span className="block text-[10px] font-black uppercase tracking-wider text-[#9891a2]">What are you looking for?</span>
              <input aria-label="Search events" placeholder="Concerts, workshops, festivals..." className="w-full bg-transparent text-sm font-bold text-[#292434] outline-none placeholder:font-medium placeholder:text-[#aaa4b1]"/>
            </span>
          </label>
          <label className="flex items-center gap-3 rounded-2xl bg-[#f8f6fb] px-4 py-3">
            <Globe2 size={19} className="text-[#8c7da7]"/>
            <span className="min-w-0 flex-1">
              <span className="block text-[10px] font-black uppercase tracking-wider text-[#9891a2]">Where?</span>
              <input aria-label="Event location" placeholder="City or anywhere" className="w-full bg-transparent text-sm font-bold text-[#292434] outline-none placeholder:font-medium placeholder:text-[#aaa4b1]"/>
            </span>
          </label>
          <Link href="/events" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#6d35e8] px-6 py-4 text-sm font-extrabold text-white transition hover:bg-[#5927cb]">Find events <ArrowRight size={16}/></Link>
        </div>
      </section>

      <CategoryStrip />
      <FeaturedEvents />

      <section id="organizers" className="container-wide pb-20">
        <div className="relative overflow-hidden rounded-[30px] bg-[#211832] px-7 py-10 text-white sm:px-12 sm:py-14">
          <div className="absolute -right-10 -top-28 size-72 rounded-full bg-[#6d35e8]/50 blur-3xl"/>
          <div className="relative z-10 max-w-[650px]">
            <span className="text-xs font-black uppercase tracking-[.2em] text-[#d4bfff]">For event creators</span>
            <h2 className="mt-3 text-3xl font-black tracking-[-1.5px] sm:text-4xl">You create the moment. <span className="text-[#e7c9ff]">We bring the crowd.</span></h2>
            <p className="mt-4 max-w-lg leading-7 text-white/65">Publish your event, manage ticket sales and welcome your guests — all from one simple workspace.</p>
            <Link href="/register?role=organizer" className="mt-7 inline-flex items-center gap-2 rounded-full bg-[#d9f66f] px-6 py-3.5 text-sm font-black text-[#211832] transition hover:-translate-y-1">Start organizing <ArrowUpRight size={17}/></Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-black/[0.06] py-8">
        <div className="container-wide flex flex-col justify-between gap-3 text-xs font-semibold text-[#898391] sm:flex-row sm:items-center">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-5">
            <Link href="/" aria-label="EventSphere home"><Image src="/eventsphere-logo.svg" alt="EventSphere" width={160} height={56} className="h-auto w-[120px]" /></Link>
            <span>© {new Date().getFullYear()} EventSphere. Find your next great experience.</span>
          </div>
          <span>Discover · Connect · Experience</span>
        </div>
      </footer>
    </main>
  );
}
