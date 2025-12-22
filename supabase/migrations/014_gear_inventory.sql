-- Migration: Gear Inventory System
-- Creates tables for global gear inventory and race-specific selections

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 1. user_bikes - Global bike inventory
CREATE TABLE user_bikes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER,
  bike_type TEXT NOT NULL CHECK (bike_type IN ('road', 'gravel', 'mtb', 'cx')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_user_bikes_user_id ON user_bikes(user_id);

-- 2. user_tires - Global tire inventory
CREATE TABLE user_tires (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  width_mm INTEGER NOT NULL,
  tire_type TEXT CHECK (tire_type IN ('tubeless', 'clincher', 'tubular')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_user_tires_user_id ON user_tires(user_id);

-- 3. user_shoes - Global running shoe inventory
CREATE TABLE user_shoes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  stack_mm INTEGER,
  drop_mm INTEGER,
  shoe_type TEXT CHECK (shoe_type IN ('trail', 'road', 'hybrid')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_user_shoes_user_id ON user_shoes(user_id);

-- 4. user_hydration_packs - Global hydration pack inventory
CREATE TABLE user_hydration_packs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  capacity_liters NUMERIC(4,2),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_user_hydration_packs_user_id ON user_hydration_packs(user_id);

-- 5. user_bags - Global on-bike bags inventory
CREATE TABLE user_bags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  bag_type TEXT NOT NULL CHECK (bag_type IN ('saddle', 'frame', 'handlebar', 'top_tube', 'stem', 'feed')),
  capacity_liters NUMERIC(4,2),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_user_bags_user_id ON user_bags(user_id);

-- 6. user_repair_kits - Global repair kit templates
CREATE TABLE user_repair_kits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  items TEXT[] DEFAULT '{}',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_user_repair_kits_user_id ON user_repair_kits(user_id);

-- 7. user_clothing - Global clothing/layers inventory
CREATE TABLE user_clothing (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  brand TEXT,
  name TEXT NOT NULL,
  clothing_type TEXT NOT NULL CHECK (clothing_type IN (
    'jersey', 'bibs', 'jacket', 'vest', 'arm_warmers', 'leg_warmers',
    'knee_warmers', 'gloves', 'cap', 'socks', 'shoe_covers',
    'base_layer', 'shorts', 'tights', 'shirt', 'other'
  )),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_user_clothing_user_id ON user_clothing(user_id);

-- 8. race_gear_selections - Race-specific gear selections
CREATE TABLE race_gear_selections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  race_id UUID REFERENCES races(id) ON DELETE CASCADE NOT NULL,
  race_edition_id UUID REFERENCES race_editions(id) ON DELETE SET NULL,
  race_distance_id UUID REFERENCES race_distances(id) ON DELETE SET NULL,
  bike_id UUID REFERENCES user_bikes(id) ON DELETE SET NULL,
  front_tire_id UUID REFERENCES user_tires(id) ON DELETE SET NULL,
  rear_tire_id UUID REFERENCES user_tires(id) ON DELETE SET NULL,
  shoe_id UUID REFERENCES user_shoes(id) ON DELETE SET NULL,
  hydration_pack_id UUID REFERENCES user_hydration_packs(id) ON DELETE SET NULL,
  repair_kit_id UUID REFERENCES user_repair_kits(id) ON DELETE SET NULL,
  is_public BOOLEAN DEFAULT TRUE NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, race_distance_id)
);

CREATE INDEX idx_race_gear_selections_user_id ON race_gear_selections(user_id);
CREATE INDEX idx_race_gear_selections_race_id ON race_gear_selections(race_id);
CREATE INDEX idx_race_gear_selections_race_distance_id ON race_gear_selections(race_distance_id);

-- 9. race_gear_bags - Junction table for bags per race (many-to-many)
CREATE TABLE race_gear_bags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  race_gear_selection_id UUID REFERENCES race_gear_selections(id) ON DELETE CASCADE NOT NULL,
  bag_id UUID REFERENCES user_bags(id) ON DELETE CASCADE NOT NULL,
  UNIQUE(race_gear_selection_id, bag_id)
);

-- 10. race_gear_clothing - Junction table for clothing per race (many-to-many)
CREATE TABLE race_gear_clothing (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  race_gear_selection_id UUID REFERENCES race_gear_selections(id) ON DELETE CASCADE NOT NULL,
  clothing_id UUID REFERENCES user_clothing(id) ON DELETE CASCADE NOT NULL,
  UNIQUE(race_gear_selection_id, clothing_id)
);

-- Updated_at triggers for all tables
CREATE TRIGGER set_updated_at_user_bikes BEFORE UPDATE ON user_bikes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at_user_tires BEFORE UPDATE ON user_tires
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at_user_shoes BEFORE UPDATE ON user_shoes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at_user_hydration_packs BEFORE UPDATE ON user_hydration_packs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at_user_bags BEFORE UPDATE ON user_bags
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at_user_repair_kits BEFORE UPDATE ON user_repair_kits
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at_user_clothing BEFORE UPDATE ON user_clothing
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at_race_gear_selections BEFORE UPDATE ON race_gear_selections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS on all tables
ALTER TABLE user_bikes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_tires ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_shoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_hydration_packs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_bags ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_repair_kits ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_clothing ENABLE ROW LEVEL SECURITY;
ALTER TABLE race_gear_selections ENABLE ROW LEVEL SECURITY;
ALTER TABLE race_gear_bags ENABLE ROW LEVEL SECURITY;
ALTER TABLE race_gear_clothing ENABLE ROW LEVEL SECURITY;

-- RLS Policies for inventory tables (users manage their own gear)

-- user_bikes policies
CREATE POLICY "Users can view own bikes" ON user_bikes
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own bikes" ON user_bikes
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own bikes" ON user_bikes
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own bikes" ON user_bikes
  FOR DELETE USING (auth.uid() = user_id);

-- user_tires policies
CREATE POLICY "Users can view own tires" ON user_tires
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own tires" ON user_tires
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own tires" ON user_tires
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own tires" ON user_tires
  FOR DELETE USING (auth.uid() = user_id);

-- user_shoes policies
CREATE POLICY "Users can view own shoes" ON user_shoes
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own shoes" ON user_shoes
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own shoes" ON user_shoes
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own shoes" ON user_shoes
  FOR DELETE USING (auth.uid() = user_id);

-- user_hydration_packs policies
CREATE POLICY "Users can view own hydration packs" ON user_hydration_packs
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own hydration packs" ON user_hydration_packs
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own hydration packs" ON user_hydration_packs
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own hydration packs" ON user_hydration_packs
  FOR DELETE USING (auth.uid() = user_id);

-- user_bags policies
CREATE POLICY "Users can view own bags" ON user_bags
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own bags" ON user_bags
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own bags" ON user_bags
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own bags" ON user_bags
  FOR DELETE USING (auth.uid() = user_id);

-- user_repair_kits policies
CREATE POLICY "Users can view own repair kits" ON user_repair_kits
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own repair kits" ON user_repair_kits
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own repair kits" ON user_repair_kits
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own repair kits" ON user_repair_kits
  FOR DELETE USING (auth.uid() = user_id);

-- user_clothing policies
CREATE POLICY "Users can view own clothing" ON user_clothing
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own clothing" ON user_clothing
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own clothing" ON user_clothing
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own clothing" ON user_clothing
  FOR DELETE USING (auth.uid() = user_id);

-- race_gear_selections policies (own + public for viewing)
CREATE POLICY "Users can view own gear selections" ON race_gear_selections
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Anyone can view public gear selections" ON race_gear_selections
  FOR SELECT USING (is_public = true);
CREATE POLICY "Users can insert own gear selections" ON race_gear_selections
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own gear selections" ON race_gear_selections
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own gear selections" ON race_gear_selections
  FOR DELETE USING (auth.uid() = user_id);

-- race_gear_bags policies (based on parent selection ownership)
CREATE POLICY "Users can view own gear bags" ON race_gear_bags
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM race_gear_selections rgs
      WHERE rgs.id = race_gear_selection_id AND rgs.user_id = auth.uid()
    )
  );
CREATE POLICY "Anyone can view public gear bags" ON race_gear_bags
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM race_gear_selections rgs
      WHERE rgs.id = race_gear_selection_id AND rgs.is_public = true
    )
  );
CREATE POLICY "Users can manage own gear bags" ON race_gear_bags
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM race_gear_selections rgs
      WHERE rgs.id = race_gear_selection_id AND rgs.user_id = auth.uid()
    )
  );

-- race_gear_clothing policies (based on parent selection ownership)
CREATE POLICY "Users can view own gear clothing" ON race_gear_clothing
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM race_gear_selections rgs
      WHERE rgs.id = race_gear_selection_id AND rgs.user_id = auth.uid()
    )
  );
CREATE POLICY "Anyone can view public gear clothing" ON race_gear_clothing
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM race_gear_selections rgs
      WHERE rgs.id = race_gear_selection_id AND rgs.is_public = true
    )
  );
CREATE POLICY "Users can manage own gear clothing" ON race_gear_clothing
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM race_gear_selections rgs
      WHERE rgs.id = race_gear_selection_id AND rgs.user_id = auth.uid()
    )
  );
