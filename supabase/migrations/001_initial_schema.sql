-- RacePace Initial Schema
-- Run this in Supabase SQL Editor (Database > SQL Editor)

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Enum types
create type user_role as enum ('athlete', 'coach', 'admin');
create type subscription_status as enum ('active', 'inactive', 'past_due', 'canceled');
create type subscription_tier as enum ('athlete', 'coach_starter', 'coach_pro', 'coach_unlimited');
create type unit_preference as enum ('metric', 'imperial');
create type effort_level as enum ('safe', 'tempo', 'pushing');
create type plan_status as enum ('draft', 'complete');
create type packing_category as enum ('on_bike', 'drop_bag', 'race_morning', 'crew', 'jersey_pocket');

-- Users table (extends Supabase auth.users)
create table public.users (
  id uuid references auth.users(id) on delete cascade primary key,
  email text not null,
  name text,
  role user_role default 'athlete' not null,
  subscription_status subscription_status default 'inactive' not null,
  subscription_tier subscription_tier,
  coach_id uuid references public.users(id) on delete set null,
  profile_public boolean default false not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Athlete profiles
create table public.athlete_profiles (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null unique,
  weight_kg numeric(5,2),
  ftp_watts integer,
  altitude_adjustment_factor numeric(3,2) default 0.20,
  nutrition_cho_per_hour integer default 90,
  hydration_ml_per_hour integer default 750,
  sodium_mg_per_hour integer default 750,
  preferred_units unit_preference default 'metric' not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Races
create table public.races (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  slug text not null unique,
  date date,
  location text,
  distances integer[] default '{}',
  gpx_file_url text,
  total_elevation_gain integer,
  elevation_low integer,
  elevation_high integer,
  course_composition jsonb default '{"dirt_pct": 0, "pavement_pct": 0, "singletrack_pct": 0}',
  aid_stations jsonb default '[]',
  is_active boolean default true not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Race plans
create table public.race_plans (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  race_id uuid references public.races(id) on delete cascade not null,
  goal_time_minutes integer,
  created_by uuid references public.users(id) on delete set null,
  status plan_status default 'draft' not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Segments (part of race plans)
create table public.segments (
  id uuid default uuid_generate_v4() primary key,
  race_plan_id uuid references public.race_plans(id) on delete cascade not null,
  segment_order integer not null,
  start_mile numeric(6,2) not null,
  end_mile numeric(6,2) not null,
  start_name text,
  end_name text,
  target_time_minutes integer,
  effort_level effort_level default 'tempo' not null,
  power_target_low integer,
  power_target_high integer,
  nutrition_notes text,
  hydration_notes text,
  terrain_notes text,
  strategy_notes text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Gear setups
create table public.gear_setups (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  race_id uuid references public.races(id) on delete cascade not null,
  bike_brand text,
  bike_model text,
  bike_year integer,
  tire_brand text,
  tire_model text,
  tire_width integer,
  repair_kit_contents text[] default '{}',
  is_public boolean default false not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  unique(user_id, race_id)
);

-- Packing checklists
create table public.packing_checklists (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  race_id uuid references public.races(id) on delete cascade not null,
  items jsonb default '[]',
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  unique(user_id, race_id)
);

-- Forum posts
create table public.forum_posts (
  id uuid default uuid_generate_v4() primary key,
  race_id uuid references public.races(id) on delete cascade not null,
  user_id uuid references public.users(id) on delete cascade not null,
  title text not null,
  body text not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Forum replies
create table public.forum_replies (
  id uuid default uuid_generate_v4() primary key,
  post_id uuid references public.forum_posts(id) on delete cascade not null,
  user_id uuid references public.users(id) on delete cascade not null,
  body text not null,
  created_at timestamptz default now() not null
);

-- Indexes for performance
create index idx_users_coach_id on public.users(coach_id);
create index idx_users_role on public.users(role);
create index idx_athlete_profiles_user_id on public.athlete_profiles(user_id);
create index idx_races_slug on public.races(slug);
create index idx_races_is_active on public.races(is_active);
create index idx_race_plans_user_id on public.race_plans(user_id);
create index idx_race_plans_race_id on public.race_plans(race_id);
create index idx_segments_race_plan_id on public.segments(race_plan_id);
create index idx_gear_setups_user_id on public.gear_setups(user_id);
create index idx_gear_setups_race_id on public.gear_setups(race_id);
create index idx_forum_posts_race_id on public.forum_posts(race_id);
create index idx_forum_replies_post_id on public.forum_replies(post_id);

-- Updated_at trigger function
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Apply updated_at triggers
create trigger update_users_updated_at before update on public.users
  for each row execute function update_updated_at();

create trigger update_athlete_profiles_updated_at before update on public.athlete_profiles
  for each row execute function update_updated_at();

create trigger update_races_updated_at before update on public.races
  for each row execute function update_updated_at();

create trigger update_race_plans_updated_at before update on public.race_plans
  for each row execute function update_updated_at();

create trigger update_segments_updated_at before update on public.segments
  for each row execute function update_updated_at();

create trigger update_gear_setups_updated_at before update on public.gear_setups
  for each row execute function update_updated_at();

create trigger update_packing_checklists_updated_at before update on public.packing_checklists
  for each row execute function update_updated_at();

create trigger update_forum_posts_updated_at before update on public.forum_posts
  for each row execute function update_updated_at();
