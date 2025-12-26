-- Migration: Crew planning tables
-- Allows users to plan crew support for races with designated crew access points

-- Crew plans (one per race plan)
CREATE TABLE user_crew_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  race_plan_id UUID NOT NULL REFERENCES race_plans(id) ON DELETE CASCADE,

  -- Crew lead contact info
  crew_lead_name TEXT,
  crew_lead_phone TEXT,
  crew_lead_email TEXT,

  -- General instructions for all crew members
  general_instructions TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(race_plan_id)
);

CREATE INDEX idx_crew_plans_user ON user_crew_plans(user_id);
CREATE INDEX idx_crew_plans_race_plan ON user_crew_plans(race_plan_id);

-- Crew members
CREATE TABLE crew_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  crew_plan_id UUID NOT NULL REFERENCES user_crew_plans(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  role TEXT CHECK (role IN ('driver', 'pacer', 'support', 'photographer', 'other')),
  notes TEXT,
  sort_order INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_crew_members_plan ON crew_members(crew_plan_id);

-- Items crew should bring to each location
CREATE TABLE crew_location_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  crew_plan_id UUID NOT NULL REFERENCES user_crew_plans(id) ON DELETE CASCADE,

  -- Location info (from race crew_locations)
  location_mile NUMERIC(6,2) NOT NULL,
  location_name TEXT NOT NULL,

  -- Item source: from gear inventory or custom
  source_type TEXT NOT NULL CHECK (source_type IN ('gear_inventory', 'custom')),

  -- If from gear inventory
  gear_type TEXT,
  gear_id UUID,

  -- If custom item
  custom_name TEXT,
  custom_category TEXT CHECK (custom_category IN ('nutrition', 'clothing', 'repair', 'electronics', 'medical', 'other')),

  -- Item details
  quantity INTEGER DEFAULT 1 NOT NULL CHECK (quantity > 0),
  notes TEXT,
  is_critical BOOLEAN DEFAULT FALSE NOT NULL,
  sort_order INTEGER DEFAULT 0 NOT NULL,

  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  -- Ensure either gear reference or custom name is provided
  CONSTRAINT crew_item_source_check CHECK (
    (source_type = 'gear_inventory' AND gear_type IS NOT NULL AND gear_id IS NOT NULL) OR
    (source_type = 'custom' AND custom_name IS NOT NULL AND custom_category IS NOT NULL)
  )
);

CREATE INDEX idx_crew_items_plan ON crew_location_items(crew_plan_id);
CREATE INDEX idx_crew_items_location ON crew_location_items(location_mile);

-- Per-location instructions for crew
CREATE TABLE crew_location_instructions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  crew_plan_id UUID NOT NULL REFERENCES user_crew_plans(id) ON DELETE CASCADE,

  -- Location info
  location_mile NUMERIC(6,2) NOT NULL,
  location_name TEXT NOT NULL,

  -- Timing info (calculated from race plan)
  expected_arrival_time TEXT,
  expected_departure_time TEXT,
  planned_stop_duration_minutes INTEGER DEFAULT 5,

  -- Instructions
  priority_actions TEXT,      -- What to do first when athlete arrives
  nutrition_notes TEXT,       -- Specific nutrition handoff
  hydration_notes TEXT,       -- Specific hydration handoff
  equipment_changes TEXT,     -- Clothing/gear changes needed
  mental_cues TEXT,           -- Motivational notes for crew to share

  -- Logistics
  parking_spot TEXT,          -- Where crew should park at this location
  setup_notes TEXT,           -- How to set up at this location

  sort_order INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  -- One instruction set per location per plan
  UNIQUE(crew_plan_id, location_mile)
);

CREATE INDEX idx_crew_instructions_plan ON crew_location_instructions(crew_plan_id);
CREATE INDEX idx_crew_instructions_location ON crew_location_instructions(location_mile);

-- Enable Row Level Security
ALTER TABLE user_crew_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE crew_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE crew_location_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE crew_location_instructions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for crew plans
CREATE POLICY "Users can view own crew plans" ON user_crew_plans
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own crew plans" ON user_crew_plans
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own crew plans" ON user_crew_plans
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own crew plans" ON user_crew_plans
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- RLS Policies for crew members
CREATE POLICY "Users can manage own crew members" ON crew_members
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_crew_plans p
      WHERE p.id = crew_members.crew_plan_id
      AND p.user_id = auth.uid()
    )
  );

-- RLS Policies for crew location items
CREATE POLICY "Users can manage own crew location items" ON crew_location_items
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_crew_plans p
      WHERE p.id = crew_location_items.crew_plan_id
      AND p.user_id = auth.uid()
    )
  );

-- RLS Policies for crew location instructions
CREATE POLICY "Users can manage own crew instructions" ON crew_location_instructions
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_crew_plans p
      WHERE p.id = crew_location_instructions.crew_plan_id
      AND p.user_id = auth.uid()
    )
  );

-- Updated at trigger
CREATE TRIGGER set_updated_at_crew_plans
  BEFORE UPDATE ON user_crew_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
