-- EventSphere Milestone 2: public event catalogue
-- Run this in the Supabase SQL Editor.
-- This creates the public event catalogue only. Organizer auth and write policies
-- will be added in the authentication/organizer milestones.

create extension if not exists pgcrypto;

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  organizer_id uuid references auth.users(id) on delete set null,
  slug text not null unique,
  title text not null,
  category text not null check (
    category in ('Music', 'Technology', 'Business', 'Arts', 'Food', 'Wellness')
  ),
  description text not null default '',
  starts_at timestamptz not null,
  ends_at timestamptz,
  timezone text not null default 'UTC',
  venue_name text not null,
  address text,
  city text not null,
  country text not null,
  country_code char(2),
  currency char(3) not null,
  currency_exponent smallint not null default 2 check (currency_exponent between 0 and 3),
  price_from_minor bigint not null default 0 check (price_from_minor >= 0),
  image_url text,
  status text not null default 'draft' check (status in ('draft', 'pending', 'published', 'rejected', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists events_public_listing_idx
  on public.events (starts_at asc)
  where status = 'published';

create index if not exists events_category_idx
  on public.events (category)
  where status = 'published';

create index if not exists events_city_country_idx
  on public.events (city, country)
  where status = 'published';

alter table public.events enable row level security;

drop policy if exists "Anyone can read published events" on public.events;
create policy "Anyone can read published events"
  on public.events
  for select
  to anon, authenticated
  using (status = 'published');

-- Do not add public insert/update/delete policies.
-- Organizer write access must be authorized and validated in a later milestone.
