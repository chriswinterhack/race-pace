-- ============================================================================
-- Nutrition Products & Race Nutrition Plans
-- ============================================================================
-- This migration adds tables for:
-- 1. Global nutrition products database
-- 2. User custom products
-- 3. User favorites
-- 4. Race nutrition plans
-- 5. Plan items and water tracking
-- ============================================================================

-- Nutrition products (global catalog)
CREATE TABLE IF NOT EXISTS nutrition_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand TEXT NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('gel', 'chew', 'bar', 'drink_mix', 'real_food', 'electrolyte', 'other')),

  -- Per serving nutritional info
  serving_size TEXT,
  calories INTEGER NOT NULL DEFAULT 0,
  carbs_grams DECIMAL(6,2) NOT NULL DEFAULT 0,
  sodium_mg INTEGER NOT NULL DEFAULT 0,

  -- Advanced carb data for glucose:fructose ratio analysis
  sugars_grams DECIMAL(6,2),
  glucose_grams DECIMAL(6,2),
  fructose_grams DECIMAL(6,2),
  maltodextrin_grams DECIMAL(6,2),
  glucose_fructose_ratio TEXT, -- "1:0.8", "2:1", "glucose-only", etc.

  -- Additional nutritional info
  caffeine_mg INTEGER,
  protein_grams DECIMAL(6,2),
  fat_grams DECIMAL(6,2),
  fiber_grams DECIMAL(6,2),

  -- Hydration component (for drink mixes, real food)
  water_content_ml INTEGER,

  -- Metadata
  image_url TEXT,
  is_verified BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for common queries
CREATE INDEX idx_nutrition_products_category ON nutrition_products(category);
CREATE INDEX idx_nutrition_products_brand ON nutrition_products(brand);
CREATE INDEX idx_nutrition_products_active ON nutrition_products(is_active);

-- User's custom nutrition products (not shared globally)
CREATE TABLE IF NOT EXISTS user_nutrition_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,

  brand TEXT NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('gel', 'chew', 'bar', 'drink_mix', 'real_food', 'electrolyte', 'other')),

  -- Per serving nutritional info
  serving_size TEXT,
  calories INTEGER NOT NULL DEFAULT 0,
  carbs_grams DECIMAL(6,2) NOT NULL DEFAULT 0,
  sodium_mg INTEGER NOT NULL DEFAULT 0,

  -- Advanced carb data
  sugars_grams DECIMAL(6,2),
  glucose_grams DECIMAL(6,2),
  fructose_grams DECIMAL(6,2),
  maltodextrin_grams DECIMAL(6,2),
  glucose_fructose_ratio TEXT,

  -- Additional nutritional info
  caffeine_mg INTEGER,
  protein_grams DECIMAL(6,2),
  fat_grams DECIMAL(6,2),
  fiber_grams DECIMAL(6,2),

  -- Hydration component
  water_content_ml INTEGER,

  -- Metadata
  image_url TEXT,
  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_user_nutrition_products_user ON user_nutrition_products(user_id);

-- User favorite products
CREATE TABLE IF NOT EXISTS user_favorite_products (
  user_id UUID REFERENCES auth.users NOT NULL,
  product_id UUID REFERENCES nutrition_products NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, product_id)
);

-- Race nutrition plans
CREATE TABLE IF NOT EXISTS race_nutrition_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  race_plan_id UUID REFERENCES race_plans NOT NULL,

  -- Calculated targets (stored for reference)
  hourly_carbs_target INTEGER,
  hourly_fluid_target INTEGER,
  hourly_sodium_target INTEGER,
  hourly_calories_target INTEGER,

  -- Weather inputs used for calculation
  temperature_f INTEGER,
  humidity INTEGER,
  adjusted_for_weather BOOLEAN DEFAULT true,

  -- Athlete inputs
  gut_training_level TEXT CHECK (gut_training_level IN ('beginner', 'intermediate', 'advanced')),
  sweat_rate TEXT CHECK (sweat_rate IN ('light', 'average', 'heavy')),
  known_sweat_rate_ml_per_hour INTEGER,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(race_plan_id)
);

CREATE INDEX idx_race_nutrition_plans_race_plan ON race_nutrition_plans(race_plan_id);

-- Items in the nutrition plan
CREATE TABLE IF NOT EXISTS race_nutrition_plan_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nutrition_plan_id UUID REFERENCES race_nutrition_plans NOT NULL,

  -- Product reference (one of these)
  product_id UUID REFERENCES nutrition_products,
  custom_product_id UUID REFERENCES user_nutrition_products,

  -- Timing
  hour_number INTEGER NOT NULL,
  quantity INTEGER DEFAULT 1,

  -- Source tracking
  source TEXT NOT NULL CHECK (source IN ('on_bike', 'drop_bag', 'aid_station', 'crew')),
  source_location_id UUID, -- References aid_stations.id or crew_locations.id
  source_name TEXT, -- Denormalized for display

  -- Additional info
  notes TEXT,
  sort_order INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure exactly one product reference
  CONSTRAINT product_reference_check CHECK (
    (product_id IS NOT NULL AND custom_product_id IS NULL) OR
    (product_id IS NULL AND custom_product_id IS NOT NULL)
  )
);

CREATE INDEX idx_nutrition_plan_items_plan ON race_nutrition_plan_items(nutrition_plan_id);
CREATE INDEX idx_nutrition_plan_items_hour ON race_nutrition_plan_items(hour_number);

-- Water intake per hour
CREATE TABLE IF NOT EXISTS race_nutrition_plan_water (
  nutrition_plan_id UUID REFERENCES race_nutrition_plans NOT NULL,
  hour_number INTEGER NOT NULL,
  water_ml INTEGER NOT NULL DEFAULT 0,
  source TEXT CHECK (source IN ('on_bike', 'aid_station', 'crew')),
  notes TEXT,
  PRIMARY KEY (nutrition_plan_id, hour_number)
);

-- ============================================================================
-- Row Level Security Policies
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE nutrition_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_nutrition_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_favorite_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE race_nutrition_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE race_nutrition_plan_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE race_nutrition_plan_water ENABLE ROW LEVEL SECURITY;

-- Nutrition products: Public read, admin write
CREATE POLICY "Anyone can read active nutrition products"
  ON nutrition_products FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage nutrition products"
  ON nutrition_products FOR ALL
  USING (is_admin());

-- User custom products: Owner only
CREATE POLICY "Users can manage their own custom products"
  ON user_nutrition_products FOR ALL
  USING (user_id = auth.uid());

-- User favorites: Owner only
CREATE POLICY "Users can manage their own favorites"
  ON user_favorite_products FOR ALL
  USING (user_id = auth.uid());

-- Race nutrition plans: Access based on race_plan ownership
CREATE POLICY "Users can manage their race nutrition plans"
  ON race_nutrition_plans FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM race_plans
      WHERE race_plans.id = race_nutrition_plans.race_plan_id
      AND race_plans.user_id = auth.uid()
    )
  );

-- Plan items: Access based on nutrition plan ownership
CREATE POLICY "Users can manage their plan items"
  ON race_nutrition_plan_items FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM race_nutrition_plans np
      JOIN race_plans rp ON rp.id = np.race_plan_id
      WHERE np.id = race_nutrition_plan_items.nutrition_plan_id
      AND rp.user_id = auth.uid()
    )
  );

-- Plan water: Access based on nutrition plan ownership
CREATE POLICY "Users can manage their plan water"
  ON race_nutrition_plan_water FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM race_nutrition_plans np
      JOIN race_plans rp ON rp.id = np.race_plan_id
      WHERE np.id = race_nutrition_plan_water.nutrition_plan_id
      AND rp.user_id = auth.uid()
    )
  );

-- ============================================================================
-- Updated At Trigger
-- ============================================================================

-- Trigger function for updated_at
CREATE OR REPLACE FUNCTION update_nutrition_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
CREATE TRIGGER nutrition_products_updated_at
  BEFORE UPDATE ON nutrition_products
  FOR EACH ROW EXECUTE FUNCTION update_nutrition_updated_at();

CREATE TRIGGER user_nutrition_products_updated_at
  BEFORE UPDATE ON user_nutrition_products
  FOR EACH ROW EXECUTE FUNCTION update_nutrition_updated_at();

CREATE TRIGGER race_nutrition_plans_updated_at
  BEFORE UPDATE ON race_nutrition_plans
  FOR EACH ROW EXECUTE FUNCTION update_nutrition_updated_at();
