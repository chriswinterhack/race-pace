-- Race Distances Schema
-- Adds a third level: Race → Edition → Distance
-- Each distance has its own GPX, date, start time, etc.

-- Ensure uuid extension is available
create extension if not exists "uuid-ossp" with schema extensions;

-- Create race_distances table
create table if not exists public.race_distances (
  id uuid default gen_random_uuid() primary key,
  race_edition_id uuid references public.race_editions(id) on delete cascade not null,

  -- Distance info
  name text, -- Optional name like "XL" or "Sprint" instead of just miles
  distance_miles numeric(6,2) not null,
  distance_km numeric(6,2) generated always as (distance_miles * 1.60934) stored,

  -- Schedule
  date date,
  start_time time,
  wave_info jsonb default '[]', -- Array of {name, start_time, capacity, description}

  -- Course details
  gpx_file_url text,
  elevation_gain integer, -- feet
  elevation_loss integer,
  elevation_high integer,
  elevation_low integer,

  -- Course composition
  surface_composition jsonb default '{"gravel_pct": 0, "pavement_pct": 0, "singletrack_pct": 0, "dirt_pct": 0}',

  -- Aid stations for this specific distance
  aid_stations jsonb default '[]', -- Array of {name, mile, supplies[], cutoff_time}

  -- Cutoffs and limits
  time_limit_minutes integer,
  participant_limit integer,

  -- Registration
  registration_url text,
  registration_fee_cents integer,

  -- Status
  is_active boolean default true not null,
  sort_order integer default 0, -- For ordering distances (longest first, etc.)

  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Move gpx_file_url from race_editions to race_distances (editions no longer have GPX directly)
-- The date on race_editions becomes optional (for multi-day events, date is on distances)
alter table public.race_editions
  alter column date drop not null;

-- Remove elevation columns from race_editions (now on race_distances)
alter table public.race_editions
  drop column if exists total_elevation_gain,
  drop column if exists elevation_low,
  drop column if exists elevation_high,
  drop column if exists course_composition,
  drop column if exists aid_stations;

-- Remove distances array from races table (now represented as race_distances records)
alter table public.races
  drop column if exists distances;

-- Indexes
create index if not exists idx_race_distances_edition_id on public.race_distances(race_edition_id);
create index if not exists idx_race_distances_date on public.race_distances(date);
create index if not exists idx_race_distances_is_active on public.race_distances(is_active);
create index if not exists idx_race_distances_sort_order on public.race_distances(sort_order);

-- Updated_at trigger
create trigger update_race_distances_updated_at before update on public.race_distances
  for each row execute function update_updated_at();

-- RLS policies
alter table public.race_distances enable row level security;

create policy "Anyone can view active race distances"
  on public.race_distances for select
  using (is_active = true);

create policy "Admins can view all race distances"
  on public.race_distances for select
  using (is_admin());

create policy "Admins can insert race distances"
  on public.race_distances for insert
  with check (is_admin());

create policy "Admins can update race distances"
  on public.race_distances for update
  using (is_admin());

create policy "Admins can delete race distances"
  on public.race_distances for delete
  using (is_admin());

-- Update race_plans to reference specific distance instead of just edition
alter table public.race_plans
  add column if not exists race_distance_id uuid references public.race_distances(id) on delete cascade;

-- Seed distances for existing race editions based on original race distances
-- This is a one-time migration to populate the new structure

-- Mid South (50, 100)
insert into public.race_distances (race_edition_id, distance_miles, sort_order)
select re.id, 100, 1 from public.race_editions re
join public.races r on r.id = re.race_id where r.slug = 'mid-south'
on conflict do nothing;

insert into public.race_distances (race_edition_id, distance_miles, sort_order)
select re.id, 50, 2 from public.race_editions re
join public.races r on r.id = re.race_id where r.slug = 'mid-south'
on conflict do nothing;

-- SBT Gravel (37, 64, 104, 144)
insert into public.race_distances (race_edition_id, distance_miles, name, sort_order)
select re.id, 144, 'Black', 1 from public.race_editions re
join public.races r on r.id = re.race_id where r.slug = 'sbt-gravel'
on conflict do nothing;

insert into public.race_distances (race_edition_id, distance_miles, name, sort_order)
select re.id, 104, 'Blue', 2 from public.race_editions re
join public.races r on r.id = re.race_id where r.slug = 'sbt-gravel'
on conflict do nothing;

insert into public.race_distances (race_edition_id, distance_miles, name, sort_order)
select re.id, 64, 'Green', 3 from public.race_editions re
join public.races r on r.id = re.race_id where r.slug = 'sbt-gravel'
on conflict do nothing;

insert into public.race_distances (race_edition_id, distance_miles, name, sort_order)
select re.id, 37, 'Yellow', 4 from public.race_editions re
join public.races r on r.id = re.race_id where r.slug = 'sbt-gravel'
on conflict do nothing;

-- Unbound (25, 50, 100, 200, 350)
insert into public.race_distances (race_edition_id, distance_miles, name, sort_order)
select re.id, 350, 'XL', 1 from public.race_editions re
join public.races r on r.id = re.race_id where r.slug = 'unbound'
on conflict do nothing;

insert into public.race_distances (race_edition_id, distance_miles, sort_order)
select re.id, 200, 2 from public.race_editions re
join public.races r on r.id = re.race_id where r.slug = 'unbound'
on conflict do nothing;

insert into public.race_distances (race_edition_id, distance_miles, sort_order)
select re.id, 100, 3 from public.race_editions re
join public.races r on r.id = re.race_id where r.slug = 'unbound'
on conflict do nothing;

insert into public.race_distances (race_edition_id, distance_miles, sort_order)
select re.id, 50, 4 from public.race_editions re
join public.races r on r.id = re.race_id where r.slug = 'unbound'
on conflict do nothing;

insert into public.race_distances (race_edition_id, distance_miles, sort_order)
select re.id, 25, 5 from public.race_editions re
join public.races r on r.id = re.race_id where r.slug = 'unbound'
on conflict do nothing;

-- Sea Otter (30, 60)
insert into public.race_distances (race_edition_id, distance_miles, sort_order)
select re.id, 60, 1 from public.race_editions re
join public.races r on r.id = re.race_id where r.slug = 'sea-otter'
on conflict do nothing;

insert into public.race_distances (race_edition_id, distance_miles, sort_order)
select re.id, 30, 2 from public.race_editions re
join public.races r on r.id = re.race_id where r.slug = 'sea-otter'
on conflict do nothing;

-- Leadville (100)
insert into public.race_distances (race_edition_id, distance_miles, sort_order)
select re.id, 100, 1 from public.race_editions re
join public.races r on r.id = re.race_id where r.slug = 'leadville-100'
on conflict do nothing;

-- Triple Bypass (120)
insert into public.race_distances (race_edition_id, distance_miles, sort_order)
select re.id, 120, 1 from public.race_editions re
join public.races r on r.id = re.race_id where r.slug = 'triple-bypass'
on conflict do nothing;

-- Double Bypass (65)
insert into public.race_distances (race_edition_id, distance_miles, sort_order)
select re.id, 65, 1 from public.race_editions re
join public.races r on r.id = re.race_id where r.slug = 'double-bypass'
on conflict do nothing;

-- Big Sugar (52, 104)
insert into public.race_distances (race_edition_id, distance_miles, sort_order)
select re.id, 104, 1 from public.race_editions re
join public.races r on r.id = re.race_id where r.slug = 'big-sugar'
on conflict do nothing;

insert into public.race_distances (race_edition_id, distance_miles, sort_order)
select re.id, 52, 2 from public.race_editions re
join public.races r on r.id = re.race_id where r.slug = 'big-sugar'
on conflict do nothing;

-- Gravel Nationals (75, 130)
insert into public.race_distances (race_edition_id, distance_miles, sort_order)
select re.id, 130, 1 from public.race_editions re
join public.races r on r.id = re.race_id where r.slug = 'gravel-nationals'
on conflict do nothing;

insert into public.race_distances (race_edition_id, distance_miles, sort_order)
select re.id, 75, 2 from public.race_editions re
join public.races r on r.id = re.race_id where r.slug = 'gravel-nationals'
on conflict do nothing;

-- Chequamegon (40)
insert into public.race_distances (race_edition_id, distance_miles, sort_order)
select re.id, 40, 1 from public.race_editions re
join public.races r on r.id = re.race_id where r.slug = 'chequamegon'
on conflict do nothing;
