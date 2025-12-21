-- Add start_time to race_plans for athlete-specific start times
-- This allows athletes to set their own start time based on corral/wave assignments

ALTER TABLE public.race_plans
ADD COLUMN start_time time;

-- Add comment explaining the field
COMMENT ON COLUMN public.race_plans.start_time IS 'Athlete-specific start time (e.g., for different corrals/waves). Falls back to race_distances.start_time if null.';
