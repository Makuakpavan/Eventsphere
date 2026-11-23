-- EventSphere demo catalogue rows.
-- Run after schema.sql. These are sample listings for development only.

insert into public.events (
  slug, title, category, description, starts_at, timezone,
  venue_name, city, country, country_code, currency,
  currency_exponent, price_from_minor, image_url, status
)
values
(
  'afrobeats-under-the-stars', 'Afrobeats Under The Stars', 'Music',
  'A night of live Afrobeats, DJs and unforgettable performances.',
  '2026-12-12T19:00:00+01:00', 'Africa/Lagos',
  'Eko Atlantic', 'Lagos', 'Nigeria', 'NG',
  'USD', 2, 3500,
  'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?auto=format&fit=crop&w=1000&q=85',
  'published'
),
(
  'future-builders-summit', 'Future Builders Summit', 'Technology',
  'A gathering for builders, founders and technology leaders.',
  '2027-01-21T09:00:00Z', 'Europe/London',
  'The Glasshouse', 'London', 'United Kingdom', 'GB',
  'GBP', 2, 4900,
  'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1000&q=85',
  'published'
),
(
  'creative-minds-live', 'Creative Minds Live', 'Arts',
  'An evening celebrating art, design and creative culture.',
  '2027-01-24T16:30:00-05:00', 'America/New_York',
  'The Mission', 'New York', 'United States', 'US',
  'USD', 2, 2800,
  'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1000&q=85',
  'published'
),
(
  'the-founders-table', 'The Founders Table', 'Business',
  'A curated networking dinner for founders and operators.',
  '2027-02-05T18:00:00+08:00', 'Asia/Singapore',
  'Marina Bay', 'Singapore', 'Singapore', 'SG',
  'SGD', 2, 6500,
  'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=1000&q=85',
  'published'
),
(
  'global-food-and-culture-fest', 'Global Food & Culture Fest', 'Food',
  'Discover global flavours, local makers and live performances.',
  '2027-02-13T12:00:00Z', 'America/Toronto',
  'Harbourfront Centre', 'Toronto', 'Canada', 'CA',
  'CAD', 2, 2200,
  'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=1000&q=85',
  'published'
),
(
  'sunrise-wellness-retreat', 'Sunrise Wellness Retreat', 'Wellness',
  'A morning of mindful movement, breathwork and community.',
  '2027-03-06T06:30:00+01:00', 'Africa/Lagos',
  'Lekki Conservation Centre', 'Lagos', 'Nigeria', 'NG',
  'USD', 2, 1800,
  'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=1000&q=85',
  'published'
)
on conflict (slug) do nothing;
