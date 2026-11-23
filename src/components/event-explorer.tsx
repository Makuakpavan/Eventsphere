 "use client";

import { useMemo, useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { EventCard } from "@/components/event-card";
import { eventCategories } from "@/lib/events";
import type { EventSummary } from "@/types/event";

type DateFilter = "any" | "today" | "week" | "month";

export function EventExplorer({ events }: { events: EventSummary[] }) {
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("");
  const [category, setCategory] = useState("All categories");
  const [currency, setCurrency] = useState("All currencies");
  const [dateFilter, setDateFilter] = useState<DateFilter>("any");
  const [sort, setSort] = useState("soonest");

  const filteredEvents = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const normalizedLocation = location.trim().toLowerCase();
    const now = new Date();
    const endOfToday = new Date(now);
    endOfToday.setHours(23, 59, 59, 999);
    const endOfWeek = new Date(now);
    endOfWeek.setDate(now.getDate() + 7);
    const endOfMonth = new Date(now);
    endOfMonth.setDate(now.getDate() + 30);

    const result = events.filter((event) => {
      const searchable = `${event.title} ${event.category} ${event.venue} ${event.city} ${event.country}`.toLowerCase();
      const matchesQuery = !normalizedQuery || searchable.includes(normalizedQuery);
      const matchesLocation =
        !normalizedLocation ||
        `${event.city} ${event.country} ${event.venue}`.toLowerCase().includes(normalizedLocation);
      const matchesCategory = category === "All categories" || event.category === category;
      const matchesCurrency = currency === "All currencies" || event.currency === currency;
      const startsAt = new Date(event.startsAt);
      const matchesDate =
        dateFilter === "any" ||
        (dateFilter === "today" && startsAt >= now && startsAt <= endOfToday) ||
        (dateFilter === "week" && startsAt >= now && startsAt <= endOfWeek) ||
        (dateFilter === "month" && startsAt >= now && startsAt <= endOfMonth);

      return matchesQuery && matchesLocation && matchesCategory && matchesCurrency && matchesDate;
    });

    return result.sort((a, b) => {
      if (sort === "price-low") return a.priceFrom - b.priceFrom;
      if (sort === "price-high") return b.priceFrom - a.priceFrom;
      if (sort === "name") return a.title.localeCompare(b.title);
      return new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime();
    });
  }, [events, query, location, category, currency, dateFilter, sort]);

  const clearFilters = () => {
    setQuery("");
    setLocation("");
    setCategory("All categories");
    setCurrency("All currencies");
    setDateFilter("any");
    setSort("soonest");
  };

  const hasFilters =
    query.length > 0 ||
    location.length > 0 ||
    category !== "All categories" ||
    currency !== "All currencies" ||
    dateFilter !== "any";

  return (
    <div>
      <div className="rounded-[26px] border border-black/[0.06] bg-white p-4 shadow-xl shadow-[#33205d]/[0.05] sm:p-5">
        <div className="grid gap-3 lg:grid-cols-[1.4fr_1fr_1fr]">
          <label className="flex min-w-0 items-center gap-3 rounded-2xl bg-[#f8f6fb] px-4 py-3">
            <Search size={18} className="shrink-0 text-[#8c7da7]" />
            <span className="min-w-0 flex-1">
              <span className="block text-[10px] font-black uppercase tracking-wider text-[#9891a2]">Search events</span>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Event, category, venue..."
                className="w-full bg-transparent text-sm font-bold outline-none placeholder:font-medium placeholder:text-[#aaa4b1]"
              />
            </span>
            {query && <button onClick={() => setQuery("")} aria-label="Clear search"><X size={15}/></button>}
          </label>

          <label className="flex min-w-0 items-center gap-3 rounded-2xl bg-[#f8f6fb] px-4 py-3">
            <span className="min-w-0 flex-1">
              <span className="block text-[10px] font-black uppercase tracking-wider text-[#9891a2]">Location</span>
              <input
                value={location}
                onChange={(event) => setLocation(event.target.value)}
                placeholder="City or country"
                className="w-full bg-transparent text-sm font-bold outline-none placeholder:font-medium placeholder:text-[#aaa4b1]"
              />
            </span>
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex min-w-0 flex-col justify-center rounded-2xl bg-[#f8f6fb] px-4 py-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-[#9891a2]">Category</span>
              <select value={category} onChange={(event) => setCategory(event.target.value)} className="w-full bg-transparent py-1 text-sm font-bold text-[#292434] outline-none">
                <option>All categories</option>
                {eventCategories.map((item) => <option key={item.name}>{item.name}</option>)}
              </select>
            </label>
            <label className="flex min-w-0 flex-col justify-center rounded-2xl bg-[#f8f6fb] px-4 py-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-[#9891a2]">Currency</span>
              <select value={currency} onChange={(event) => { setCurrency(event.target.value); if (event.target.value === "All currencies" && sort.startsWith("price")) setSort("soonest"); }} className="w-full bg-transparent py-1 text-sm font-bold text-[#292434] outline-none">
                <option>All currencies</option>
                {[...new Set(events.map((item) => item.currency))].sort().map((code) => <option key={code}>{code}</option>)}
              </select>
            </label>
          </div>
        </div>

        <div className="mt-3 flex flex-col gap-3 border-t border-black/[0.06] pt-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-1 inline-flex items-center gap-1 text-xs font-bold text-[#898391]"><SlidersHorizontal size={14}/> Date:</span>
            {([
              ["any", "Any time"],
              ["today", "Today"],
              ["week", "Next 7 days"],
              ["month", "Next 30 days"]
            ] as const).map(([value, label]) => (
              <button
                key={value}
                onClick={() => setDateFilter(value)}
                className={`rounded-full px-3 py-2 text-xs font-bold transition ${dateFilter === value ? "bg-[#6d35e8] text-white" : "bg-[#f4f1f8] text-[#70697c] hover:bg-[#ece5fa]"}`}
              >
                {label}
              </button>
            ))}
          </div>

          <label className="flex items-center gap-2 text-xs font-bold text-[#898391]">
            Sort by
            <select value={sort} onChange={(event) => setSort(event.target.value)} className="rounded-full bg-[#f4f1f8] px-3 py-2 text-xs font-bold text-[#292434] outline-none">
              <option value="soonest">Soonest</option>
              <option value="price-low" disabled={currency === "All currencies"}>Price: low to high (select currency)</option>
              <option value="price-high" disabled={currency === "All currencies"}>Price: high to low (select currency)</option>
              <option value="name">Event name</option>
            </select>
          </label>
        </div>
      </div>

      <div className="mb-5 mt-8 flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-[#777180]">
          <strong className="text-[#211d2b]">{filteredEvents.length}</strong> {filteredEvents.length === 1 ? "event" : "events"} found
        </p>
        {hasFilters && <button onClick={clearFilters} className="text-xs font-extrabold text-[#6d35e8] hover:underline">Clear filters</button>}
      </div>

      {filteredEvents.length > 0 ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filteredEvents.map((event) => <EventCard key={event.id} event={event}/>)}
        </div>
      ) : (
        <div className="rounded-[28px] border border-dashed border-[#d8cde9] bg-white px-6 py-16 text-center">
          <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-[#f0e9ff] text-2xl">🔎</div>
          <h2 className="mt-5 text-xl font-black">No events found</h2>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[#777180]">Try another search term, location or date range. New experiences are being added all the time.</p>
          <button onClick={clearFilters} className="mt-5 rounded-full bg-[#6d35e8] px-5 py-3 text-sm font-extrabold text-white">Reset filters</button>
        </div>
      )}
    </div>
  );
}
