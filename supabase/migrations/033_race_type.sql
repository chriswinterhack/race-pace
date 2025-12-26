-- Add race_type to race_distances for power calculation adjustments
-- Race type affects the "real world factor" applied to calculated power

-- Create enum type for race types
DO $$ BEGIN
  CREATE TYPE race_type AS ENUM ('road', 'gravel', 'xc_mtb', 'ultra_mtb');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Add race_type column to race_distances
ALTER TABLE race_distances
ADD COLUMN IF NOT EXISTS race_type race_type DEFAULT 'gravel';

-- Add comment for documentation
COMMENT ON COLUMN race_distances.race_type IS 'Race type affects real-world power adjustment: road (0.90), gravel (0.97), xc_mtb (0.96), ultra_mtb (0.94)';

-- Update existing races based on their characteristics
-- Leadville is ultra_mtb
UPDATE race_distances
SET race_type = 'ultra_mtb'
WHERE id IN (
  SELECT rd.id FROM race_distances rd
  JOIN race_editions re ON rd.race_edition_id = re.id
  JOIN races r ON re.race_id = r.id
  WHERE r.slug = 'leadville-100'
);

-- Chequamegon is xc_mtb (MTB-style race)
UPDATE race_distances
SET race_type = 'xc_mtb'
WHERE id IN (
  SELECT rd.id FROM race_distances rd
  JOIN race_editions re ON rd.race_edition_id = re.id
  JOIN races r ON re.race_id = r.id
  WHERE r.slug = 'chequamegon-40'
);
