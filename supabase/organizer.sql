-- EventSphere Milestone 4: organizer event management and image storage
-- Run after schema.sql and auth.sql in the Supabase SQL Editor.

-- Keep event ownership and privileged role checks inside the database.
drop policy if exists "Organizers can read their events" on public.events;
create policy "Organizers can read their events"
  on public.events for select to authenticated
  using (
    organizer_id = (select auth.uid())
    or exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid()) and p.role = 'admin'
    )
  );

drop policy if exists "Organizers can create their events" on public.events;
create policy "Organizers can create their events"
  on public.events for insert to authenticated
  with check (
    organizer_id = (select auth.uid())
    and exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid()) and p.role in ('organizer', 'admin')
    )
    and status in ('draft', 'pending')
  );

drop policy if exists "Organizers can update their events" on public.events;
create policy "Organizers can update their events"
  on public.events for update to authenticated
  using (
    (organizer_id = (select auth.uid()) and exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid()) and p.role in ('organizer', 'admin')
    ))
    or exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid()) and p.role = 'admin'
    )
  )
  with check (
    (organizer_id = (select auth.uid()) and status in ('draft', 'pending'))
    or exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid()) and p.role = 'admin'
    )
  );

drop policy if exists "Organizers can delete their events" on public.events;
create policy "Organizers can delete their events"
  on public.events for delete to authenticated
  using (
    (organizer_id = (select auth.uid()) and exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid()) and p.role in ('organizer', 'admin')
    ))
    or exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid()) and p.role = 'admin'
    )
  );

-- Public event artwork. Uploads are scoped to a folder named after the owner UUID.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('event-images', 'event-images', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Organizers upload event images to their folder" on storage.objects;
create policy "Organizers upload event images to their folder"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'event-images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid()) and p.role in ('organizer', 'admin')
    )
  );

drop policy if exists "Organizers update their event images" on storage.objects;
create policy "Organizers update their event images"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'event-images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid()) and p.role in ('organizer', 'admin')
    )
  )
  with check (
    bucket_id = 'event-images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid()) and p.role in ('organizer', 'admin')
    )
  );

drop policy if exists "Organizers delete their event images" on storage.objects;
create policy "Organizers delete their event images"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'event-images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid()) and p.role in ('organizer', 'admin')
    )
  );
