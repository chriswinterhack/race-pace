-- Add goal_np_watts to race_plans for coach-provided or manually set power targets
-- When set, this overrides the calculated NP for the goal time

ALTER TABLE race_plans
ADD COLUMN IF NOT EXISTS goal_np_watts integer DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN race_plans.goal_np_watts IS 'Manual override for Goal Time NP (watts). When set by coach or athlete, this takes precedence over calculated value.';
