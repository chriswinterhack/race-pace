-- Split single name field into first_name and last_name for better user profiles

-- Add new columns
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS first_name TEXT,
ADD COLUMN IF NOT EXISTS last_name TEXT;

-- Migrate existing name data (split on first space)
UPDATE public.users
SET
  first_name = CASE
    WHEN name IS NOT NULL AND name != '' THEN
      CASE
        WHEN position(' ' in name) > 0 THEN substring(name from 1 for position(' ' in name) - 1)
        ELSE name
      END
    ELSE NULL
  END,
  last_name = CASE
    WHEN name IS NOT NULL AND name != '' AND position(' ' in name) > 0 THEN
      substring(name from position(' ' in name) + 1)
    ELSE NULL
  END
WHERE name IS NOT NULL AND (first_name IS NULL OR last_name IS NULL);

-- Add comments for documentation
COMMENT ON COLUMN public.users.first_name IS 'User first name';
COMMENT ON COLUMN public.users.last_name IS 'User last name';
