-- ============================================================================
-- Seed Nutrition Products Database
-- ============================================================================
-- Popular endurance nutrition products with verified nutritional data
-- ============================================================================

-- GELS
INSERT INTO nutrition_products (brand, name, category, serving_size, calories, carbs_grams, sodium_mg, sugars_grams, glucose_fructose_ratio, caffeine_mg, is_verified) VALUES
-- GU Energy
('GU', 'Energy Gel - Original', 'gel', '32g packet', 100, 22, 55, 7, '2:1', 0, true),
('GU', 'Energy Gel - Salted Caramel', 'gel', '32g packet', 100, 22, 125, 7, '2:1', 20, true),
('GU', 'Energy Gel - Espresso Love', 'gel', '32g packet', 100, 22, 55, 7, '2:1', 40, true),
('GU', 'Roctane Ultra Endurance Gel', 'gel', '32g packet', 100, 21, 125, 7, '2:1', 35, true),

-- Maurten
('Maurten', 'Gel 100', 'gel', '40g packet', 100, 25, 0, 13, '1:0.8', 0, true),
('Maurten', 'Gel 100 CAF 100', 'gel', '40g packet', 100, 25, 0, 13, '1:0.8', 100, true),
('Maurten', 'Gel 160', 'gel', '65g packet', 160, 40, 0, 21, '1:0.8', 0, true),

-- SiS
('SiS', 'GO Isotonic Energy Gel', 'gel', '60ml', 87, 22, 10, 0, '2:1', 0, true),
('SiS', 'GO Isotonic Energy Gel + Caffeine', 'gel', '60ml', 87, 22, 10, 0, '2:1', 75, true),
('SiS', 'Beta Fuel Gel', 'gel', '60ml', 160, 40, 0, 20, '1:0.8', 0, true),

-- Clif
('Clif', 'Shot Energy Gel', 'gel', '34g packet', 100, 24, 60, 12, '2:1', 0, true),
('Clif', 'Shot Energy Gel - Double Espresso', 'gel', '34g packet', 100, 24, 60, 12, '2:1', 100, true),

-- Honey Stinger
('Honey Stinger', 'Organic Energy Gel', 'gel', '32g packet', 100, 24, 50, 21, 'glucose-only', 0, true),
('Honey Stinger', 'Organic Energy Gel - Caffeine', 'gel', '32g packet', 100, 24, 50, 21, 'glucose-only', 32, true),

-- Spring Energy
('Spring Energy', 'Awesome Sauce', 'gel', '50g packet', 150, 33, 115, 24, '2:1', 0, true),
('Spring Energy', 'Canaberry', 'gel', '50g packet', 180, 41, 85, 28, '2:1', 0, true),
('Spring Energy', 'Koffee', 'gel', '50g packet', 180, 42, 85, 28, '2:1', 65, true),
('Spring Energy', 'Hill Aid', 'gel', '50g packet', 100, 22, 200, 14, '2:1', 0, true),

-- Precision Fuel
('Precision Fuel', 'PF 30 Gel', 'gel', '51g packet', 120, 30, 0, 0, '1:0.8', 0, true),
('Precision Fuel', 'PF 30 Gel + Caffeine', 'gel', '51g packet', 120, 30, 0, 0, '1:0.8', 100, true),

-- Neversecond
('Neversecond', 'C30 Gel', 'gel', '40g packet', 100, 30, 0, 15, '1:0.8', 0, true),
('Neversecond', 'C30+ Gel (Caffeine)', 'gel', '40g packet', 100, 30, 0, 15, '1:0.8', 100, true);

-- CHEWS
INSERT INTO nutrition_products (brand, name, category, serving_size, calories, carbs_grams, sodium_mg, sugars_grams, glucose_fructose_ratio, caffeine_mg, is_verified) VALUES
('Clif', 'Bloks Energy Chews (6 pack)', 'chew', '60g (6 chews)', 200, 48, 70, 23, '2:1', 0, true),
('Clif', 'Bloks Energy Chews - Black Cherry + Caffeine', 'chew', '60g (6 chews)', 200, 47, 70, 23, '2:1', 50, true),
('Clif', 'Bloks Energy Chews - Margarita + Salt', 'chew', '60g (6 chews)', 200, 48, 170, 24, '2:1', 0, true),

('GU', 'Energy Chews (8 pack)', 'chew', '60g (8 chews)', 160, 39, 130, 29, '2:1', 0, true),

('Skratch Labs', 'Energy Chews (10 pack)', 'chew', '50g (10 chews)', 160, 39, 95, 27, '1:0.8', 0, true),

('Honey Stinger', 'Organic Energy Chews', 'chew', '50g (10 chews)', 160, 40, 50, 28, 'glucose-only', 0, true),

('Gatorade', 'Endurance Carb Energy Chews', 'chew', '61g (6 chews)', 190, 46, 190, 31, '2:1', 0, true);

-- BARS
INSERT INTO nutrition_products (brand, name, category, serving_size, calories, carbs_grams, sodium_mg, sugars_grams, protein_grams, fat_grams, fiber_grams, glucose_fructose_ratio, is_verified) VALUES
('Clif', 'Clif Bar - Chocolate Chip', 'bar', '68g bar', 250, 44, 170, 17, 10, 5, 4, '2:1', true),
('Clif', 'Clif Bar - Peanut Butter', 'bar', '68g bar', 260, 42, 250, 20, 11, 7, 4, '2:1', true),

('Maurten', 'Solid 225', 'bar', '60g bar', 225, 45, 60, 18, 3, 4, 0, '1:0.8', true),
('Maurten', 'Solid 160', 'bar', '45g bar', 160, 31, 55, 12, 2, 4, 0, '1:0.8', true),

('Skratch Labs', 'Anytime Energy Bar', 'bar', '50g bar', 190, 28, 115, 13, 4, 7, 2, '2:1', true),
('Skratch Labs', 'Sport Crispy Rice Cake', 'bar', '45g bar', 170, 30, 260, 8, 3, 5, 1, '2:1', true),

('Honey Stinger', 'Waffle - Honey', 'bar', '30g waffle', 150, 21, 60, 11, 1, 7, 0, 'glucose-only', true),
('Honey Stinger', 'Waffle - Caramel', 'bar', '30g waffle', 150, 21, 65, 11, 1, 6, 0, 'glucose-only', true),

('Bobo''s', 'Original Oat Bar', 'bar', '85g bar', 340, 48, 50, 17, 6, 14, 6, '2:1', true),
('Bobo''s', 'Peanut Butter Oat Bar', 'bar', '85g bar', 360, 44, 110, 14, 9, 17, 6, '2:1', true),

('UnTapped', 'Maple Waffle', 'bar', '30g waffle', 150, 23, 25, 15, 2, 6, 1, 'glucose-only', true);

-- DRINK MIXES
INSERT INTO nutrition_products (brand, name, category, serving_size, calories, carbs_grams, sodium_mg, sugars_grams, glucose_fructose_ratio, water_content_ml, is_verified) VALUES
('Maurten', 'Drink Mix 160', 'drink_mix', '40g scoop (500ml)', 160, 40, 220, 21, '1:0.8', 500, true),
('Maurten', 'Drink Mix 320', 'drink_mix', '80g scoop (500ml)', 320, 79, 440, 41, '1:0.8', 500, true),
('Maurten', 'Drink Mix 320 CAF 100', 'drink_mix', '83g scoop (500ml)', 320, 79, 440, 41, '1:0.8', 500, true),

('Skratch Labs', 'Sport Hydration Mix', 'drink_mix', '22g scoop (500ml)', 80, 20, 380, 16, '2:1', 500, true),
('Skratch Labs', 'Superfuel Drink Mix', 'drink_mix', '52g scoop (500ml)', 200, 50, 290, 12, '1:0.8', 500, true),

('Tailwind', 'Endurance Fuel', 'drink_mix', '27g scoop (500ml)', 100, 25, 303, 21, '2:1', 500, true),
('Tailwind', 'Endurance Fuel - Caffeinated', 'drink_mix', '27g scoop (500ml)', 100, 25, 303, 21, '2:1', 500, true),

('Gatorade', 'Endurance Formula Powder', 'drink_mix', '50g scoop (600ml)', 200, 47, 390, 35, '2:1', 600, true),

('Neversecond', 'C90 High Carb Drink Mix', 'drink_mix', '94g scoop (500ml)', 360, 90, 0, 45, '1:0.8', 500, true),

('SiS', 'Beta Fuel 80 Powder', 'drink_mix', '84g scoop (500ml)', 320, 80, 50, 42, '1:0.8', 500, true),

('Precision Hydration', 'PH 1500 Drink Mix', 'drink_mix', '32g scoop (500ml)', 12, 3, 1500, 0, NULL, 500, true);

-- ELECTROLYTES (Low/No Calorie)
INSERT INTO nutrition_products (brand, name, category, serving_size, calories, carbs_grams, sodium_mg, water_content_ml, is_verified) VALUES
('LMNT', 'Electrolyte Drink Mix - Raw Unflavored', 'electrolyte', '6g stick (500ml)', 0, 0, 1000, 500, true),
('LMNT', 'Electrolyte Drink Mix - Citrus Salt', 'electrolyte', '6g stick (500ml)', 0, 0, 1000, 500, true),
('LMNT', 'Electrolyte Drink Mix - Chocolate Salt', 'electrolyte', '6g stick (500ml)', 10, 2, 1000, 500, true),

('Precision Hydration', 'PH 1000 Tablets', 'electrolyte', '1 tablet (500ml)', 8, 2, 1000, 500, true),
('Precision Hydration', 'PH 1500 Tablets', 'electrolyte', '1 tablet (500ml)', 12, 3, 1500, 500, true),

('Nuun', 'Sport Electrolyte Tablets', 'electrolyte', '1 tablet (500ml)', 10, 2, 300, 500, true),
('Nuun', 'Endurance Electrolyte Tablets', 'electrolyte', '1 tablet (500ml)', 15, 4, 380, 500, true),

('SaltStick', 'Electrolyte Capsules (1 cap)', 'electrolyte', '1 capsule', 0, 0, 215, 0, true),
('SaltStick', 'Fastchews (2 chews)', 'electrolyte', '2 chews', 10, 3, 100, 0, true),

('SiS', 'GO Hydro Electrolyte Tablets', 'electrolyte', '1 tablet (500ml)', 4, 1, 350, 500, true);

-- REAL FOOD
INSERT INTO nutrition_products (brand, name, category, serving_size, calories, carbs_grams, sodium_mg, sugars_grams, protein_grams, fat_grams, fiber_grams, water_content_ml, is_verified) VALUES
('Generic', 'Banana - Medium', 'real_food', '1 medium (118g)', 105, 27, 1, 14, 1, 0, 3, 0, true),
('Generic', 'PB&J Sandwich - Half', 'real_food', '1/2 sandwich', 200, 26, 250, 10, 6, 9, 2, 0, true),
('Generic', 'Rice Cake with Nut Butter', 'real_food', '1 rice cake + 1 tbsp', 130, 14, 100, 2, 4, 8, 0, 0, true),
('Generic', 'Potato - Boiled, Salted', 'real_food', '100g', 87, 20, 350, 1, 2, 0, 2, 0, true),
('Generic', 'Medjool Date', 'real_food', '1 date (24g)', 66, 18, 0, 16, 0, 0, 2, 0, true),
('Generic', 'Fig Bar (2 bars)', 'real_food', '56g (2 bars)', 200, 40, 115, 24, 2, 4, 2, 0, true),
('Generic', 'Gummy Bears (small handful)', 'real_food', '30g', 100, 23, 10, 20, 0, 0, 0, 0, true),
('Generic', 'Pretzels (small bag)', 'real_food', '30g', 110, 23, 400, 0, 3, 1, 1, 0, true),
('Generic', 'Maple Syrup Packet', 'real_food', '20g packet', 52, 13, 2, 12, 0, 0, 0, 0, true);

-- Update the verified status on all seeded products
UPDATE nutrition_products SET is_verified = true WHERE is_verified = true;
