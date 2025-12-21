-- Migration: Add race type to races table
-- This categorizes races as Bike (Road/MTB/Gravel) or Run
-- Used for conditional gear display and participant comparisons

-- Add race type columns to races table
ALTER TABLE races
ADD COLUMN IF NOT EXISTS race_type TEXT CHECK (race_type IN ('bike', 'run')),
ADD COLUMN IF NOT EXISTS race_subtype TEXT;

-- Add constraint for race_subtype based on race_type
-- For bike: road, mtb, gravel
-- For run: trail, ultra, road (future)
ALTER TABLE races
ADD CONSTRAINT races_subtype_check
CHECK (
  (race_type = 'bike' AND race_subtype IN ('road', 'mtb', 'gravel')) OR
  (race_type = 'run' AND race_subtype IN ('trail', 'ultra', 'road')) OR
  (race_type IS NULL AND race_subtype IS NULL)
);

-- Update existing races to have a default type (gravel for now since most initial races are gravel)
-- You can manually update these in the admin UI
UPDATE races SET race_type = 'bike', race_subtype = 'gravel' WHERE race_type IS NULL;

-- Make race_type required going forward
ALTER TABLE races ALTER COLUMN race_type SET NOT NULL;
ALTER TABLE races ALTER COLUMN race_subtype SET NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN races.race_type IS 'Primary race type: bike or run';
COMMENT ON COLUMN races.race_subtype IS 'Race subtype: bike (road/mtb/gravel), run (trail/ultra/road)';

-- Create an index for filtering by race type
CREATE INDEX IF NOT EXISTS idx_races_type ON races(race_type, race_subtype);
