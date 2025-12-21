-- Storage Buckets Setup
-- Run this in Supabase SQL Editor after running previous migrations

-- Create the gpx-files bucket for course files
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'gpx-files',
  'gpx-files',
  true,  -- Public bucket so files can be downloaded
  10485760,  -- 10MB max file size
  array['application/gpx+xml', 'application/xml', 'text/xml', 'application/octet-stream']
)
on conflict (id) do nothing;

-- Create the race-logos bucket for race images
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'race-logos',
  'race-logos',
  true,
  5242880,  -- 5MB max
  array['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
)
on conflict (id) do nothing;

-- Storage policies for gpx-files bucket

-- Anyone can view/download GPX files (public bucket)
create policy "Public GPX file access"
on storage.objects for select
using (bucket_id = 'gpx-files');

-- Only admins can upload GPX files
create policy "Admins can upload GPX files"
on storage.objects for insert
with check (
  bucket_id = 'gpx-files'
  and exists (
    select 1 from public.users
    where id = auth.uid() and role = 'admin'
  )
);

-- Only admins can update GPX files
create policy "Admins can update GPX files"
on storage.objects for update
using (
  bucket_id = 'gpx-files'
  and exists (
    select 1 from public.users
    where id = auth.uid() and role = 'admin'
  )
);

-- Only admins can delete GPX files
create policy "Admins can delete GPX files"
on storage.objects for delete
using (
  bucket_id = 'gpx-files'
  and exists (
    select 1 from public.users
    where id = auth.uid() and role = 'admin'
  )
);

-- Storage policies for race-logos bucket

-- Anyone can view race logos
create policy "Public race logo access"
on storage.objects for select
using (bucket_id = 'race-logos');

-- Only admins can upload race logos
create policy "Admins can upload race logos"
on storage.objects for insert
with check (
  bucket_id = 'race-logos'
  and exists (
    select 1 from public.users
    where id = auth.uid() and role = 'admin'
  )
);

-- Only admins can update race logos
create policy "Admins can update race logos"
on storage.objects for update
using (
  bucket_id = 'race-logos'
  and exists (
    select 1 from public.users
    where id = auth.uid() and role = 'admin'
  )
);

-- Only admins can delete race logos
create policy "Admins can delete race logos"
on storage.objects for delete
using (
  bucket_id = 'race-logos'
  and exists (
    select 1 from public.users
    where id = auth.uid() and role = 'admin'
  )
);
