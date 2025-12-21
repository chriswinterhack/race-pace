-- Add gpx_distance_miles to store the actual calculated distance from GPX file
-- This is often different (usually longer) than the nominal distance_miles

ALTER TABLE public.race_distances
ADD COLUMN IF NOT EXISTS gpx_distance_miles numeric(6,2);

COMMENT ON COLUMN public.race_distances.gpx_distance_miles IS 'Actual distance calculated from GPX track, may differ from nominal distance_miles';
