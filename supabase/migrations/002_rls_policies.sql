-- RacePace Row Level Security Policies
-- Run this after 001_initial_schema.sql

-- Enable RLS on all tables
alter table public.users enable row level security;
alter table public.athlete_profiles enable row level security;
alter table public.races enable row level security;
alter table public.race_plans enable row level security;
alter table public.segments enable row level security;
alter table public.gear_setups enable row level security;
alter table public.packing_checklists enable row level security;
alter table public.forum_posts enable row level security;
alter table public.forum_replies enable row level security;

-- Helper function: Check if user is admin
create or replace function is_admin()
returns boolean as $$
begin
  return exists (
    select 1 from public.users
    where id = auth.uid() and role = 'admin'
  );
end;
$$ language plpgsql security definer;

-- Helper function: Check if user is coach of another user
create or replace function is_coach_of(athlete_id uuid)
returns boolean as $$
begin
  return exists (
    select 1 from public.users
    where id = athlete_id and coach_id = auth.uid()
  );
end;
$$ language plpgsql security definer;

-- USERS policies
create policy "Users can view own profile"
  on public.users for select
  using (auth.uid() = id);

create policy "Users can view public profiles"
  on public.users for select
  using (profile_public = true);

create policy "Coaches can view their athletes"
  on public.users for select
  using (coach_id = auth.uid());

create policy "Admins can view all users"
  on public.users for select
  using (is_admin());

create policy "Users can update own profile"
  on public.users for update
  using (auth.uid() = id);

create policy "Admins can update any user"
  on public.users for update
  using (is_admin());

create policy "Users can insert own profile"
  on public.users for insert
  with check (auth.uid() = id);

-- ATHLETE_PROFILES policies
create policy "Users can view own athlete profile"
  on public.athlete_profiles for select
  using (auth.uid() = user_id);

create policy "Coaches can view their athletes profiles"
  on public.athlete_profiles for select
  using (is_coach_of(user_id));

create policy "Admins can view all athlete profiles"
  on public.athlete_profiles for select
  using (is_admin());

create policy "Users can insert own athlete profile"
  on public.athlete_profiles for insert
  with check (auth.uid() = user_id);

create policy "Users can update own athlete profile"
  on public.athlete_profiles for update
  using (auth.uid() = user_id);

create policy "Users can delete own athlete profile"
  on public.athlete_profiles for delete
  using (auth.uid() = user_id);

-- RACES policies (public read, admin write)
create policy "Anyone can view active races"
  on public.races for select
  using (is_active = true);

create policy "Admins can view all races"
  on public.races for select
  using (is_admin());

create policy "Admins can insert races"
  on public.races for insert
  with check (is_admin());

create policy "Admins can update races"
  on public.races for update
  using (is_admin());

create policy "Admins can delete races"
  on public.races for delete
  using (is_admin());

-- RACE_PLANS policies
create policy "Users can view own race plans"
  on public.race_plans for select
  using (auth.uid() = user_id);

create policy "Coaches can view their athletes race plans"
  on public.race_plans for select
  using (is_coach_of(user_id));

create policy "Admins can view all race plans"
  on public.race_plans for select
  using (is_admin());

create policy "Users can insert own race plans"
  on public.race_plans for insert
  with check (auth.uid() = user_id);

create policy "Coaches can insert race plans for their athletes"
  on public.race_plans for insert
  with check (is_coach_of(user_id));

create policy "Users can update own race plans"
  on public.race_plans for update
  using (auth.uid() = user_id);

create policy "Coaches can update their athletes race plans"
  on public.race_plans for update
  using (is_coach_of(user_id));

create policy "Users can delete own race plans"
  on public.race_plans for delete
  using (auth.uid() = user_id);

-- SEGMENTS policies (inherit from race_plans)
create policy "Users can view segments of own race plans"
  on public.segments for select
  using (
    exists (
      select 1 from public.race_plans
      where race_plans.id = segments.race_plan_id
      and race_plans.user_id = auth.uid()
    )
  );

create policy "Coaches can view segments of their athletes race plans"
  on public.segments for select
  using (
    exists (
      select 1 from public.race_plans
      where race_plans.id = segments.race_plan_id
      and is_coach_of(race_plans.user_id)
    )
  );

create policy "Users can insert segments in own race plans"
  on public.segments for insert
  with check (
    exists (
      select 1 from public.race_plans
      where race_plans.id = segments.race_plan_id
      and race_plans.user_id = auth.uid()
    )
  );

create policy "Coaches can insert segments in their athletes race plans"
  on public.segments for insert
  with check (
    exists (
      select 1 from public.race_plans
      where race_plans.id = segments.race_plan_id
      and is_coach_of(race_plans.user_id)
    )
  );

create policy "Users can update segments in own race plans"
  on public.segments for update
  using (
    exists (
      select 1 from public.race_plans
      where race_plans.id = segments.race_plan_id
      and race_plans.user_id = auth.uid()
    )
  );

create policy "Coaches can update segments in their athletes race plans"
  on public.segments for update
  using (
    exists (
      select 1 from public.race_plans
      where race_plans.id = segments.race_plan_id
      and is_coach_of(race_plans.user_id)
    )
  );

create policy "Users can delete segments in own race plans"
  on public.segments for delete
  using (
    exists (
      select 1 from public.race_plans
      where race_plans.id = segments.race_plan_id
      and race_plans.user_id = auth.uid()
    )
  );

-- GEAR_SETUPS policies
create policy "Users can view own gear setups"
  on public.gear_setups for select
  using (auth.uid() = user_id);

create policy "Anyone can view public gear setups"
  on public.gear_setups for select
  using (is_public = true);

create policy "Users can insert own gear setups"
  on public.gear_setups for insert
  with check (auth.uid() = user_id);

create policy "Users can update own gear setups"
  on public.gear_setups for update
  using (auth.uid() = user_id);

create policy "Users can delete own gear setups"
  on public.gear_setups for delete
  using (auth.uid() = user_id);

-- PACKING_CHECKLISTS policies
create policy "Users can view own packing checklists"
  on public.packing_checklists for select
  using (auth.uid() = user_id);

create policy "Coaches can view their athletes packing checklists"
  on public.packing_checklists for select
  using (is_coach_of(user_id));

create policy "Users can insert own packing checklists"
  on public.packing_checklists for insert
  with check (auth.uid() = user_id);

create policy "Users can update own packing checklists"
  on public.packing_checklists for update
  using (auth.uid() = user_id);

create policy "Users can delete own packing checklists"
  on public.packing_checklists for delete
  using (auth.uid() = user_id);

-- FORUM_POSTS policies (public read for authenticated users)
create policy "Authenticated users can view forum posts"
  on public.forum_posts for select
  using (auth.uid() is not null);

create policy "Users can insert forum posts"
  on public.forum_posts for insert
  with check (auth.uid() = user_id);

create policy "Users can update own forum posts"
  on public.forum_posts for update
  using (auth.uid() = user_id);

create policy "Users can delete own forum posts"
  on public.forum_posts for delete
  using (auth.uid() = user_id);

create policy "Admins can delete any forum post"
  on public.forum_posts for delete
  using (is_admin());

-- FORUM_REPLIES policies
create policy "Authenticated users can view forum replies"
  on public.forum_replies for select
  using (auth.uid() is not null);

create policy "Users can insert forum replies"
  on public.forum_replies for insert
  with check (auth.uid() = user_id);

create policy "Users can update own forum replies"
  on public.forum_replies for update
  using (auth.uid() = user_id);

create policy "Users can delete own forum replies"
  on public.forum_replies for delete
  using (auth.uid() = user_id);

create policy "Admins can delete any forum reply"
  on public.forum_replies for delete
  using (is_admin());
