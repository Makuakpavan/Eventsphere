-- EventSphere M5: ticket types, inventory and atomic reservations.
-- Run after schema.sql, auth.sql and organizer.sql.
create extension if not exists pgcrypto;
create table if not exists public.ticket_types (
 id uuid primary key default gen_random_uuid(), event_id uuid not null references public.events(id) on delete cascade,
 name text not null check(char_length(name) between 2 and 80), description text not null default '',
 price_minor bigint not null check(price_minor >= 0), quantity_total integer not null check(quantity_total > 0),
 quantity_sold integer not null default 0 check(quantity_sold >= 0 and quantity_sold <= quantity_total),
 sales_start timestamptz, sales_end timestamptz, max_per_order integer not null default 6 check(max_per_order between 1 and 20),
 is_active boolean not null default true, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 check(sales_start is null or sales_end is null or sales_end > sales_start)
);
create index if not exists ticket_types_event_idx on public.ticket_types(event_id,is_active);
create table if not exists public.bookings (
 id uuid primary key default gen_random_uuid(), reference text not null unique default ('ES-'||upper(substr(encode(gen_random_bytes(8),'hex'),1,12))),
 user_id uuid not null references auth.users(id) on delete restrict, event_id uuid not null references public.events(id) on delete restrict,
 status text not null default 'pending' check(status in ('pending','confirmed','cancelled','expired')),
 currency char(3) not null, currency_exponent smallint not null default 2 check(currency_exponent between 0 and 3), total_minor bigint not null check(total_minor >= 0),
 expires_at timestamptz not null default(now()+interval '15 minutes'), created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index if not exists bookings_user_idx on public.bookings(user_id,created_at desc);
create index if not exists bookings_expiry_idx on public.bookings(expires_at) where status='pending';
create table if not exists public.booking_items (
 id uuid primary key default gen_random_uuid(), booking_id uuid not null references public.bookings(id) on delete cascade,
 ticket_type_id uuid not null references public.ticket_types(id) on delete restrict, ticket_name text not null,
 unit_price_minor bigint not null check(unit_price_minor>=0), quantity integer not null check(quantity between 1 and 20),
 line_total_minor bigint not null check(line_total_minor>=0)
);
create index if not exists booking_items_booking_idx on public.booking_items(booking_id);
alter table public.ticket_types enable row level security;
alter table public.bookings enable row level security;
alter table public.booking_items enable row level security;
drop policy if exists "Public can view active tickets for published events" on public.ticket_types;
create policy "Public can view active tickets for published events" on public.ticket_types for select to anon,authenticated
using(is_active and exists(select 1 from public.events e where e.id=event_id and e.status='published'));
drop policy if exists "Organizers manage ticket types for their events" on public.ticket_types;
create policy "Organizers manage ticket types for their events" on public.ticket_types for all to authenticated
using(exists(select 1 from public.events e join public.profiles p on p.id=auth.uid() where e.id=event_id and (e.organizer_id=auth.uid() or p.role='admin') and p.role in('organizer','admin')))
with check(exists(select 1 from public.events e join public.profiles p on p.id=auth.uid() where e.id=event_id and (e.organizer_id=auth.uid() or p.role='admin') and p.role in('organizer','admin')));
drop policy if exists "Users can view their bookings" on public.bookings;
create policy "Users can view their bookings" on public.bookings for select to authenticated using(user_id=auth.uid());
drop policy if exists "Users can view items in their bookings" on public.booking_items;
create policy "Users can view items in their bookings" on public.booking_items for select to authenticated
using(exists(select 1 from public.bookings b where b.id=booking_id and b.user_id=auth.uid()));

-- A single transactional RPC with row-level locks prevents overselling.
create or replace function public.reserve_event_tickets(p_event_id uuid,p_items jsonb) returns uuid
language plpgsql security definer set search_path='' as $$
declare v_user uuid:=auth.uid(); v_currency char(3); v_exponent smallint; v_booking uuid; v_total bigint:=0; v_item jsonb; v_ticket public.ticket_types%rowtype; v_qty integer;
begin
 if v_user is null then raise exception 'Sign in before reserving tickets'; end if;
 if jsonb_typeof(p_items)<>'array' or jsonb_array_length(p_items)<1 or jsonb_array_length(p_items)>10 then raise exception 'Select between 1 and 10 ticket types'; end if;
 if exists(select 1 from jsonb_array_elements(p_items) x group by x->>'ticket_type_id' having count(*)>1) then raise exception 'Each ticket type can only be selected once'; end if;
 select currency,currency_exponent into v_currency,v_exponent from public.events where id=p_event_id and status='published' and starts_at>now();
 if v_currency is null then raise exception 'This event is not available for booking'; end if;
 insert into public.bookings(user_id,event_id,currency,currency_exponent,total_minor) values(v_user,p_event_id,v_currency,v_exponent,0) returning id into v_booking;
 for v_item in select value from jsonb_array_elements(p_items) loop
  v_qty:=(v_item->>'quantity')::integer;
  if v_qty<1 or v_qty>20 then raise exception 'Ticket quantity must be between 1 and 20'; end if;
  select * into v_ticket from public.ticket_types where id=(v_item->>'ticket_type_id')::uuid and event_id=p_event_id for update;
  if not found or not v_ticket.is_active then raise exception 'A selected ticket type is unavailable'; end if;
  if v_qty>v_ticket.max_per_order then raise exception 'Ticket quantity exceeds the per-order limit'; end if;
  if (v_ticket.sales_start is not null and now()<v_ticket.sales_start) or (v_ticket.sales_end is not null and now()>v_ticket.sales_end) then raise exception 'Ticket sales are not open'; end if;
  if v_ticket.quantity_total-v_ticket.quantity_sold<v_qty then raise exception 'Not enough tickets remain for %',v_ticket.name; end if;
  update public.ticket_types set quantity_sold=quantity_sold+v_qty,updated_at=now() where id=v_ticket.id;
  insert into public.booking_items(booking_id,ticket_type_id,ticket_name,unit_price_minor,quantity,line_total_minor)
  values(v_booking,v_ticket.id,v_ticket.name,v_ticket.price_minor,v_qty,v_ticket.price_minor*v_qty);
  v_total:=v_total+v_ticket.price_minor*v_qty;
 end loop;
 update public.bookings set total_minor=v_total where id=v_booking;
 return v_booking;
end; $$;
revoke all on function public.reserve_event_tickets(uuid,jsonb) from public;
grant execute on function public.reserve_event_tickets(uuid,jsonb) to authenticated;

-- Schedule this function with Supabase Cron (every minute) to return expired holds.
create or replace function public.release_expired_ticket_reservations() returns integer
language plpgsql security definer set search_path='' as $$
declare b record; n integer:=0;
begin
 for b in select id from public.bookings where status='pending' and expires_at<=now() for update skip locked loop
  update public.bookings set status='expired',updated_at=now() where id=b.id and status='pending';
  if found then
   update public.ticket_types t set quantity_sold=greatest(0,t.quantity_sold-x.qty),updated_at=now()
   from(select ticket_type_id,sum(quantity)::integer qty from public.booking_items where booking_id=b.id group by ticket_type_id)x where t.id=x.ticket_type_id;
   n:=n+1;
  end if;
 end loop; return n;
end; $$;
revoke all on function public.release_expired_ticket_reservations() from public,anon,authenticated;

-- Prevent authenticated clients from editing the inventory counter directly.
create or replace function public.guard_ticket_inventory() returns trigger
language plpgsql set search_path='' as $$
begin
 if auth.uid() is not null and current_user <> 'postgres' and new.quantity_sold <> old.quantity_sold then
  raise exception 'Ticket inventory can only change through reservation operations';
 end if;
 return new;
end; $$;
drop trigger if exists guard_ticket_inventory on public.ticket_types;
create trigger guard_ticket_inventory before update on public.ticket_types for each row execute function public.guard_ticket_inventory();
