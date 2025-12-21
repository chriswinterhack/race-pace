-- Add race logistics fields for comprehensive day-of-event information
-- This consolidates all the info athletes need so they don't have to dig through organizer websites

ALTER TABLE public.races
ADD COLUMN IF NOT EXISTS parking_info TEXT,
ADD COLUMN IF NOT EXISTS packet_pickup JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS event_schedule JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS crew_info TEXT,
ADD COLUMN IF NOT EXISTS drop_bag_info TEXT,
ADD COLUMN IF NOT EXISTS course_rules TEXT,
ADD COLUMN IF NOT EXISTS course_marking TEXT,
ADD COLUMN IF NOT EXISTS weather_notes TEXT,
ADD COLUMN IF NOT EXISTS additional_info TEXT;

-- Comments for documentation
COMMENT ON COLUMN public.races.parking_info IS 'Parking locations, fees, shuttle info, overnight rules';
COMMENT ON COLUMN public.races.packet_pickup IS 'Array of {date, start_time, end_time, location, notes}';
COMMENT ON COLUMN public.races.event_schedule IS 'Array of {time, title, description} for race day timeline';
COMMENT ON COLUMN public.races.crew_info IS 'Crew access points, rules, reserved areas';
COMMENT ON COLUMN public.races.drop_bag_info IS 'Drop bag locations, requirements, labeling instructions';
COMMENT ON COLUMN public.races.course_rules IS 'Important rules, DQ conditions, number placement';
COMMENT ON COLUMN public.races.course_marking IS 'How course is marked (flags, tape colors, signs)';
COMMENT ON COLUMN public.races.weather_notes IS 'Typical conditions, altitude considerations, what to prepare for';
COMMENT ON COLUMN public.races.additional_info IS 'Any other important notes';
