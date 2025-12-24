-- ============================================================================
-- Expanded Nutrition Products Seed Data
-- Comprehensive database of sports nutrition products from major brands
-- ============================================================================

-- Add a unique constraint on brand + name if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'nutrition_products_brand_name_unique'
  ) THEN
    ALTER TABLE nutrition_products ADD CONSTRAINT nutrition_products_brand_name_unique UNIQUE (brand, name);
  END IF;
END $$;

-- ============================================================================
-- NEVERSECOND
-- ============================================================================
INSERT INTO nutrition_products (brand, name, category, serving_size, calories, carbs_grams, sodium_mg, glucose_fructose_ratio, caffeine_mg, is_verified, is_active) VALUES
('Neversecond', 'C30 Energy Gel - Citrus', 'gel', '60ml', 120, 30, 200, '2:1', NULL, true, true),
('Neversecond', 'C30 Energy Gel - Citrus Mango', 'gel', '60ml', 120, 30, 200, '2:1', NULL, true, true),
('Neversecond', 'C30 Energy Gel - Berry', 'gel', '60ml', 120, 30, 200, '2:1', NULL, true, true),
('Neversecond', 'C30+ Caffeine Gel - Espresso', 'gel', '60ml', 120, 30, 200, '2:1', 75, true, true),
('Neversecond', 'C30+ Caffeine Gel - Cola', 'gel', '60ml', 120, 30, 200, '2:1', 75, true, true),
('Neversecond', 'C30 Sports Drink - Citrus', 'drink_mix', '32g', 120, 30, 200, '2:1', NULL, true, true),
('Neversecond', 'C30 Sports Drink - Orange', 'drink_mix', '32g', 120, 30, 200, '2:1', NULL, true, true),
('Neversecond', 'C30 Sports Drink - Unflavored', 'drink_mix', '32g', 120, 30, 200, '2:1', NULL, true, true),
('Neversecond', 'C90 High-Carb Mix', 'drink_mix', 'sachet', 360, 90, 600, '2:1', NULL, true, true),
('Neversecond', 'C30 Fuel Bar - Cocoa', 'bar', '45g', 160, 30, 200, '2:1', NULL, true, true),
('Neversecond', 'S200 Sodium Booster', 'electrolyte', '1 capful', 0, 0, 200, NULL, NULL, true, true)
ON CONFLICT (brand, name) DO NOTHING;

-- ============================================================================
-- MAURTEN
-- ============================================================================
INSERT INTO nutrition_products (brand, name, category, serving_size, calories, carbs_grams, sodium_mg, glucose_fructose_ratio, caffeine_mg, is_verified, is_active) VALUES
('Maurten', 'Gel 100', 'gel', '40g', 100, 25, 20, '1:0.8', NULL, true, true),
('Maurten', 'Gel 160', 'gel', '65g', 160, 40, 30, '1:0.8', NULL, true, true),
('Maurten', 'Gel 100 Caf 100', 'gel', '40g', 100, 25, 20, '1:0.8', 100, true, true),
('Maurten', 'Drink Mix 160', 'drink_mix', '40g', 160, 40, 15, '1:0.5', NULL, true, true),
('Maurten', 'Drink Mix 320', 'drink_mix', '80g', 320, 80, 30, '1:0.7', NULL, true, true),
('Maurten', 'Drink Mix 320 Caf 100', 'drink_mix', '80g', 320, 80, 30, '1:0.7', 100, true, true),
('Maurten', 'Solid 225', 'bar', '60g', 225, 45, 65, '1:0.8', NULL, true, true),
('Maurten', 'Solid 225 Caf 100', 'bar', '60g', 225, 45, 65, '1:0.8', 100, true, true)
ON CONFLICT (brand, name) DO NOTHING;

-- ============================================================================
-- GU ENERGY
-- ============================================================================
INSERT INTO nutrition_products (brand, name, category, serving_size, calories, carbs_grams, sodium_mg, glucose_fructose_ratio, caffeine_mg, is_verified, is_active) VALUES
('GU', 'Energy Gel - Strawberry Banana', 'gel', '32g', 100, 22, 60, '70:30', NULL, true, true),
('GU', 'Energy Gel - Lemon Lime', 'gel', '32g', 100, 22, 60, '70:30', NULL, true, true),
('GU', 'Energy Gel - Peanut Butter', 'gel', '32g', 100, 22, 60, '70:30', NULL, true, true),
('GU', 'Energy Gel - Root Beer', 'gel', '32g', 100, 22, 60, '70:30', NULL, true, true),
('GU', 'Energy Gel - Birthday Cake', 'gel', '32g', 100, 22, 60, '70:30', NULL, true, true),
('GU', 'Energy Gel - Raspberry Lemonade', 'gel', '32g', 100, 22, 60, '70:30', NULL, true, true),
('GU', 'Energy Gel - Mandarin Orange', 'gel', '32g', 100, 22, 60, '70:30', 20, true, true),
('GU', 'Energy Gel - Vanilla Bean', 'gel', '32g', 100, 22, 60, '70:30', 20, true, true),
('GU', 'Energy Gel - Chocolate Outrage', 'gel', '32g', 100, 22, 60, '70:30', 20, true, true),
('GU', 'Energy Gel - Tri-Berry', 'gel', '32g', 100, 22, 60, '70:30', 20, true, true),
('GU', 'Energy Gel - Tastefully Nude', 'gel', '32g', 100, 22, 60, '70:30', 20, true, true),
('GU', 'Energy Gel - Salted Watermelon', 'gel', '32g', 100, 22, 125, '70:30', 20, true, true),
('GU', 'Energy Gel - Salted Caramel', 'gel', '32g', 100, 22, 125, '70:30', 20, true, true),
('GU', 'Energy Gel - Espresso Love', 'gel', '32g', 100, 22, 60, '70:30', 40, true, true),
('GU', 'Energy Gel - Caramel Macchiato', 'gel', '32g', 100, 22, 60, '70:30', 40, true, true),
('GU', 'Energy Gel - Jet Blackberry', 'gel', '32g', 100, 22, 60, '70:30', 40, true, true),
('GU', 'Energy Gel - Cola Me Happy', 'gel', '32g', 100, 22, 60, '70:30', 40, true, true),
('GU', 'Roctane Gel - Cherry Lime', 'gel', '32g', 100, 21, 70, '70:30', 35, true, true),
('GU', 'Roctane Gel - Strawberry Kiwi', 'gel', '32g', 100, 21, 70, '70:30', 35, true, true),
('GU', 'Roctane Gel - Vanilla Orange', 'gel', '32g', 100, 21, 70, '70:30', 35, true, true),
('GU', 'Roctane Gel - Chocolate Coconut', 'gel', '32g', 100, 21, 70, '70:30', 35, true, true),
('GU', 'Roctane Gel - Sea Salt Chocolate', 'gel', '32g', 100, 21, 125, '70:30', 35, true, true),
('GU', 'Roctane Gel - Cold Brew Coffee', 'gel', '32g', 100, 21, 70, '70:30', 70, true, true),
('GU', 'Energy Chews - Strawberry', 'chew', '60g (8 chews)', 160, 36, 80, NULL, NULL, true, true),
('GU', 'Energy Chews - Orange', 'chew', '60g (8 chews)', 160, 36, 80, NULL, NULL, true, true),
('GU', 'Energy Chews - Watermelon', 'chew', '60g (8 chews)', 160, 36, 80, NULL, NULL, true, true),
('GU', 'Energy Chews - Blueberry Pomegranate', 'chew', '60g (8 chews)', 160, 36, 80, NULL, 20, true, true),
('GU', 'Hydration Drink Mix - Lemon Lime', 'drink_mix', '12g', 40, 10, 320, NULL, NULL, true, true),
('GU', 'Hydration Drink Mix - Orange', 'drink_mix', '12g', 40, 10, 320, NULL, NULL, true, true),
('GU', 'Hydration Drink Mix - Tri-Berry', 'drink_mix', '12g', 40, 10, 320, NULL, NULL, true, true),
('GU', 'Hydration Drink Mix - Strawberry Lemonade', 'drink_mix', '12g', 40, 10, 320, NULL, NULL, true, true),
('GU', 'Roctane Drink Mix - Lemon Berry', 'drink_mix', '65g', 250, 59, 440, '70:30', NULL, true, true),
('GU', 'Roctane Drink Mix - Tropical Fruit', 'drink_mix', '65g', 250, 59, 440, '70:30', NULL, true, true),
('GU', 'Roctane Drink Mix - Summit Tea', 'drink_mix', '65g', 250, 59, 440, '70:30', 35, true, true)
ON CONFLICT (brand, name) DO NOTHING;

-- ============================================================================
-- SCIENCE IN SPORT (SiS)
-- ============================================================================
INSERT INTO nutrition_products (brand, name, category, serving_size, calories, carbs_grams, sodium_mg, glucose_fructose_ratio, caffeine_mg, is_verified, is_active) VALUES
('SiS', 'GO Isotonic Gel - Apple', 'gel', '60ml', 87, 22, 10, 'maltodextrin', NULL, true, true),
('SiS', 'GO Isotonic Gel - Orange', 'gel', '60ml', 87, 22, 10, 'maltodextrin', NULL, true, true),
('SiS', 'GO Isotonic Gel - Lemon Lime', 'gel', '60ml', 87, 22, 10, 'maltodextrin', NULL, true, true),
('SiS', 'GO Isotonic Gel - Tropical', 'gel', '60ml', 87, 22, 10, 'maltodextrin', NULL, true, true),
('SiS', 'GO Isotonic Gel - Pineapple', 'gel', '60ml', 87, 22, 10, 'maltodextrin', NULL, true, true),
('SiS', 'GO Isotonic Gel - Blackcurrant', 'gel', '60ml', 87, 22, 10, 'maltodextrin', NULL, true, true),
('SiS', 'GO Isotonic Gel - Citrus', 'gel', '60ml', 87, 22, 10, 'maltodextrin', NULL, true, true),
('SiS', 'GO Isotonic Gel + Caffeine - Cola', 'gel', '60ml', 87, 22, 10, 'maltodextrin', 75, true, true),
('SiS', 'GO Isotonic Gel + Caffeine - Double Espresso', 'gel', '60ml', 87, 22, 10, 'maltodextrin', 150, true, true),
('SiS', 'GO Energy + Electrolyte Gel - Raspberry', 'gel', '60ml', 87, 22, 118, 'maltodextrin', NULL, true, true),
('SiS', 'GO Energy + Electrolyte Gel - Lemon Mint', 'gel', '60ml', 87, 22, 118, 'maltodextrin', NULL, true, true),
('SiS', 'GO Energy + Electrolyte Gel - Salted Strawberry', 'gel', '60ml', 87, 22, 118, 'maltodextrin', NULL, true, true),
('SiS', 'Beta Fuel Gel - Apple', 'gel', '60ml', 160, 40, 20, '1:0.8', NULL, true, true),
('SiS', 'Beta Fuel Gel - Orange', 'gel', '60ml', 160, 40, 20, '1:0.8', NULL, true, true),
('SiS', 'Beta Fuel Gel - Strawberry Lime', 'gel', '60ml', 160, 40, 20, '1:0.8', NULL, true, true),
('SiS', 'Beta Fuel Gel + Nootropics', 'gel', '60ml', 160, 40, 20, '1:0.8', 200, true, true),
('SiS', 'Beta Fuel 80 Drink Mix - Orange', 'drink_mix', '84g', 308, 80, 10, '1:0.8', NULL, true, true),
('SiS', 'Beta Fuel 80 Drink Mix - Lemon Lime', 'drink_mix', '84g', 308, 80, 10, '1:0.8', NULL, true, true),
('SiS', 'GO Energy Powder - Orange', 'drink_mix', '50g', 189, 47, 20, 'maltodextrin', NULL, true, true),
('SiS', 'GO Energy Powder - Lemon Lime', 'drink_mix', '50g', 189, 47, 20, 'maltodextrin', NULL, true, true),
('SiS', 'GO Hydro Electrolyte - Berry', 'electrolyte', '1 tablet', 8, 1, 300, NULL, NULL, true, true),
('SiS', 'GO Hydro Electrolyte - Lemon', 'electrolyte', '1 tablet', 8, 1, 300, NULL, NULL, true, true),
('SiS', 'GO Hydro Electrolyte - Cola + Caffeine', 'electrolyte', '1 tablet', 8, 1, 300, NULL, 75, true, true),
('SiS', 'GO Energy Bake - Banana', 'bar', '50g', 200, 38, 45, NULL, NULL, true, true),
('SiS', 'GO Energy Bar - Chocolate Fudge', 'bar', '40g', 151, 26, 30, NULL, NULL, true, true),
('SiS', 'GO Energy Bar - Red Berry', 'bar', '40g', 151, 26, 30, NULL, NULL, true, true)
ON CONFLICT (brand, name) DO NOTHING;

-- ============================================================================
-- SKRATCH LABS
-- ============================================================================
INSERT INTO nutrition_products (brand, name, category, serving_size, calories, carbs_grams, sodium_mg, glucose_fructose_ratio, caffeine_mg, is_verified, is_active) VALUES
('Skratch Labs', 'Sport Hydration Mix - Lemon Lime', 'drink_mix', '22g', 80, 20, 380, 'glucose+fructose', NULL, true, true),
('Skratch Labs', 'Sport Hydration Mix - Orange', 'drink_mix', '22g', 80, 20, 380, 'glucose+fructose', NULL, true, true),
('Skratch Labs', 'Sport Hydration Mix - Strawberry Lemonade', 'drink_mix', '22g', 80, 20, 380, 'glucose+fructose', NULL, true, true),
('Skratch Labs', 'Sport Hydration Mix - Raspberry Limeade', 'drink_mix', '22g', 80, 20, 380, 'glucose+fructose', NULL, true, true),
('Skratch Labs', 'Sport Hydration Mix - Fruit Punch', 'drink_mix', '22g', 80, 20, 380, 'glucose+fructose', NULL, true, true),
('Skratch Labs', 'Sport Hydration Mix - Matcha Green Tea + Lemon', 'drink_mix', '22g', 80, 20, 380, 'glucose+fructose', 20, true, true),
('Skratch Labs', 'Super High-Carb Drink Mix - Lemon Lime', 'drink_mix', '90g', 400, 100, 380, 'maltodextrin+fructose', NULL, true, true),
('Skratch Labs', 'Super High-Carb Drink Mix - Orange', 'drink_mix', '90g', 400, 100, 380, 'maltodextrin+fructose', NULL, true, true),
('Skratch Labs', 'Super High-Carb Drink Mix - Raspberry', 'drink_mix', '90g', 400, 100, 380, 'maltodextrin+fructose', NULL, true, true),
('Skratch Labs', 'Super High-Carb Drink Mix - Unflavored', 'drink_mix', '90g', 400, 100, 380, 'maltodextrin+fructose', NULL, true, true),
('Skratch Labs', 'Energy Chews - Raspberry', 'chew', '50g', 160, 36, 80, NULL, NULL, true, true),
('Skratch Labs', 'Energy Chews - Orange', 'chew', '50g', 160, 36, 80, NULL, NULL, true, true),
('Skratch Labs', 'Energy Chews - Sour Cherry', 'chew', '50g', 160, 36, 80, NULL, NULL, true, true),
('Skratch Labs', 'Energy Bar - Chocolate Chip & Almonds', 'bar', '50g', 180, 26, 200, NULL, NULL, true, true),
('Skratch Labs', 'Energy Bar - Cherries & Pistachios', 'bar', '50g', 180, 26, 200, NULL, NULL, true, true),
('Skratch Labs', 'Energy Bar - Raspberries & Lemons', 'bar', '50g', 180, 26, 200, NULL, NULL, true, true),
('Skratch Labs', 'Anytime Energy Bar - Chocolate Chip', 'bar', '50g', 200, 24, 120, NULL, NULL, true, true)
ON CONFLICT (brand, name) DO NOTHING;

-- ============================================================================
-- PRECISION FUEL & HYDRATION
-- ============================================================================
INSERT INTO nutrition_products (brand, name, category, serving_size, calories, carbs_grams, sodium_mg, glucose_fructose_ratio, caffeine_mg, is_verified, is_active) VALUES
('Precision Fuel', 'PF 30 Gel - Original', 'gel', '50g', 120, 30, 0, '2:1', NULL, true, true),
('Precision Fuel', 'PF 30 Gel - Lemon', 'gel', '50g', 120, 30, 0, '2:1', NULL, true, true),
('Precision Fuel', 'PF 30 Gel + Caffeine', 'gel', '51g', 120, 30, 0, '2:1', 100, true, true),
('Precision Fuel', 'PF 90 Gel - Original', 'gel', '130g', 360, 90, 0, '2:1', NULL, true, true),
('Precision Fuel', 'PF 30 Drink Mix', 'drink_mix', '47g', 120, 30, 500, '2:1', NULL, true, true),
('Precision Fuel', 'PF 60 Drink Mix', 'drink_mix', '94g', 240, 60, 1000, '2:1', NULL, true, true),
('Precision Fuel', 'PH 250 Electrolyte - Low Sodium', 'electrolyte', '1 capsule', 0, 0, 250, NULL, NULL, true, true),
('Precision Fuel', 'PH 500 Electrolyte - Medium Sodium', 'electrolyte', '1 capsule', 0, 0, 500, NULL, NULL, true, true),
('Precision Fuel', 'PH 1000 Electrolyte - High Sodium', 'electrolyte', '1 tablet', 5, 1, 1000, NULL, NULL, true, true),
('Precision Fuel', 'PH 1500 Electrolyte - Very High Sodium', 'electrolyte', '1 tablet', 5, 1, 1500, NULL, NULL, true, true),
('Precision Fuel', 'PF 30 Chew - Original', 'chew', '38g', 120, 30, 0, '2:1', NULL, true, true)
ON CONFLICT (brand, name) DO NOTHING;

-- ============================================================================
-- TAILWIND NUTRITION
-- ============================================================================
INSERT INTO nutrition_products (brand, name, category, serving_size, calories, carbs_grams, sodium_mg, glucose_fructose_ratio, caffeine_mg, is_verified, is_active) VALUES
('Tailwind', 'Endurance Fuel - Mandarin Orange', 'drink_mix', '27g (1 scoop)', 100, 25, 303, 'glucose+sucrose', NULL, true, true),
('Tailwind', 'Endurance Fuel - Lemon', 'drink_mix', '27g (1 scoop)', 100, 25, 303, 'glucose+sucrose', NULL, true, true),
('Tailwind', 'Endurance Fuel - Berry', 'drink_mix', '27g (1 scoop)', 100, 25, 303, 'glucose+sucrose', NULL, true, true),
('Tailwind', 'Endurance Fuel - Grape', 'drink_mix', '27g (1 scoop)', 100, 25, 303, 'glucose+sucrose', NULL, true, true),
('Tailwind', 'Endurance Fuel - Naked (Unflavored)', 'drink_mix', '27g (1 scoop)', 100, 25, 303, 'glucose+sucrose', NULL, true, true),
('Tailwind', 'Endurance Fuel - Green Tea Buzz', 'drink_mix', '27g (1 scoop)', 100, 25, 303, 'glucose+sucrose', 35, true, true),
('Tailwind', 'Endurance Fuel - Raspberry Buzz', 'drink_mix', '27g (1 scoop)', 100, 25, 303, 'glucose+sucrose', 35, true, true),
('Tailwind', 'Endurance Fuel - Tropical Buzz', 'drink_mix', '27g (1 scoop)', 100, 25, 303, 'glucose+sucrose', 35, true, true),
('Tailwind', 'Endurance Fuel - Colorado Cola', 'drink_mix', '27g (1 scoop)', 100, 25, 303, 'glucose+sucrose', 35, true, true),
('Tailwind', 'Endurance Fuel - Dauwaltermelon', 'drink_mix', '27g (1 scoop)', 100, 25, 303, 'glucose+sucrose', NULL, true, true),
('Tailwind', 'Rebuild Recovery - Chocolate', 'drink_mix', '58g', 200, 29, 220, NULL, NULL, true, true),
('Tailwind', 'Rebuild Recovery - Vanilla', 'drink_mix', '58g', 200, 29, 220, NULL, NULL, true, true)
ON CONFLICT (brand, name) DO NOTHING;

-- ============================================================================
-- SPRING ENERGY
-- ============================================================================
INSERT INTO nutrition_products (brand, name, category, serving_size, calories, carbs_grams, sodium_mg, glucose_fructose_ratio, caffeine_mg, fat_grams, is_verified, is_active) VALUES
('Spring Energy', 'Awesome Sauce', 'gel', '52g', 180, 28, 85, 'real food', NULL, 7, true, true),
('Spring Energy', 'Canaberry', 'gel', '52g', 170, 30, 90, 'real food', 25, 4, true, true),
('Spring Energy', 'Speednut', 'gel', '65g', 250, 32, 100, 'real food', 50, 12, true, true),
('Spring Energy', 'Koffee', 'gel', '52g', 160, 28, 85, 'real food', 65, 5, true, true),
('Spring Energy', 'Hill Aid', 'gel', '52g', 130, 24, 90, 'real food', NULL, 3, true, true),
('Spring Energy', 'Long Haul', 'gel', '78g', 250, 38, 120, 'real food', NULL, 8, true, true),
('Spring Energy', 'Power Chews - Fruit Punch', 'chew', '42g', 120, 25, 65, 'real food', NULL, 2, true, true)
ON CONFLICT (brand, name) DO NOTHING;

-- ============================================================================
-- HAMMER NUTRITION
-- ============================================================================
INSERT INTO nutrition_products (brand, name, category, serving_size, calories, carbs_grams, sodium_mg, glucose_fructose_ratio, caffeine_mg, is_verified, is_active) VALUES
('Hammer', 'Gel - Raspberry', 'gel', '33g', 90, 21, 20, 'maltodextrin', NULL, true, true),
('Hammer', 'Gel - Vanilla', 'gel', '33g', 90, 21, 20, 'maltodextrin', NULL, true, true),
('Hammer', 'Gel - Apple Cinnamon', 'gel', '33g', 90, 21, 20, 'maltodextrin', NULL, true, true),
('Hammer', 'Gel - Banana', 'gel', '33g', 90, 21, 20, 'maltodextrin', NULL, true, true),
('Hammer', 'Gel - Montana Huckleberry', 'gel', '33g', 90, 21, 20, 'maltodextrin', NULL, true, true),
('Hammer', 'Gel - Peanut Butter', 'gel', '33g', 90, 21, 20, 'maltodextrin', NULL, true, true),
('Hammer', 'Gel - Peanut Butter Chocolate', 'gel', '33g', 90, 21, 20, 'maltodextrin', NULL, true, true),
('Hammer', 'Gel - Nocciola', 'gel', '33g', 90, 21, 20, 'maltodextrin', NULL, true, true),
('Hammer', 'Gel - Espresso', 'gel', '33g', 90, 21, 20, 'maltodextrin', 50, true, true),
('Hammer', 'Gel - Tropical', 'gel', '33g', 90, 21, 20, 'maltodextrin', 25, true, true),
('Hammer', 'HEED - Lemon Lime', 'drink_mix', '28g', 110, 27, 40, 'maltodextrin', NULL, true, true),
('Hammer', 'HEED - Mandarin Orange', 'drink_mix', '28g', 110, 27, 40, 'maltodextrin', NULL, true, true),
('Hammer', 'HEED - Melon', 'drink_mix', '28g', 110, 27, 40, 'maltodextrin', NULL, true, true),
('Hammer', 'HEED - Strawberry', 'drink_mix', '28g', 110, 27, 40, 'maltodextrin', NULL, true, true),
('Hammer', 'HEED - Cherry Bomb', 'drink_mix', '28g', 110, 27, 40, 'maltodextrin', 25, true, true),
('Hammer', 'Perpetuem - Orange Vanilla', 'drink_mix', '66g (2 scoops)', 180, 34, 20, 'maltodextrin', NULL, true, true),
('Hammer', 'Perpetuem - Strawberry Vanilla', 'drink_mix', '66g (2 scoops)', 180, 34, 20, 'maltodextrin', NULL, true, true),
('Hammer', 'Perpetuem - Caffe Latte', 'drink_mix', '66g (2 scoops)', 180, 34, 20, 'maltodextrin', 30, true, true),
('Hammer', 'Endurolytes Fizz - Lemon Lime', 'electrolyte', '1 tablet', 10, 2, 200, NULL, NULL, true, true),
('Hammer', 'Endurolytes Fizz - Grape', 'electrolyte', '1 tablet', 10, 2, 200, NULL, NULL, true, true),
('Hammer', 'Endurolytes Fizz - Mango', 'electrolyte', '1 tablet', 10, 2, 200, NULL, NULL, true, true),
('Hammer', 'Endurolytes Fizz - Grapefruit', 'electrolyte', '1 tablet', 10, 2, 200, NULL, NULL, true, true),
('Hammer', 'Endurolytes Fizz - Cola', 'electrolyte', '1 tablet', 10, 2, 200, NULL, 20, true, true),
('Hammer', 'Endurolytes Extreme - Capsules', 'electrolyte', '1 capsule', 0, 0, 300, NULL, NULL, true, true),
('Hammer', 'Hammer Bar - Almond Raisin', 'bar', '50g', 200, 23, 35, NULL, NULL, true, true),
('Hammer', 'Hammer Bar - Chocolate Chip', 'bar', '50g', 200, 21, 35, NULL, NULL, true, true),
('Hammer', 'Hammer Bar - Oatmeal Apple', 'bar', '50g', 200, 23, 35, NULL, NULL, true, true)
ON CONFLICT (brand, name) DO NOTHING;

-- ============================================================================
-- HONEY STINGER
-- ============================================================================
INSERT INTO nutrition_products (brand, name, category, serving_size, calories, carbs_grams, sodium_mg, glucose_fructose_ratio, caffeine_mg, is_verified, is_active) VALUES
('Honey Stinger', 'Energy Gel - Gold', 'gel', '32g', 100, 24, 50, 'honey', NULL, true, true),
('Honey Stinger', 'Energy Gel - Strawberry Kiwi', 'gel', '32g', 100, 24, 50, 'honey', NULL, true, true),
('Honey Stinger', 'Energy Gel - Mango Orange', 'gel', '32g', 100, 24, 50, 'honey', NULL, true, true),
('Honey Stinger', 'Energy Gel - Acai Pomegranate', 'gel', '32g', 100, 24, 50, 'honey', NULL, true, true),
('Honey Stinger', 'Energy Gel - Fruit Smoothie', 'gel', '32g', 100, 24, 50, 'honey', NULL, true, true),
('Honey Stinger', 'Energy Gel - Ginsting', 'gel', '32g', 100, 24, 50, 'honey', 32, true, true),
('Honey Stinger', 'Energy Gel - Chocolate', 'gel', '32g', 100, 24, 50, 'honey', 32, true, true),
('Honey Stinger', 'Energy Chews - Fruit Smoothie', 'chew', '50g', 160, 39, 80, 'honey', NULL, true, true),
('Honey Stinger', 'Energy Chews - Pink Lemonade', 'chew', '50g', 160, 39, 80, 'honey', NULL, true, true),
('Honey Stinger', 'Energy Chews - Orange Blossom', 'chew', '50g', 160, 39, 80, 'honey', NULL, true, true),
('Honey Stinger', 'Energy Chews - Lime-Aid', 'chew', '50g', 160, 39, 80, 'honey', NULL, true, true),
('Honey Stinger', 'Energy Chews - Cherry Cola', 'chew', '50g', 160, 39, 130, 'honey', 50, true, true),
('Honey Stinger', 'Energy Chews - Stingerita Lime', 'chew', '50g', 160, 39, 130, 'honey', 75, true, true),
('Honey Stinger', 'Waffle - Honey', 'bar', '30g', 150, 21, 65, 'honey', NULL, true, true),
('Honey Stinger', 'Waffle - Caramel', 'bar', '30g', 150, 21, 65, 'honey', NULL, true, true),
('Honey Stinger', 'Waffle - Vanilla', 'bar', '30g', 150, 21, 65, 'honey', NULL, true, true),
('Honey Stinger', 'Waffle - Chocolate', 'bar', '30g', 150, 21, 65, 'honey', NULL, true, true),
('Honey Stinger', 'Waffle - Cinnamon', 'bar', '30g', 150, 21, 65, 'honey', NULL, true, true),
('Honey Stinger', 'Waffle - Gingersnap', 'bar', '30g', 150, 21, 65, 'honey', NULL, true, true),
('Honey Stinger', 'Waffle - Salted Caramel', 'bar', '30g', 150, 21, 95, 'honey', NULL, true, true),
('Honey Stinger', 'Gluten Free Waffle - Salted Caramel', 'bar', '30g', 140, 17, 100, 'honey', NULL, true, true),
('Honey Stinger', 'Gluten Free Waffle - Cinnamon', 'bar', '30g', 140, 17, 100, 'honey', NULL, true, true),
('Honey Stinger', 'Oat + Honey Bar - Peanut Butter', 'bar', '50g', 200, 31, 140, 'honey', NULL, true, true)
ON CONFLICT (brand, name) DO NOTHING;

-- ============================================================================
-- CLIF
-- ============================================================================
INSERT INTO nutrition_products (brand, name, category, serving_size, calories, carbs_grams, sodium_mg, glucose_fructose_ratio, caffeine_mg, is_verified, is_active) VALUES
('Clif', 'Shot Energy Gel - Razz Sorbet', 'gel', '34g', 100, 25, 40, 'maltodextrin', NULL, true, true),
('Clif', 'Shot Energy Gel - Apple Pie', 'gel', '34g', 100, 25, 40, 'maltodextrin', NULL, true, true),
('Clif', 'Shot Energy Gel - Citrus', 'gel', '34g', 100, 25, 40, 'maltodextrin', 25, true, true),
('Clif', 'Shot Energy Gel - Strawberry', 'gel', '34g', 100, 25, 40, 'maltodextrin', 25, true, true),
('Clif', 'Shot Energy Gel - Mocha', 'gel', '34g', 100, 25, 40, 'maltodextrin', 50, true, true),
('Clif', 'Shot Energy Gel - Double Espresso', 'gel', '34g', 100, 25, 40, 'maltodextrin', 100, true, true),
('Clif', 'Shot Energy Gel - Chocolate Cherry', 'gel', '34g', 100, 25, 40, 'maltodextrin', 100, true, true),
('Clif', 'Shot Bloks - Citrus', 'chew', '60g (6 chews)', 200, 48, 70, 'maltodextrin', NULL, true, true),
('Clif', 'Shot Bloks - Cran Raspberry', 'chew', '60g (6 chews)', 200, 48, 50, 'maltodextrin', NULL, true, true),
('Clif', 'Shot Bloks - Strawberry', 'chew', '60g (6 chews)', 200, 48, 50, 'maltodextrin', NULL, true, true),
('Clif', 'Shot Bloks - Mountain Berry', 'chew', '60g (6 chews)', 200, 48, 50, 'maltodextrin', NULL, true, true),
('Clif', 'Shot Bloks - Tropical Punch', 'chew', '60g (6 chews)', 200, 48, 50, 'maltodextrin', 25, true, true),
('Clif', 'Shot Bloks - Orange', 'chew', '60g (6 chews)', 200, 48, 50, 'maltodextrin', 25, true, true),
('Clif', 'Shot Bloks - Margarita (3x Sodium)', 'chew', '60g (6 chews)', 200, 48, 150, 'maltodextrin', NULL, true, true),
('Clif', 'Shot Bloks - Salted Watermelon (2x Sodium)', 'chew', '60g (6 chews)', 200, 48, 100, 'maltodextrin', NULL, true, true),
('Clif', 'Shot Bloks - Black Cherry', 'chew', '60g (6 chews)', 200, 48, 50, 'maltodextrin', 50, true, true),
('Clif', 'Bar - Chocolate Chip', 'bar', '68g', 250, 43, 230, NULL, NULL, true, true),
('Clif', 'Bar - Crunchy Peanut Butter', 'bar', '68g', 260, 42, 210, NULL, NULL, true, true),
('Clif', 'Bar - White Chocolate Macadamia', 'bar', '68g', 260, 43, 210, NULL, NULL, true, true),
('Clif', 'Bar - Blueberry Crisp', 'bar', '68g', 250, 44, 240, NULL, NULL, true, true),
('Clif', 'Bar - Chocolate Brownie', 'bar', '68g', 250, 44, 210, NULL, NULL, true, true),
('Clif', 'Bar - Sierra Trail Mix', 'bar', '68g', 250, 43, 200, NULL, NULL, true, true),
('Clif', 'Bar - Cool Mint Chocolate', 'bar', '68g', 260, 44, 240, NULL, NULL, true, true)
ON CONFLICT (brand, name) DO NOTHING;

-- ============================================================================
-- HUMA
-- ============================================================================
INSERT INTO nutrition_products (brand, name, category, serving_size, calories, carbs_grams, sodium_mg, glucose_fructose_ratio, caffeine_mg, is_verified, is_active) VALUES
('Huma', 'Chia Energy Gel - Apples & Cinnamon', 'gel', '39g', 100, 22, 30, '2:1', NULL, true, true),
('Huma', 'Chia Energy Gel - Blueberries', 'gel', '39g', 100, 22, 30, '2:1', NULL, true, true),
('Huma', 'Chia Energy Gel - Mangoes', 'gel', '39g', 100, 22, 30, '2:1', NULL, true, true),
('Huma', 'Chia Energy Gel - Strawberries', 'gel', '39g', 100, 22, 30, '2:1', NULL, true, true),
('Huma', 'Plus Gel - Blackberry Banana', 'gel', '43g', 100, 24, 245, '2:1', NULL, true, true),
('Huma', 'Plus Gel - Berries & Pomegranate', 'gel', '43g', 100, 24, 245, '2:1', NULL, true, true),
('Huma', 'Plus Gel - Orange Mango', 'gel', '43g', 100, 24, 245, '2:1', NULL, true, true),
('Huma', 'Plus Gel - Strawberry Lemonade', 'gel', '43g', 100, 24, 245, '2:1', 25, true, true),
('Huma', 'Plus Gel - Lemon Lime', 'gel', '43g', 100, 24, 245, '2:1', 25, true, true),
('Huma', 'Plus Gel - Chocolate Peanut Butter', 'gel', '43g', 100, 24, 245, '2:1', 25, true, true)
ON CONFLICT (brand, name) DO NOTHING;

-- ============================================================================
-- UCAN
-- ============================================================================
INSERT INTO nutrition_products (brand, name, category, serving_size, calories, carbs_grams, sodium_mg, glucose_fructose_ratio, caffeine_mg, is_verified, is_active) VALUES
('UCAN', 'Energy Powder - Unflavored', 'drink_mix', '1 packet', 110, 26, 170, 'superstarch', NULL, true, true),
('UCAN', 'Energy Powder - Lemon', 'drink_mix', '1 packet', 110, 27, 170, 'superstarch', NULL, true, true),
('UCAN', 'Energy Powder - Orange', 'drink_mix', '1 packet', 110, 27, 170, 'superstarch', NULL, true, true),
('UCAN', 'Energy Powder - Tropical', 'drink_mix', '1 packet', 110, 27, 170, 'superstarch', NULL, true, true),
('UCAN', 'Energy Bar - Chocolate', 'bar', '41g', 180, 24, 90, 'superstarch', NULL, true, true),
('UCAN', 'Energy Bar - Chocolate Peanut Butter', 'bar', '42g', 190, 24, 90, 'superstarch', NULL, true, true),
('UCAN', 'Energy Bar - Cinnamon Swirl', 'bar', '42g', 170, 26, 90, 'superstarch', NULL, true, true),
('UCAN', 'Energy Bar - Salted Peanut Butter', 'bar', '41g', 160, 23, 140, 'superstarch', NULL, true, true),
('UCAN', 'Hydrate - Lemon', 'electrolyte', '3g stick', 5, 0, 300, NULL, NULL, true, true),
('UCAN', 'Hydrate - Berry', 'electrolyte', '3g stick', 5, 0, 300, NULL, NULL, true, true),
('UCAN', 'Hydrate - Tropical', 'electrolyte', '3g stick', 5, 0, 300, NULL, NULL, true, true)
ON CONFLICT (brand, name) DO NOTHING;

-- ============================================================================
-- NUUN
-- ============================================================================
INSERT INTO nutrition_products (brand, name, category, serving_size, calories, carbs_grams, sodium_mg, glucose_fructose_ratio, caffeine_mg, is_verified, is_active) VALUES
('Nuun', 'Sport - Lemon Lime', 'electrolyte', '1 tablet', 15, 4, 300, NULL, NULL, true, true),
('Nuun', 'Sport - Citrus Fruit', 'electrolyte', '1 tablet', 15, 4, 300, NULL, NULL, true, true),
('Nuun', 'Sport - Tri-Berry', 'electrolyte', '1 tablet', 15, 4, 300, NULL, NULL, true, true),
('Nuun', 'Sport - Orange', 'electrolyte', '1 tablet', 15, 4, 300, NULL, NULL, true, true),
('Nuun', 'Sport - Grape', 'electrolyte', '1 tablet', 15, 4, 300, NULL, NULL, true, true),
('Nuun', 'Sport - Strawberry Lemonade', 'electrolyte', '1 tablet', 15, 4, 300, NULL, NULL, true, true),
('Nuun', 'Sport - Fruit Punch', 'electrolyte', '1 tablet', 15, 4, 300, NULL, NULL, true, true),
('Nuun', 'Sport - Watermelon', 'electrolyte', '1 tablet', 15, 4, 300, NULL, NULL, true, true),
('Nuun', 'Sport + Caffeine - Fresh Lime', 'electrolyte', '1 tablet', 15, 4, 300, NULL, 40, true, true),
('Nuun', 'Sport + Caffeine - Mango Orange', 'electrolyte', '1 tablet', 15, 4, 300, NULL, 40, true, true),
('Nuun', 'Sport + Caffeine - Wild Berry', 'electrolyte', '1 tablet', 15, 4, 300, NULL, 40, true, true),
('Nuun', 'Sport + Caffeine - Cherry Limeade', 'electrolyte', '1 tablet', 15, 4, 300, NULL, 40, true, true),
('Nuun', 'Energy - Ginger Lime Zing', 'electrolyte', '1 tablet', 15, 4, 100, NULL, 80, true, true),
('Nuun', 'Energy - Fresh Citrus', 'electrolyte', '1 tablet', 15, 4, 100, NULL, 80, true, true),
('Nuun', 'Energy - Tropical Punch', 'electrolyte', '1 tablet', 15, 4, 100, NULL, 80, true, true),
('Nuun', 'Prime - Strawberry', 'drink_mix', '10g', 28, 6, 230, NULL, NULL, true, true),
('Nuun', 'Prime - Peach', 'drink_mix', '10g', 28, 6, 230, NULL, NULL, true, true),
('Nuun', 'Endurance - Citrus', 'drink_mix', '32g', 100, 25, 380, NULL, NULL, true, true),
('Nuun', 'Endurance - Mixed Berry', 'drink_mix', '32g', 100, 25, 380, NULL, NULL, true, true)
ON CONFLICT (brand, name) DO NOTHING;

-- ============================================================================
-- LIQUID IV
-- ============================================================================
INSERT INTO nutrition_products (brand, name, category, serving_size, calories, carbs_grams, sodium_mg, glucose_fructose_ratio, caffeine_mg, is_verified, is_active) VALUES
('Liquid IV', 'Hydration Multiplier - Lemon Lime', 'electrolyte', '16g', 50, 13, 500, NULL, NULL, true, true),
('Liquid IV', 'Hydration Multiplier - Passion Fruit', 'electrolyte', '16g', 50, 13, 500, NULL, NULL, true, true),
('Liquid IV', 'Hydration Multiplier - Strawberry', 'electrolyte', '16g', 50, 13, 500, NULL, NULL, true, true),
('Liquid IV', 'Hydration Multiplier - Acai Berry', 'electrolyte', '16g', 50, 13, 500, NULL, NULL, true, true),
('Liquid IV', 'Hydration Multiplier - Watermelon', 'electrolyte', '16g', 50, 13, 500, NULL, NULL, true, true),
('Liquid IV', 'Hydration Multiplier - Guava', 'electrolyte', '16g', 50, 13, 500, NULL, NULL, true, true),
('Liquid IV', 'Energy Multiplier - Lemon Ginger', 'electrolyte', '16g', 40, 9, 380, NULL, 100, true, true),
('Liquid IV', 'Energy Multiplier - Yuzu Pineapple', 'electrolyte', '16g', 40, 9, 380, NULL, 100, true, true)
ON CONFLICT (brand, name) DO NOTHING;

-- ============================================================================
-- LMNT
-- ============================================================================
INSERT INTO nutrition_products (brand, name, category, serving_size, calories, carbs_grams, sodium_mg, glucose_fructose_ratio, caffeine_mg, is_verified, is_active) VALUES
('LMNT', 'Electrolyte Mix - Citrus Salt', 'electrolyte', '6g', 10, 0, 1000, NULL, NULL, true, true),
('LMNT', 'Electrolyte Mix - Raspberry Salt', 'electrolyte', '6g', 10, 0, 1000, NULL, NULL, true, true),
('LMNT', 'Electrolyte Mix - Orange Salt', 'electrolyte', '6g', 10, 0, 1000, NULL, NULL, true, true),
('LMNT', 'Electrolyte Mix - Watermelon Salt', 'electrolyte', '6g', 10, 0, 1000, NULL, NULL, true, true),
('LMNT', 'Electrolyte Mix - Grapefruit Salt', 'electrolyte', '6g', 10, 0, 1000, NULL, NULL, true, true),
('LMNT', 'Electrolyte Mix - Mango Chili', 'electrolyte', '6g', 10, 0, 1000, NULL, NULL, true, true),
('LMNT', 'Electrolyte Mix - Lemon Habanero', 'electrolyte', '6g', 10, 0, 1000, NULL, NULL, true, true),
('LMNT', 'Electrolyte Mix - Raw Unflavored', 'electrolyte', '6g', 0, 0, 1000, NULL, NULL, true, true),
('LMNT', 'Electrolyte Mix - Chocolate Salt', 'electrolyte', '6g', 10, 1, 1000, NULL, NULL, true, true),
('LMNT', 'Electrolyte Mix - Chocolate Mint', 'electrolyte', '6g', 10, 1, 1000, NULL, NULL, true, true),
('LMNT', 'Electrolyte Mix - Chocolate Caramel', 'electrolyte', '6g', 10, 1, 1000, NULL, NULL, true, true)
ON CONFLICT (brand, name) DO NOTHING;

-- ============================================================================
-- POWERBAR
-- ============================================================================
INSERT INTO nutrition_products (brand, name, category, serving_size, calories, carbs_grams, sodium_mg, glucose_fructose_ratio, caffeine_mg, is_verified, is_active) VALUES
('PowerBar', 'PowerGel Original - Vanilla', 'gel', '41g', 100, 27, 200, '2:1', NULL, true, true),
('PowerBar', 'PowerGel Original - Strawberry Banana', 'gel', '41g', 100, 27, 200, '2:1', NULL, true, true),
('PowerBar', 'PowerGel Original - Tangerine', 'gel', '41g', 100, 27, 200, '2:1', 50, true, true),
('PowerBar', 'PowerGel Original - Green Apple', 'gel', '41g', 100, 27, 200, '2:1', 50, true, true),
('PowerBar', 'PowerGel Original - Berry Blast', 'gel', '41g', 100, 27, 200, '2:1', 25, true, true),
('PowerBar', 'PowerGel Original - Double Latte', 'gel', '41g', 100, 27, 200, '2:1', 50, true, true),
('PowerBar', 'PowerGel Hydro - Orange', 'gel', '67ml', 100, 25, 200, '2:1', NULL, true, true),
('PowerBar', 'PowerGel Hydro - Mojito', 'gel', '67ml', 100, 25, 200, '2:1', 51, true, true),
('PowerBar', 'PowerGel Shots - Raspberry', 'chew', '60g', 200, 48, 100, '2:1', NULL, true, true),
('PowerBar', 'PowerGel Shots - Cola', 'chew', '60g', 200, 48, 100, '2:1', 50, true, true),
('PowerBar', 'Energize Bar - Original Chocolate', 'bar', '55g', 200, 38, 75, NULL, NULL, true, true),
('PowerBar', 'Energize Bar - Berry', 'bar', '55g', 200, 38, 75, NULL, NULL, true, true),
('PowerBar', 'Energize Bar - Mango Tropical', 'bar', '55g', 200, 38, 75, NULL, NULL, true, true)
ON CONFLICT (brand, name) DO NOTHING;

-- ============================================================================
-- ENERVIT
-- ============================================================================
INSERT INTO nutrition_products (brand, name, category, serving_size, calories, carbs_grams, sodium_mg, glucose_fructose_ratio, caffeine_mg, is_verified, is_active) VALUES
('Enervit', 'C2:1PRO Carbo Gel - Orange', 'gel', '60ml', 160, 40, 0, '2:1', NULL, true, true),
('Enervit', 'C2:1PRO Carbo Gel - Lime', 'gel', '60ml', 160, 40, 0, '2:1', NULL, true, true),
('Enervit', 'C2:1PRO Carbo Gel - Lemon + Sodium', 'gel', '60ml', 160, 40, 150, '2:1', NULL, true, true),
('Enervit', 'C2:1PRO Carbo Gel - Cola + Caffeine', 'gel', '60ml', 160, 40, 0, '2:1', 100, true, true),
('Enervit', 'C2:1PRO Isocarb Drink - Orange', 'drink_mix', '30g', 113, 30, 50, '2:1', NULL, true, true),
('Enervit', 'C2:1PRO Isocarb Drink - Lemon', 'drink_mix', '30g', 113, 30, 50, '2:1', NULL, true, true),
('Enervit', 'Isotonic Drink - Orange', 'drink_mix', '20g', 72, 18, 200, NULL, NULL, true, true),
('Enervit', 'Isotonic Drink - Lemon', 'drink_mix', '20g', 72, 18, 200, NULL, NULL, true, true),
('Enervit', 'Sport Gel - Orange', 'gel', '25ml', 64, 16, 45, NULL, NULL, true, true),
('Enervit', 'Sport Gel - Lemon', 'gel', '25ml', 64, 16, 45, NULL, NULL, true, true),
('Enervit', 'Sport Gel - Cola + Caffeine', 'gel', '25ml', 64, 16, 45, NULL, 25, true, true)
ON CONFLICT (brand, name) DO NOTHING;

-- ============================================================================
-- TORQ
-- ============================================================================
INSERT INTO nutrition_products (brand, name, category, serving_size, calories, carbs_grams, sodium_mg, glucose_fructose_ratio, caffeine_mg, is_verified, is_active) VALUES
('TORQ', 'Energy Gel - Orange Banana', 'gel', '45g', 114, 30, 49, '2:1', NULL, true, true),
('TORQ', 'Energy Gel - Forest Fruits', 'gel', '45g', 114, 30, 49, '2:1', NULL, true, true),
('TORQ', 'Energy Gel - Apple Crumble', 'gel', '45g', 114, 30, 49, '2:1', NULL, true, true),
('TORQ', 'Energy Gel - Cherry Bakewell', 'gel', '45g', 114, 30, 49, '2:1', NULL, true, true),
('TORQ', 'Energy Gel - Rhubarb & Custard', 'gel', '45g', 114, 30, 49, '2:1', NULL, true, true),
('TORQ', 'Energy Gel - Banoffee', 'gel', '45g', 114, 30, 49, '2:1', 89, true, true),
('TORQ', 'Energy Gel - Guarana', 'gel', '45g', 114, 30, 49, '2:1', 89, true, true),
('TORQ', 'Energy Drink Mix - Pink Grapefruit', 'drink_mix', '45g', 125, 30, 280, '2:1', NULL, true, true),
('TORQ', 'Energy Drink Mix - Blackcurrant', 'drink_mix', '45g', 125, 30, 280, '2:1', NULL, true, true),
('TORQ', 'Energy Drink Mix - Organic Unflavored', 'drink_mix', '45g', 125, 30, 280, '2:1', NULL, true, true),
('TORQ', 'Energy Drink Mix - Lemon', 'drink_mix', '45g', 125, 30, 280, '2:1', NULL, true, true),
('TORQ', 'Hydration - Pink Grapefruit', 'electrolyte', '18g', 30, 6, 280, NULL, NULL, true, true),
('TORQ', 'Hydration - Lemon', 'electrolyte', '18g', 30, 6, 280, NULL, NULL, true, true),
('TORQ', 'Energy Bar - Organic Sundried Banana', 'bar', '45g', 150, 26, 35, NULL, NULL, true, true),
('TORQ', 'Energy Bar - Tangy Apricot', 'bar', '45g', 150, 26, 35, NULL, NULL, true, true),
('TORQ', 'Energy Bar - Zesty Lemon', 'bar', '45g', 150, 26, 35, NULL, NULL, true, true),
('TORQ', 'Energy Chew - Cherry', 'chew', '45g', 109, 27, 49, '2:1', NULL, true, true),
('TORQ', 'Energy Chew - Apple Crumble', 'chew', '45g', 109, 27, 49, '2:1', NULL, true, true)
ON CONFLICT (brand, name) DO NOTHING;

-- ============================================================================
-- REAL FOOD OPTIONS
-- ============================================================================
INSERT INTO nutrition_products (brand, name, category, serving_size, calories, carbs_grams, sodium_mg, glucose_fructose_ratio, caffeine_mg, water_content_ml, is_verified, is_active) VALUES
('Real Food', 'Banana (medium)', 'real_food', '1 banana', 105, 27, 1, 'fructose+glucose', NULL, 75, true, true),
('Real Food', 'Dates (Medjool, 2)', 'real_food', '2 dates', 133, 36, 1, 'fructose+glucose', NULL, 10, true, true),
('Real Food', 'Raisins (1/4 cup)', 'real_food', '40g', 120, 32, 5, 'fructose+glucose', NULL, 5, true, true),
('Real Food', 'Fig Newton (2 cookies)', 'real_food', '2 cookies', 110, 22, 100, 'fructose+sucrose', NULL, NULL, true, true),
('Real Food', 'Pretzels (small handful)', 'real_food', '30g', 115, 24, 385, 'maltodextrin', NULL, NULL, true, true),
('Real Food', 'White Rice (1/2 cup cooked)', 'real_food', '100g', 130, 28, 2, 'glucose', NULL, 65, true, true),
('Real Food', 'Sweet Potato (small)', 'real_food', '150g', 130, 30, 40, 'glucose+fructose', NULL, 110, true, true),
('Real Food', 'Orange (medium)', 'real_food', '1 orange', 62, 15, 0, 'fructose+sucrose', NULL, 130, true, true),
('Real Food', 'Apple (medium)', 'real_food', '1 apple', 95, 25, 2, 'fructose', NULL, 115, true, true),
('Real Food', 'Watermelon (1 cup)', 'real_food', '150g', 46, 11, 2, 'fructose+glucose', NULL, 140, true, true),
('Real Food', 'Honey (1 tbsp)', 'real_food', '21g', 64, 17, 1, 'fructose+glucose', NULL, NULL, true, true),
('Real Food', 'Maple Syrup (1 tbsp)', 'real_food', '20g', 52, 13, 2, 'sucrose', NULL, NULL, true, true),
('Real Food', 'PB&J Sandwich (half)', 'real_food', '1/2 sandwich', 200, 26, 200, 'mixed', NULL, NULL, true, true),
('Real Food', 'Rice Cake with PB', 'real_food', '1 rice cake + 1 tbsp', 130, 15, 50, 'glucose', NULL, NULL, true, true),
('Real Food', 'Graham Crackers (2 sheets)', 'real_food', '28g', 118, 22, 170, 'glucose+sucrose', NULL, NULL, true, true),
('Real Food', 'Gummy Bears (10 pieces)', 'real_food', '26g', 90, 22, 10, 'glucose+sucrose', NULL, NULL, true, true),
('Real Food', 'Salted Potatoes (small)', 'real_food', '150g', 120, 26, 300, 'glucose', NULL, 115, true, true),
('Real Food', 'Coca-Cola (8 oz)', 'real_food', '240ml', 97, 26, 30, 'sucrose+HFCS', 24, 220, true, true),
('Real Food', 'Flat Coca-Cola (defizzed)', 'real_food', '240ml', 97, 26, 30, 'sucrose+HFCS', 24, 220, true, true),
('Real Food', 'Orange Juice (8 oz)', 'real_food', '240ml', 110, 26, 2, 'fructose+glucose', NULL, 220, true, true),
('Real Food', 'Pickle Juice (2 oz shot)', 'electrolyte', '60ml', 0, 0, 500, NULL, NULL, 58, true, true),
('Real Food', 'Salted Watermelon Cubes', 'real_food', '150g', 50, 12, 200, 'fructose+glucose', NULL, 140, true, true)
ON CONFLICT (brand, name) DO NOTHING;

-- ============================================================================
-- DRIP DROP
-- ============================================================================
INSERT INTO nutrition_products (brand, name, category, serving_size, calories, carbs_grams, sodium_mg, glucose_fructose_ratio, caffeine_mg, is_verified, is_active) VALUES
('DripDrop', 'ORS - Lemon', 'electrolyte', '10g', 35, 9, 330, NULL, NULL, true, true),
('DripDrop', 'ORS - Berry', 'electrolyte', '10g', 35, 9, 330, NULL, NULL, true, true),
('DripDrop', 'ORS - Watermelon', 'electrolyte', '10g', 35, 9, 330, NULL, NULL, true, true),
('DripDrop', 'ORS - Orange', 'electrolyte', '10g', 35, 9, 330, NULL, NULL, true, true),
('DripDrop', 'ORS Zero - Lemon Lime', 'electrolyte', '8g', 0, 0, 330, NULL, NULL, true, true)
ON CONFLICT (brand, name) DO NOTHING;

-- ============================================================================
-- LARABAR
-- ============================================================================
INSERT INTO nutrition_products (brand, name, category, serving_size, calories, carbs_grams, sodium_mg, glucose_fructose_ratio, caffeine_mg, is_verified, is_active) VALUES
('Larabar', 'Apple Pie', 'bar', '45g', 190, 24, 5, 'real food', NULL, true, true),
('Larabar', 'Cashew Cookie', 'bar', '45g', 230, 21, 0, 'real food', NULL, true, true),
('Larabar', 'Peanut Butter Cookie', 'bar', '45g', 220, 21, 140, 'real food', NULL, true, true),
('Larabar', 'Chocolate Chip Cookie Dough', 'bar', '45g', 210, 25, 45, 'real food', NULL, true, true),
('Larabar', 'Banana Bread', 'bar', '45g', 200, 26, 0, 'real food', NULL, true, true),
('Larabar', 'Cherry Pie', 'bar', '45g', 200, 28, 0, 'real food', NULL, true, true),
('Larabar', 'Blueberry Muffin', 'bar', '45g', 200, 26, 0, 'real food', NULL, true, true)
ON CONFLICT (brand, name) DO NOTHING;

-- ============================================================================
-- BOBO'S
-- ============================================================================
INSERT INTO nutrition_products (brand, name, category, serving_size, calories, carbs_grams, sodium_mg, glucose_fructose_ratio, caffeine_mg, is_verified, is_active) VALUES
('Bobos', 'Oat Bar - Original', 'bar', '85g', 340, 48, 65, 'oats+honey', NULL, true, true),
('Bobos', 'Oat Bar - Chocolate Chip', 'bar', '85g', 360, 50, 75, 'oats+honey', NULL, true, true),
('Bobos', 'Oat Bar - Peanut Butter', 'bar', '85g', 380, 44, 90, 'oats+honey', NULL, true, true),
('Bobos', 'Oat Bar - Lemon Poppy Seed', 'bar', '85g', 340, 46, 75, 'oats+honey', NULL, true, true),
('Bobos', 'Oat Bar - Maple Pecan', 'bar', '85g', 350, 48, 75, 'oats+honey', NULL, true, true),
('Bobos', 'Oat Bite - Chocolate Chip', 'bar', '35g', 140, 20, 30, 'oats+honey', NULL, true, true),
('Bobos', 'Oat Bite - Peanut Butter', 'bar', '35g', 150, 18, 35, 'oats+honey', NULL, true, true)
ON CONFLICT (brand, name) DO NOTHING;

-- ============================================================================
-- PROBAR
-- ============================================================================
INSERT INTO nutrition_products (brand, name, category, serving_size, calories, carbs_grams, sodium_mg, glucose_fructose_ratio, caffeine_mg, is_verified, is_active) VALUES
('ProBar', 'Bolt - Strawberry', 'chew', '60g', 180, 42, 50, NULL, NULL, true, true),
('ProBar', 'Bolt - Berry Blast', 'chew', '60g', 180, 42, 50, NULL, NULL, true, true),
('ProBar', 'Bolt - Orange', 'chew', '60g', 180, 42, 50, NULL, NULL, true, true),
('ProBar', 'Bolt - Raspberry', 'chew', '60g', 180, 42, 50, NULL, 50, true, true),
('ProBar', 'Meal Bar - Whole Berry Blast', 'bar', '85g', 370, 40, 290, NULL, NULL, true, true),
('ProBar', 'Meal Bar - Superfood Slam', 'bar', '85g', 380, 38, 310, NULL, NULL, true, true),
('ProBar', 'Meal Bar - Peanut Butter Chocolate Chip', 'bar', '85g', 390, 38, 200, NULL, NULL, true, true)
ON CONFLICT (brand, name) DO NOTHING;

-- ============================================================================
-- BONK BREAKER
-- ============================================================================
INSERT INTO nutrition_products (brand, name, category, serving_size, calories, carbs_grams, sodium_mg, glucose_fructose_ratio, caffeine_mg, is_verified, is_active) VALUES
('Bonk Breaker', 'Energy Bar - Peanut Butter & Jelly', 'bar', '61g', 240, 38, 200, NULL, NULL, true, true),
('Bonk Breaker', 'Energy Bar - Almond Butter & Honey', 'bar', '61g', 240, 36, 180, NULL, NULL, true, true),
('Bonk Breaker', 'Energy Bar - Salted Caramel', 'bar', '61g', 240, 40, 280, NULL, NULL, true, true),
('Bonk Breaker', 'Energy Bar - Apple Pie', 'bar', '61g', 230, 42, 180, NULL, NULL, true, true),
('Bonk Breaker', 'Energy Bar - Blueberry Oat', 'bar', '61g', 220, 40, 180, NULL, NULL, true, true),
('Bonk Breaker', 'Energy Bar - Espresso Chip', 'bar', '61g', 240, 38, 200, NULL, 50, true, true),
('Bonk Breaker', 'Energy Chew - Strawberry', 'chew', '50g', 180, 44, 100, NULL, NULL, true, true),
('Bonk Breaker', 'Energy Chew - Citrus', 'chew', '50g', 180, 44, 100, NULL, NULL, true, true),
('Bonk Breaker', 'Energy Chew - Watermelon', 'chew', '50g', 180, 44, 100, NULL, NULL, true, true)
ON CONFLICT (brand, name) DO NOTHING;

-- Update counts
SELECT
  category,
  COUNT(*) as product_count
FROM nutrition_products
WHERE is_verified = true
GROUP BY category
ORDER BY product_count DESC;
