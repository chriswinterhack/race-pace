-- Increase file size limits for image buckets to 10MB
-- Hero images should be high quality

UPDATE storage.buckets
SET file_size_limit = 10485760  -- 10MB
WHERE id = 'race-logos';

UPDATE storage.buckets
SET file_size_limit = 10485760  -- 10MB
WHERE id = 'gear-images';
