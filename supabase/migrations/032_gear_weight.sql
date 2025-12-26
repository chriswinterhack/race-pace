-- Add gear weight column to athlete_profiles
-- This allows users to specify their total equipment weight (bike + hydration + gear)
-- for more accurate power calculations on climbs

ALTER TABLE athlete_profiles
ADD COLUMN IF NOT EXISTS gear_weight_kg NUMERIC(4,1) DEFAULT 12.0;

-- Comment for documentation
COMMENT ON COLUMN athlete_profiles.gear_weight_kg IS 'Total equipment weight in kg (bike + hydration pack + gear). Default 12kg (~26lbs). Typical range: 8-18kg depending on bike type and setup.';
