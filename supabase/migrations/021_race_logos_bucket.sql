-- Ensure race-logos bucket exists for hero images and race logos
-- This bucket was defined in 005 but may not have been pushed

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'race-logos',
  'race-logos',
  true,
  5242880,  -- 5MB max
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Ensure storage policies exist (drop and recreate to avoid conflicts)
DROP POLICY IF EXISTS "Public race logo access" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload race logos" ON storage.objects;

-- Allow public read access
CREATE POLICY "Public race logo access"
ON storage.objects FOR SELECT
USING (bucket_id = 'race-logos');

-- Allow anyone to upload (we use service role key in API so this is just a fallback)
CREATE POLICY "Anyone can upload race logos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'race-logos');
