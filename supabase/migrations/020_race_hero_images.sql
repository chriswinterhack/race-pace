-- Add hero image URL to races for visual race cards
ALTER TABLE public.races
ADD COLUMN IF NOT EXISTS hero_image_url TEXT;

COMMENT ON COLUMN public.races.hero_image_url IS 'Hero/banner image URL for race cards (landscape, 16:9 ratio recommended)';

-- Update storage bucket to allow hero images
-- (Using existing race-logos bucket which already allows images)
