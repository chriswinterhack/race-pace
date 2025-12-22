-- Add power settings columns to athlete_profiles
-- These allow customization of intensity factors per athlete

ALTER TABLE athlete_profiles
ADD COLUMN IF NOT EXISTS if_safe NUMERIC(3,2) DEFAULT 0.67,
ADD COLUMN IF NOT EXISTS if_tempo NUMERIC(3,2) DEFAULT 0.70,
ADD COLUMN IF NOT EXISTS if_pushing NUMERIC(3,2) DEFAULT 0.73,
ADD COLUMN IF NOT EXISTS power_settings_locked BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS power_settings_locked_by UUID REFERENCES users(id) ON DELETE SET NULL;

-- Add index for coach lookups
CREATE INDEX IF NOT EXISTS idx_athlete_profiles_locked_by
ON athlete_profiles(power_settings_locked_by)
WHERE power_settings_locked = TRUE;

-- Add comments for documentation
COMMENT ON COLUMN athlete_profiles.if_safe IS 'Intensity factor for Safe zone (0.50-0.80)';
COMMENT ON COLUMN athlete_profiles.if_tempo IS 'Intensity factor for Tempo zone (0.55-0.85)';
COMMENT ON COLUMN athlete_profiles.if_pushing IS 'Intensity factor for Pushing zone (0.60-0.90)';
COMMENT ON COLUMN athlete_profiles.power_settings_locked IS 'If true, athlete cannot edit IF values or AA%';
COMMENT ON COLUMN athlete_profiles.power_settings_locked_by IS 'Coach who locked the settings';
