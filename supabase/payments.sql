-- EventSphere M6 payment ledger and verified booking confirmation.
-- Run after schema.sql, auth.sql, organizer.sql and ticketing.sql.
create table if not exists public.payments (
 id uuid primary key default gen_random_uuid(),
 booking_id uuid not null references public.bookings(id) on delete restrict,
 provider text not null check(provider in ('paystack','stripe')),
 provider_reference text not null,
 amount_minor bigint not null check(amount_minor >= 0),
 currency char(3) not null,
 status text not null default 'initialized' check(status in ('initialized','succeeded','failed','review_required')),
 provider_payload jsonb,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 unique(provider,provider_reference)
);
create index if not exists payments_booking_idx on public.payments(booking_id,created_at desc);
alter table public.payments enable row level security;
drop policy if exists "Users can view their payment attempts" on public.payments;
create policy "Users can view their payment attempts" on public.payments for select to authenticated
using(exists(select 1 from public.bookings b where b.id=booking_id and b.user_id=auth.uid()));
-- No client-side insert/update/delete policies. Only the server service role writes payment records.

create or replace function public.confirm_paid_booking(p_booking_id uuid,p_payment_id uuid,p_provider_payload jsonb)
returns void language plpgsql security definer set search_path='' as $$
declare v_booking public.bookings%rowtype; v_payment public.payments%rowtype;
begin
 select * into v_booking from public.bookings where id=p_booking_id for update;
 select * into v_payment from public.payments where id=p_payment_id and booking_id=p_booking_id for update;
 if not found then raise exception 'Payment record not found'; end if;
 if v_payment.status='succeeded' and v_booking.status='confirmed' then return; end if;
 if v_booking.id is null or v_booking.status <> 'pending' or v_booking.expires_at <= now() then
   update public.payments set status='review_required',provider_payload=p_provider_payload,updated_at=now() where id=p_payment_id;
   return;
 end if;
 if v_payment.amount_minor <> v_booking.total_minor or v_payment.currency <> v_booking.currency then raise exception 'Payment amount mismatch'; end if;
 update public.payments set status='succeeded',provider_payload=p_provider_payload,updated_at=now() where id=p_payment_id;
 update public.bookings set status='confirmed',updated_at=now() where id=p_booking_id;
end; $$;
revoke all on function public.confirm_paid_booking(uuid,uuid,jsonb) from public,anon,authenticated;
grant execute on function public.confirm_paid_booking(uuid,uuid,jsonb) to service_role;
