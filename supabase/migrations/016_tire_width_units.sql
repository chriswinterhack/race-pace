-- Update tire width schema to support both mm and inch units

-- Add width_unit column
ALTER TABLE user_tires
ADD COLUMN IF NOT EXISTS width_unit TEXT DEFAULT 'mm'
CHECK (width_unit IN ('mm', 'in'));

-- Rename width_mm to width_value for clarity
ALTER TABLE user_tires
RENAME COLUMN width_mm TO width_value;

-- Allow decimal values for inch measurements (e.g., 2.25)
ALTER TABLE user_tires
ALTER COLUMN width_value TYPE NUMERIC(5,2);
