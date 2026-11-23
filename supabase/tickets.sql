-- EventSphere M7: issue one digital ticket per attendee admission.
-- Run after payments.sql. QR token is a high-entropy bearer credential: do not expose it in public listings.
create extension if not exists pgcrypto;

create table if not exists public.issued_tickets (
 id uuid primary key default gen_random_uuid(),
 booking_id uuid not null references public.bookings(id) on delete restrict,
 booking_item_id uuid not null references public.booking_items(id) on delete restrict,
 event_id uuid not null references public.events(id) on delete restrict,
 user_id uuid not null references auth.users(id) on delete restrict,
 ticket_type_name text not null,
 ticket_code text not null unique default upper(encode(gen_random_bytes(8),'hex')),
 qr_token text not null unique default encode(gen_random_bytes(32),'hex'),
 status text not null default 'valid' check(status in ('valid','used','cancelled')),
 checked_in_at timestamptz,
 created_at timestamptz not null default now()
);
create index if not exists issued_tickets_user_idx on public.issued_tickets(user_id,created_at desc);
create index if not exists issued_tickets_event_idx on public.issued_tickets(event_id,status);
alter table public.issued_tickets enable row level security;
drop policy if exists "Attendees can view own issued tickets" on public.issued_tickets;
create policy "Attendees can view own issued tickets" on public.issued_tickets for select to authenticated using(user_id=auth.uid());
drop policy if exists "Organizers can view event tickets" on public.issued_tickets;
create policy "Organizers can view event tickets" on public.issued_tickets for select to authenticated
using(exists(select 1 from public.events e join public.profiles p on p.id=auth.uid()
 where e.id=event_id and (e.organizer_id=auth.uid() or p.role='admin') and p.role in ('organizer','admin')));

create or replace function public.issue_tickets_for_confirmed_booking()
returns trigger language plpgsql security definer set search_path='' as $$
declare item record; i integer;
begin
 if new.status='confirmed' and old.status is distinct from 'confirmed' then
  for item in select bi.id,bi.ticket_name,bi.quantity from public.booking_items bi where bi.booking_id=new.id loop
   for i in 1..item.quantity loop
    insert into public.issued_tickets(booking_id,booking_item_id,event_id,user_id,ticket_type_name)
    values(new.id,item.id,new.event_id,new.user_id,item.ticket_name);
   end loop;
  end loop;
 end if;
 return new;
end; $$;
drop trigger if exists issue_tickets_after_confirmation on public.bookings;
create trigger issue_tickets_after_confirmation after update of status on public.bookings
for each row execute function public.issue_tickets_for_confirmed_booking();

-- Organizer/admin check-in. QR token is checked server-side and tickets can only be used once.
create or replace function public.check_in_ticket(p_qr_token text)
returns table(ticket_code text,ticket_type_name text,event_title text,status text,checked_in_at timestamptz)
language plpgsql security definer set search_path='' as $$
declare t public.issued_tickets%rowtype; e public.events%rowtype; v_role text;
begin
 select role into v_role from public.profiles where id=auth.uid();
 if v_role not in ('organizer','admin') then raise exception 'Organizer access required'; end if;
 select * into t from public.issued_tickets where qr_token=p_qr_token for update;
 if not found then raise exception 'Ticket not found'; end if;
 select * into e from public.events where id=t.event_id;
 if v_role<>'admin' and e.organizer_id<>auth.uid() then raise exception 'You cannot check in tickets for this event'; end if;
 if t.status='used' then raise exception 'Ticket has already been checked in'; end if;
 if t.status<>'valid' then raise exception 'Ticket is not valid'; end if;
 update public.issued_tickets set status='used',checked_in_at=now() where id=t.id returning * into t;
 return query select t.ticket_code,t.ticket_type_name,e.title,t.status,t.checked_in_at;
end; $$;
revoke all on function public.check_in_ticket(text) from public,anon;
grant execute on function public.check_in_ticket(text) to authenticated;
