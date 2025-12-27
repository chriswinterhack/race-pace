-- Add city and state fields to users table for location-based features
-- This enables future features like showing nearby participants and training partners

ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS state TEXT;

-- Add index for location-based queries
CREATE INDEX IF NOT EXISTS idx_users_location ON public.users(state, city)
WHERE state IS NOT NULL;

-- Comment for documentation
COMMENT ON COLUMN public.users.city IS 'User city for location-based features';
COMMENT ON COLUMN public.users.state IS 'US state code (e.g., CO, CA) for location-based features';
