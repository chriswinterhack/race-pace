-- FinalClimb: Update shoe schema for cycling shoes
-- Remove running-specific fields (stack_mm, drop_mm) and add cleat_type

-- Add cleat_type column
ALTER TABLE user_shoes
ADD COLUMN IF NOT EXISTS cleat_type TEXT
CHECK (cleat_type IS NULL OR cleat_type IN ('spd', 'spd_sl', 'look', 'speedplay', 'time', 'flat'));

-- Update shoe_type constraint for cycling shoes
ALTER TABLE user_shoes
DROP CONSTRAINT IF EXISTS user_shoes_shoe_type_check;

ALTER TABLE user_shoes
ADD CONSTRAINT user_shoes_shoe_type_check
CHECK (shoe_type IS NULL OR shoe_type IN ('road', 'gravel', 'mtb', 'flat'));

-- Drop running-specific columns if they exist
ALTER TABLE user_shoes DROP COLUMN IF EXISTS stack_mm;
ALTER TABLE user_shoes DROP COLUMN IF EXISTS drop_mm;
