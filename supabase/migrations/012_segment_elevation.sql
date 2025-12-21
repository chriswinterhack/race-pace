-- Add elevation data to segments for terrain-adjusted pacing
ALTER TABLE public.segments
ADD COLUMN IF NOT EXISTS elevation_gain integer,
ADD COLUMN IF NOT EXISTS elevation_loss integer,
ADD COLUMN IF NOT EXISTS avg_gradient numeric(4,1);

COMMENT ON COLUMN public.segments.elevation_gain IS 'Total elevation gain in feet for this segment';
COMMENT ON COLUMN public.segments.elevation_loss IS 'Total elevation loss in feet for this segment';
COMMENT ON COLUMN public.segments.avg_gradient IS 'Average gradient percentage for this segment';
