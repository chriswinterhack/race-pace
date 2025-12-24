-- Add is_admin boolean flag to users table
-- This separates "admin privileges" from "user type" (role)
--
-- role: athlete | coach (what type of user they are)
-- is_admin: true | false (can they manage races, users, system settings)

ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE NOT NULL;

-- Add index for admin lookups
CREATE INDEX IF NOT EXISTS idx_users_is_admin ON public.users(is_admin) WHERE is_admin = TRUE;

-- Add comment for clarity
COMMENT ON COLUMN public.users.is_admin IS 'System admin privileges - can manage races, users, and system settings';
COMMENT ON COLUMN public.users.role IS 'User type - athlete or coach (determines features available, not admin access)';
