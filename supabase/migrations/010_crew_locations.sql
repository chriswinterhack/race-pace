-- Add structured crew locations field
-- Crew locations are separate from aid stations - they're where crews can access the course

ALTER TABLE public.races
ADD COLUMN IF NOT EXISTS crew_locations JSONB DEFAULT '[]';

-- Structure for crew_locations:
-- Array of {
--   name: string,
--   mile_out: number (mile marker on outbound),
--   mile_in: number (mile marker on return, for out-and-back courses),
--   access_type: 'unlimited' | 'limited' | 'reserved',
--   parking_info: string,
--   setup_time: string,
--   shuttle_info: string,
--   notes: string,
--   restrictions: string
-- }

COMMENT ON COLUMN public.races.crew_locations IS 'Array of crew access points with mile markers, access type, and logistics';
