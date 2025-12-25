-- Migration: Allow viewing gear items when they're part of a public race gear selection
-- This fixes the issue where FK joins fail due to RLS blocking access to other users' gear

-- user_bikes: Allow viewing bikes linked to public gear selections
CREATE POLICY "Anyone can view bikes in public gear selections" ON user_bikes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM race_gear_selections rgs
      WHERE rgs.bike_id = user_bikes.id
      AND rgs.is_public = true
    )
  );

-- user_tires: Allow viewing tires linked to public gear selections
CREATE POLICY "Anyone can view tires in public gear selections" ON user_tires
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM race_gear_selections rgs
      WHERE (rgs.front_tire_id = user_tires.id OR rgs.rear_tire_id = user_tires.id)
      AND rgs.is_public = true
    )
  );

-- user_shoes: Allow viewing shoes linked to public gear selections
CREATE POLICY "Anyone can view shoes in public gear selections" ON user_shoes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM race_gear_selections rgs
      WHERE rgs.shoe_id = user_shoes.id
      AND rgs.is_public = true
    )
  );

-- user_repair_kits: Allow viewing repair kits linked to public gear selections
CREATE POLICY "Anyone can view repair kits in public gear selections" ON user_repair_kits
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM race_gear_selections rgs
      WHERE rgs.repair_kit_id = user_repair_kits.id
      AND rgs.is_public = true
    )
  );

-- user_bags: Allow viewing bags linked to public gear selections (via junction table)
CREATE POLICY "Anyone can view bags in public gear selections" ON user_bags
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM race_gear_bags rgb
      JOIN race_gear_selections rgs ON rgb.race_gear_selection_id = rgs.id
      WHERE rgb.bag_id = user_bags.id
      AND rgs.is_public = true
    )
  );

-- user_hydration_packs: Allow viewing hydration packs linked to public gear selections
CREATE POLICY "Anyone can view hydration packs in public gear selections" ON user_hydration_packs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM race_gear_selections rgs
      WHERE rgs.hydration_pack_id = user_hydration_packs.id
      AND rgs.is_public = true
    )
  );
