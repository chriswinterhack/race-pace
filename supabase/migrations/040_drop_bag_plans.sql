-- Migration: Drop bag planning tables
-- Allows users to plan what items go into each drop bag for a race

-- Drop bag plans (one per race plan)
CREATE TABLE user_drop_bag_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  race_plan_id UUID NOT NULL REFERENCES race_plans(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(race_plan_id)
);

CREATE INDEX idx_drop_bag_plans_user ON user_drop_bag_plans(user_id);
CREATE INDEX idx_drop_bag_plans_race_plan ON user_drop_bag_plans(race_plan_id);

-- Drop bag items
CREATE TABLE drop_bag_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  drop_bag_plan_id UUID NOT NULL REFERENCES user_drop_bag_plans(id) ON DELETE CASCADE,

  -- Location info (denormalized from aid station for flexibility)
  location_mile NUMERIC(6,2) NOT NULL,
  location_name TEXT NOT NULL,

  -- Item source: from gear inventory or custom
  source_type TEXT NOT NULL CHECK (source_type IN ('gear_inventory', 'custom')),

  -- If from gear inventory
  gear_type TEXT, -- 'clothing', 'repair_kit', 'hydration_pack', 'bag', 'shoe', 'tire'
  gear_id UUID, -- References the specific gear item (no FK for flexibility)

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
  CONSTRAINT drop_bag_item_source_check CHECK (
    (source_type = 'gear_inventory' AND gear_type IS NOT NULL AND gear_id IS NOT NULL) OR
    (source_type = 'custom' AND custom_name IS NOT NULL AND custom_category IS NOT NULL)
  )
);

CREATE INDEX idx_drop_bag_items_plan ON drop_bag_items(drop_bag_plan_id);
CREATE INDEX idx_drop_bag_items_location ON drop_bag_items(location_mile);

-- Enable Row Level Security
ALTER TABLE user_drop_bag_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE drop_bag_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for drop bag plans
CREATE POLICY "Users can view own drop bag plans" ON user_drop_bag_plans
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own drop bag plans" ON user_drop_bag_plans
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own drop bag plans" ON user_drop_bag_plans
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own drop bag plans" ON user_drop_bag_plans
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- RLS Policies for drop bag items
CREATE POLICY "Users can view own drop bag items" ON drop_bag_items
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_drop_bag_plans p
      WHERE p.id = drop_bag_items.drop_bag_plan_id
      AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own drop bag items" ON drop_bag_items
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_drop_bag_plans p
      WHERE p.id = drop_bag_items.drop_bag_plan_id
      AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own drop bag items" ON drop_bag_items
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_drop_bag_plans p
      WHERE p.id = drop_bag_items.drop_bag_plan_id
      AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own drop bag items" ON drop_bag_items
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_drop_bag_plans p
      WHERE p.id = drop_bag_items.drop_bag_plan_id
      AND p.user_id = auth.uid()
    )
  );

-- Updated at trigger
CREATE TRIGGER set_updated_at_drop_bag_plans
  BEFORE UPDATE ON user_drop_bag_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
