export type EventCategory =
  | "Music"
  | "Technology"
  | "Business"
  | "Arts"
  | "Food"
  | "Wellness";

export type EventSummary = {
  id: string;
  slug: string;
  title: string;
  category: EventCategory;
  startsAt: string;
  dateLabel: string;
  venue: string;
  city: string;
  country: string;
  priceFrom: number;
  currency: string;
  imageUrl: string;
  featured?: boolean;
};
