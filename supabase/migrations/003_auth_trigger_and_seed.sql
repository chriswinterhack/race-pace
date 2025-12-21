-- Auth trigger and seed data
-- Run this after 002_rls_policies.sql

-- Function to create user profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    'athlete'
  );

  -- Also create empty athlete profile
  insert into public.athlete_profiles (user_id)
  values (new.id);

  return new;
end;
$$ language plpgsql security definer;

-- Trigger to auto-create user profile on signup
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Seed initial races from CLAUDE.md
insert into public.races (name, slug, location, distances, is_active) values
  ('Mid South Gravel', 'mid-south', 'Stillwater, OK', '{50, 100}', true),
  ('SBT Gravel', 'sbt-gravel', 'Steamboat Springs, CO', '{37, 64, 104, 144}', true),
  ('Unbound Gravel', 'unbound', 'Emporia, KS', '{25, 50, 100, 200, 350}', true),
  ('Sea Otter Classic Gravel', 'sea-otter', 'Monterey, CA', '{30, 60}', true),
  ('Leadville Trail 100 MTB', 'leadville-100', 'Leadville, CO', '{100}', true),
  ('Triple Bypass', 'triple-bypass', 'Evergreen, CO', '{120}', true),
  ('Double Bypass', 'double-bypass', 'Evergreen, CO', '{65}', true),
  ('Big Sugar Gravel', 'big-sugar', 'Bentonville, AR', '{52, 104}', true),
  ('Gravel Nationals', 'gravel-nationals', 'Lawrence, KS', '{75, 130}', true),
  ('Chequamegon 40', 'chequamegon', 'Cable, WI', '{40}', true);
