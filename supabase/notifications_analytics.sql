-- EventSphere M8: notification outbox + organizer analytics.
-- Run after tickets.sql and all earlier migrations.

create table if not exists public.notification_outbox (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 booking_id uuid references public.bookings(id) on delete cascade,
 event_id uuid references public.events(id) on delete cascade,
 notification_type text not null check(notification_type in ('booking_confirmed','event_reminder')),
 status text not null default 'pending' check(status in ('pending','processing','sent','failed')),
 attempts integer not null default 0,
 last_error text,
 sent_at timestamptz,
 created_at timestamptz not null default now(),
 unique(user_id,event_id,notification_type,booking_id)
);
create index if not exists notification_outbox_pending_idx
 on public.notification_outbox(status,created_at) where status in ('pending','failed');
alter table public.notification_outbox enable row level security;
-- No client policies: only the server service-role processor can access this queue.

create or replace function public.queue_booking_confirmation_email()
returns trigger language plpgsql security definer set search_path='' as $$
begin
 if new.status='confirmed' and old.status is distinct from 'confirmed' then
  insert into public.notification_outbox(user_id,booking_id,event_id,notification_type)
  values(new.user_id,new.id,new.event_id,'booking_confirmed')
  on conflict do nothing;
 end if;
 return new;
end; $$;
drop trigger if exists queue_booking_confirmation on public.bookings;
create trigger queue_booking_confirmation after update of status on public.bookings
for each row execute function public.queue_booking_confirmation_email();

-- Run this function hourly using Supabase Cron. It queues one reminder per attendee/event.
create or replace function public.enqueue_event_reminders()
returns integer language plpgsql security definer set search_path='' as $$
declare inserted_count integer;
begin
 insert into public.notification_outbox(user_id,event_id,notification_type)
 select distinct t.user_id,t.event_id,'event_reminder'
 from public.issued_tickets t
 join public.events e on e.id=t.event_id
 where t.status='valid'
   and e.starts_at > now()+interval '23 hours'
   and e.starts_at <= now()+interval '25 hours'
 on conflict do nothing;
 get diagnostics inserted_count = row_count;
 return inserted_count;
end; $$;
revoke all on function public.enqueue_event_reminders() from public,anon,authenticated;

create or replace function public.get_organizer_analytics()
returns table(event_id uuid,event_title text,event_status text,tickets_issued bigint,tickets_checked_in bigint,revenue_minor bigint,currency char(3))
language plpgsql security definer set search_path='' as $$
declare v_role text;
begin
 select role into v_role from public.profiles where id=auth.uid();
 if v_role not in ('organizer','admin') then raise exception 'Organizer access required'; end if;
 return query
 select e.id,e.title,e.status,
  coalesce((select count(*) from public.issued_tickets it where it.event_id=e.id),0)::bigint,
  coalesce((select count(*) from public.issued_tickets it where it.event_id=e.id and it.status='used'),0)::bigint,
  coalesce((select sum(b.total_minor) from public.bookings b where b.event_id=e.id and b.status='confirmed'),0)::bigint,
  e.currency
 from public.events e
 where v_role='admin' or e.organizer_id=auth.uid()
 order by e.created_at desc;
end; $$;
revoke all on function public.get_organizer_analytics() from public,anon;
grant execute on function public.get_organizer_analytics() to authenticated;
