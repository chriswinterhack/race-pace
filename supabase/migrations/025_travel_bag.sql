-- Add travel_bag to the bag_type constraint
-- This migration adds 'travel_bag' as a valid bag type option

-- Drop the existing constraint and add a new one with travel_bag included
ALTER TABLE user_bags DROP CONSTRAINT IF EXISTS user_bags_bag_type_check;

ALTER TABLE user_bags ADD CONSTRAINT user_bags_bag_type_check
  CHECK (bag_type IN ('saddle', 'frame', 'handlebar', 'top_tube', 'stem', 'feed', 'travel_bag'));
