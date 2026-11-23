-- EventSphere M9: admin visibility and immutable audit trail.
-- Run after notifications_analytics.sql.
create table if not exists public.admin_audit_logs (
 id uuid primary key default gen_random_uuid(),
 actor_id uuid references auth.users(id) on delete set null,
 action text not null,
 target_type text not null,
 target_id text,
 details jsonb not null default '{}'::jsonb,
 created_at timestamptz not null default now()
);
create index if not exists admin_audit_created_idx on public.admin_audit_logs(created_at desc);
create index if not exists admin_audit_actor_idx on public.admin_audit_logs(actor_id,created_at desc);
alter table public.admin_audit_logs enable row level security;
drop policy if exists "Admins can read audit logs" on public.admin_audit_logs;
create policy "Admins can read audit logs" on public.admin_audit_logs for select to authenticated
using(exists(select 1 from public.profiles p where p.id=auth.uid() and p.role='admin'));

-- Admins can inspect profiles and payment records; regular users retain own-row access.
drop policy if exists "Admins can read all profiles" on public.profiles;
create policy "Admins can read all profiles" on public.profiles for select to authenticated
using(exists(select 1 from public.profiles p where p.id=auth.uid() and p.role='admin'));

drop policy if exists "Admins can read all payments" on public.payments;
create policy "Admins can read all payments" on public.payments for select to authenticated
using(exists(select 1 from public.profiles p where p.id=auth.uid() and p.role='admin'));

-- Admin-only server RPC to change a user's role. Never expose this to anon/public.
create or replace function public.admin_set_user_role(p_user_id uuid,p_role text)
returns void language plpgsql security definer set search_path='' as $$
begin
 if not exists(select 1 from public.profiles where id=auth.uid() and role='admin') then
  raise exception 'Administrator access required';
 end if;
 if p_role not in ('attendee','organizer','admin') then raise exception 'Invalid role'; end if;
 if p_user_id=auth.uid() and p_role<>'admin' then raise exception 'You cannot remove your own administrator role'; end if;
 update public.profiles set role=p_role,updated_at=now() where id=p_user_id;
 if not found then raise exception 'User profile not found'; end if;
end; $$;
revoke all on function public.admin_set_user_role(uuid,text) from public,anon;
grant execute on function public.admin_set_user_role(uuid,text) to authenticated;
