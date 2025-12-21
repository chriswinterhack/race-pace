-- Create the gpx-files bucket if it doesn't exist
-- This is a simpler version to ensure the bucket exists

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'gpx-files',
  'gpx-files',
  true,
  10485760,
  ARRAY['application/gpx+xml', 'application/xml', 'text/xml', 'application/octet-stream']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Ensure storage policies exist (drop and recreate to avoid conflicts)
DROP POLICY IF EXISTS "Public GPX file access" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload GPX files" ON storage.objects;

-- Allow public read access
CREATE POLICY "Public GPX file access"
ON storage.objects FOR SELECT
USING (bucket_id = 'gpx-files');

-- Allow anyone to upload (we use service role key in API so this is just a fallback)
CREATE POLICY "Anyone can upload GPX files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'gpx-files');
