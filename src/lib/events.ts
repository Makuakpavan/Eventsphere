import type { EventSummary } from "@/types/event";

export const eventCategories = [
  { name: "Music", emoji: "🎵", color: "bg-pink-100" },
  { name: "Technology", emoji: "💡", color: "bg-violet-100" },
  { name: "Business", emoji: "🚀", color: "bg-orange-100" },
  { name: "Arts", emoji: "🎨", color: "bg-yellow-100" },
  { name: "Food", emoji: "🍜", color: "bg-lime-100" },
  { name: "Wellness", emoji: "🧘", color: "bg-sky-100" }
] as const;

export const featuredEvents: EventSummary[] = [
  {
    id: "demo_evt_001",
    slug: "afrobeats-under-the-stars",
    title: "Afrobeats Under The Stars",
    category: "Music",
    startsAt: "2026-12-12T19:00:00+01:00",
    dateLabel: "Sat, Dec 12 · 7:00 PM",
    venue: "Eko Atlantic",
    city: "Lagos",
    country: "Nigeria",
    priceFrom: 35,
    currency: "USD",
    imageUrl: "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?auto=format&fit=crop&w=1000&q=85",
    featured: true
  },
  {
    id: "demo_evt_002",
    slug: "future-builders-summit",
    title: "Future Builders Summit",
    category: "Technology",
    startsAt: "2027-01-21T09:00:00Z",
    dateLabel: "Thu, Jan 21 · 9:00 AM",
    venue: "The Glasshouse",
    city: "London",
    country: "United Kingdom",
    priceFrom: 49,
    currency: "GBP",
    imageUrl: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1000&q=85"
  },
  {
    id: "demo_evt_003",
    slug: "creative-minds-live",
    title: "Creative Minds Live",
    category: "Arts",
    startsAt: "2027-01-24T16:30:00-05:00",
    dateLabel: "Sun, Jan 24 · 4:30 PM",
    venue: "The Mission",
    city: "New York",
    country: "United States",
    priceFrom: 28,
    currency: "USD",
    imageUrl: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1000&q=85"
  },
  {
    id: "demo_evt_004",
    slug: "the-founders-table",
    title: "The Founders Table",
    category: "Business",
    startsAt: "2027-02-05T18:00:00+08:00",
    dateLabel: "Fri, Feb 05 · 6:00 PM",
    venue: "Marina Bay",
    city: "Singapore",
    country: "Singapore",
    priceFrom: 65,
    currency: "SGD",
    imageUrl: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=1000&q=85"
  },
  {
    id: "demo_evt_005",
    slug: "global-food-and-culture-fest",
    title: "Global Food & Culture Fest",
    category: "Food",
    startsAt: "2027-02-13T12:00:00Z",
    dateLabel: "Sat, Feb 13 · 12:00 PM",
    venue: "Harbourfront Centre",
    city: "Toronto",
    country: "Canada",
    priceFrom: 22,
    currency: "CAD",
    imageUrl: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=1000&q=85"
  },
  {
    id: "demo_evt_006",
    slug: "sunrise-wellness-retreat",
    title: "Sunrise Wellness Retreat",
    category: "Wellness",
    startsAt: "2027-03-06T06:30:00+01:00",
    dateLabel: "Sat, Mar 06 · 6:30 AM",
    venue: "Lekki Conservation Centre",
    city: "Lagos",
    country: "Nigeria",
    priceFrom: 18,
    currency: "USD",
    imageUrl: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=1000&q=85"
  }
];
