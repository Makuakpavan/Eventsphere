-- EventSphere Push Notifications
-- Run after notifications_analytics.sql and all previous migrations.
-- All subscription and delivery queue access is server-only (service role).

create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null unique,
  subscription jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists push_subscriptions_user_idx on public.push_subscriptions(user_id);
alter table public.push_subscriptions enable row level security;
-- No client policies. API routes use authenticated user plus service role.

create table if not exists public.push_outbox (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  event_id uuid references public.events(id) on delete cascade,
  notification_type text not null check (notification_type in ('booking_confirmed','event_reminder')),
  title text not null,
  body text not null,
  url text not null default '/tickets',
  status text not null default 'pending' check (status in ('pending','processing','sent','failed')),
  attempts integer not null default 0,
  last_error text,
  created_at timestamptz not null default now(),
  sent_at timestamptz
);
create index if not exists push_outbox_pending_idx
  on public.push_outbox(status,created_at) where status in ('pending','failed');
alter table public.push_outbox enable row level security;
-- No client policies. Only the server-side service-role processor can access this queue.

-- PostgreSQL UNIQUE constraints treat NULL booking_id values as distinct. Deduplicate
-- old reminder rows, then add a partial unique index so hourly reminder jobs are idempotent.
delete from public.notification_outbox older
using public.notification_outbox newer
where older.notification_type = 'event_reminder'
  and newer.notification_type = 'event_reminder'
  and older.user_id = newer.user_id
  and older.event_id = newer.event_id
  and (older.created_at > newer.created_at
       or (older.created_at = newer.created_at and older.id > newer.id));
create unique index if not exists notification_reminder_dedupe_idx
  on public.notification_outbox(user_id,event_id)
  where notification_type = 'event_reminder';

create or replace function public.queue_push_from_email_notification()
returns trigger language plpgsql security definer set search_path='' as $$
declare event_name text;
begin
  select title into event_name from public.events where id = new.event_id;
  insert into public.push_outbox(user_id,event_id,notification_type,title,body,url)
  values(
    new.user_id,
    new.event_id,
    new.notification_type,
    case when new.notification_type='event_reminder' then 'Your event is coming up' else 'Your booking is confirmed' end,
    case when new.notification_type='event_reminder'
      then coalesce(event_name,'An event') || ' is coming up. Open EventSphere for your ticket details.'
      else 'Your booking for ' || coalesce(event_name,'your event') || ' is confirmed. Your tickets are ready.'
    end,
    '/tickets'
  );
  return new;
end; $$;

drop trigger if exists queue_push_after_notification_insert on public.notification_outbox;
create trigger queue_push_after_notification_insert
after insert on public.notification_outbox
for each row execute function public.queue_push_from_email_notification();

-- Existing notification rows are intentionally not backfilled.
