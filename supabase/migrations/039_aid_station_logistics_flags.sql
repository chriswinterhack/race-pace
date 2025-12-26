-- Migration: Add drop bag and crew access flags to aid stations
-- Aid stations are stored as JSONB in race_distances.aid_stations
-- This migration documents the new fields and updates the comment

-- The aid_stations JSONB column in race_distances now supports:
-- {
--   name: string,
--   mile: number,
--   supplies?: string[],
--   cutoff_time?: string,
--   type?: "aid_station" | "checkpoint",
--   is_drop_bag?: boolean,      -- NEW: Can athletes drop bags here?
--   is_crew_access?: boolean,   -- NEW: Can crew access this location?
--   drop_bag_notes?: string,    -- NEW: Instructions for drop bags
--   crew_notes?: string         -- NEW: Instructions for crew
-- }

-- Update column comment to document the new structure
COMMENT ON COLUMN public.race_distances.aid_stations IS 'Array of aid stations: [{name, mile, supplies?, cutoff_time?, type?, is_drop_bag?, is_crew_access?, drop_bag_notes?, crew_notes?}]';

-- No data migration needed - JSONB columns accept new fields automatically
-- Existing aid stations will have is_drop_bag and is_crew_access as null/undefined
-- which is treated as false in the application layer
