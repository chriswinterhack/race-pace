-- Add course profile columns to race_distances
-- These are populated by analyzing GPX elevation data

ALTER TABLE public.race_distances
ADD COLUMN IF NOT EXISTS climbing_pct NUMERIC(5,2),
ADD COLUMN IF NOT EXISTS flat_pct NUMERIC(5,2),
ADD COLUMN IF NOT EXISTS descent_pct NUMERIC(5,2),
ADD COLUMN IF NOT EXISTS avg_climb_grade NUMERIC(4,2),
ADD COLUMN IF NOT EXISTS avg_descent_grade NUMERIC(4,2),
ADD COLUMN IF NOT EXISTS total_elevation_loss INTEGER;

-- Add comments for documentation
COMMENT ON COLUMN public.race_distances.climbing_pct IS 'Percentage of course that is climbing (>= 2% grade)';
COMMENT ON COLUMN public.race_distances.flat_pct IS 'Percentage of course that is flat (-2% to 2% grade)';
COMMENT ON COLUMN public.race_distances.descent_pct IS 'Percentage of course that is descending (<= -2% grade)';
COMMENT ON COLUMN public.race_distances.avg_climb_grade IS 'Average grade percentage on climbing sections';
COMMENT ON COLUMN public.race_distances.avg_descent_grade IS 'Average grade percentage on descending sections (negative)';
COMMENT ON COLUMN public.race_distances.total_elevation_loss IS 'Total elevation loss in feet (from GPX analysis)';
