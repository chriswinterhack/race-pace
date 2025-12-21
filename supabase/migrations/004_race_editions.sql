-- Race Editions Schema Update
-- Separates persistent races from yearly editions
-- Run this after the initial migrations

-- First, rename the existing races table columns and add new structure
-- We'll keep races as the parent entity and add race_editions for specific dates

-- Add new columns to races table for the persistent entity
alter table public.races
  drop column if exists date,
  drop column if exists gpx_file_url,
  drop column if exists aid_stations,
  add column if not exists description text,
  add column if not exists website_url text,
  add column if not exists logo_url text;

-- Create race_editions table for specific instances
create table if not exists public.race_editions (
  id uuid default uuid_generate_v4() primary key,
  race_id uuid references public.races(id) on delete cascade not null,
  name text, -- Optional override like "2025 Mid South"
  year integer not null,
  date date,
  registration_opens date,
  registration_closes date,
  gpx_file_url text,
  total_elevation_gain integer,
  elevation_low integer,
  elevation_high integer,
  course_composition jsonb default '{"dirt_pct": 0, "pavement_pct": 0, "singletrack_pct": 0}',
  aid_stations jsonb default '[]',
  is_active boolean default true not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  unique(race_id, year)
);

-- Move elevation data to editions (races table keeps just the base info)
alter table public.races
  drop column if exists total_elevation_gain,
  drop column if exists elevation_low,
  drop column if exists elevation_high,
  drop column if exists course_composition;

-- Update race_plans to reference race_editions instead of races
alter table public.race_plans
  add column if not exists race_edition_id uuid references public.race_editions(id) on delete cascade;

-- Update gear_setups to reference race_editions
alter table public.gear_setups
  add column if not exists race_edition_id uuid references public.race_editions(id) on delete cascade;

-- Update packing_checklists to reference race_editions
alter table public.packing_checklists
  add column if not exists race_edition_id uuid references public.race_editions(id) on delete cascade;

-- Update forum_posts to optionally reference race_editions
alter table public.forum_posts
  add column if not exists race_edition_id uuid references public.race_editions(id) on delete set null;

-- Indexes
create index if not exists idx_race_editions_race_id on public.race_editions(race_id);
create index if not exists idx_race_editions_year on public.race_editions(year);
create index if not exists idx_race_editions_date on public.race_editions(date);
create index if not exists idx_race_editions_is_active on public.race_editions(is_active);

-- Updated_at trigger for race_editions
create trigger update_race_editions_updated_at before update on public.race_editions
  for each row execute function update_updated_at();

-- RLS for race_editions (same as races - public read, admin write)
alter table public.race_editions enable row level security;

create policy "Anyone can view active race editions"
  on public.race_editions for select
  using (is_active = true);

create policy "Admins can view all race editions"
  on public.race_editions for select
  using (is_admin());

create policy "Admins can insert race editions"
  on public.race_editions for insert
  with check (is_admin());

create policy "Admins can update race editions"
  on public.race_editions for update
  using (is_admin());

create policy "Admins can delete race editions"
  on public.race_editions for delete
  using (is_admin());

-- Update seed data: Add 2025 editions for existing races
insert into public.race_editions (race_id, year, date, is_active)
select id, 2025, null, true from public.races
on conflict (race_id, year) do nothing;
