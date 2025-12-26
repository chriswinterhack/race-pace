-- Performance optimization indexes
-- These indexes address slow queries identified in performance audit

-- Critical: race_plans.race_distance_id is used in every race plan lookup
-- This FK was added but never indexed
CREATE INDEX IF NOT EXISTS idx_race_plans_race_distance_id
ON race_plans(race_distance_id);

-- Composite index for segments ordered by race_plan_id and segment_order
-- Improves segment list queries which always order by segment_order
CREATE INDEX IF NOT EXISTS idx_segments_race_plan_order
ON segments(race_plan_id, segment_order);

-- race_plans user lookup with created_at for dashboard sorting
CREATE INDEX IF NOT EXISTS idx_race_plans_user_created
ON race_plans(user_id, created_at DESC);

-- race_nutrition_plans lookup by race_plan_id
CREATE INDEX IF NOT EXISTS idx_race_nutrition_plans_race_plan_id
ON race_nutrition_plans(race_plan_id);

-- race_nutrition_plan_items compound index for efficient fetches
CREATE INDEX IF NOT EXISTS idx_nutrition_plan_items_plan_hour
ON race_nutrition_plan_items(nutrition_plan_id, hour_number);

-- race_nutrition_plan_water lookup
CREATE INDEX IF NOT EXISTS idx_nutrition_plan_water_plan_id
ON race_nutrition_plan_water(nutrition_plan_id);

-- race_editions with race_id for faster joins
CREATE INDEX IF NOT EXISTS idx_race_editions_race_active
ON race_editions(race_id, is_active);

-- race_distances with edition_id for faster joins
CREATE INDEX IF NOT EXISTS idx_race_distances_edition_active
ON race_distances(race_edition_id, is_active);

-- Gear selections compound index for user's race gear lookups
CREATE INDEX IF NOT EXISTS idx_race_gear_user_race
ON race_gear_selections(user_id, race_distance_id);

-- Analyze tables to update statistics for query planner
ANALYZE race_plans;
ANALYZE segments;
ANALYZE race_distances;
ANALYZE race_editions;
ANALYZE race_nutrition_plans;
ANALYZE race_nutrition_plan_items;
