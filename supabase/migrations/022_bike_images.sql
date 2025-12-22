-- Add image_url column to user_bikes for bike photos
ALTER TABLE public.user_bikes
ADD COLUMN IF NOT EXISTS image_url TEXT;

COMMENT ON COLUMN public.user_bikes.image_url IS 'URL to user-uploaded bike photo';

-- Create gear-images bucket for user gear photos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'gear-images',
  'gear-images',
  true,
  5242880,  -- 5MB max
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Storage policies for gear-images bucket
DROP POLICY IF EXISTS "Public gear image access" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload gear images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own gear images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own gear images" ON storage.objects;

-- Anyone can view gear images (for community features)
CREATE POLICY "Public gear image access"
ON storage.objects FOR SELECT
USING (bucket_id = 'gear-images');

-- Users can upload their own gear images
CREATE POLICY "Users can upload gear images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'gear-images'
  AND auth.role() = 'authenticated'
);

-- Users can update their own gear images
CREATE POLICY "Users can update gear images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'gear-images'
  AND auth.role() = 'authenticated'
);

-- Users can delete their own gear images
CREATE POLICY "Users can delete gear images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'gear-images'
  AND auth.role() = 'authenticated'
);
