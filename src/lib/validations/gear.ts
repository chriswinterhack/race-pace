import { z } from "zod";

// Bike validation schema
export const bikeSchema = z.object({
  brand: z.string().min(1, "Brand is required").max(100),
  model: z.string().min(1, "Model is required").max(100),
  year: z.number().int().min(1990).max(2030).nullable().optional(),
  bike_type: z.enum(["road", "gravel", "mtb", "cx"]),
  notes: z.string().max(500).nullable().optional(),
});

// Tire validation schema
export const tireSchema = z.object({
  brand: z.string().min(1, "Brand is required").max(100),
  model: z.string().min(1, "Model is required").max(100),
  width_value: z.coerce.number().min(0.1, "Width is required").max(100),
  width_unit: z.enum(["mm", "in"]),
  tire_type: z.enum(["tubeless", "clincher", "tubular"]).nullable().optional(),
  notes: z.string().max(500).nullable().optional(),
});

// Shoe validation schema (cycling shoes)
export const shoeSchema = z.object({
  brand: z.string().min(1, "Brand is required").max(100),
  model: z.string().min(1, "Model is required").max(100),
  shoe_type: z.enum(["road", "gravel", "mtb", "flat"]).nullable().optional(),
  cleat_type: z.enum(["spd", "spd_sl", "look", "speedplay", "time", "flat"]).nullable().optional(),
  notes: z.string().max(500).nullable().optional(),
});

// Hydration pack validation schema
export const hydrationPackSchema = z.object({
  brand: z.string().min(1, "Brand is required").max(100),
  model: z.string().min(1, "Model is required").max(100),
  capacity_liters: z.number().min(0.5).max(20).nullable().optional(),
  notes: z.string().max(500).nullable().optional(),
});

// Bag validation schema
export const bagSchema = z.object({
  brand: z.string().min(1, "Brand is required").max(100),
  model: z.string().min(1, "Model is required").max(100),
  bag_type: z.enum(["saddle", "frame", "handlebar", "top_tube", "stem", "feed", "travel_bag"]),
  capacity_liters: z.number().min(0.1).max(20).nullable().optional(),
  notes: z.string().max(500).nullable().optional(),
});

// Repair kit validation schema
export const repairKitSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  items: z.array(z.string().max(100)).max(50).default([]),
  notes: z.string().max(500).nullable().optional(),
});

// Clothing validation schema
export const clothingSchema = z.object({
  brand: z.string().max(100).nullable().optional(),
  name: z.string().min(1, "Name is required").max(100),
  clothing_type: z.enum([
    "jersey", "bibs", "jacket", "vest", "arm_warmers", "leg_warmers",
    "knee_warmers", "gloves", "cap", "socks", "shoe_covers",
    "base_layer", "shorts", "tights", "shirt", "other"
  ]),
  notes: z.string().max(500).nullable().optional(),
});

// Race gear selection validation schema
export const raceGearSelectionSchema = z.object({
  race_id: z.string().uuid(),
  race_edition_id: z.string().uuid().nullable().optional(),
  race_distance_id: z.string().uuid().nullable().optional(),
  bike_id: z.string().uuid().nullable().optional(),
  front_tire_id: z.string().uuid().nullable().optional(),
  rear_tire_id: z.string().uuid().nullable().optional(),
  shoe_id: z.string().uuid().nullable().optional(),
  hydration_pack_id: z.string().uuid().nullable().optional(),
  repair_kit_id: z.string().uuid().nullable().optional(),
  bag_ids: z.array(z.string().uuid()).optional(),
  clothing_ids: z.array(z.string().uuid()).optional(),
  is_public: z.boolean().default(true),
  notes: z.string().max(1000).nullable().optional(),
});

// Type exports for form usage
export type BikeFormData = z.infer<typeof bikeSchema>;
export type TireFormData = z.infer<typeof tireSchema>;
export type ShoeFormData = z.infer<typeof shoeSchema>;
export type HydrationPackFormData = z.infer<typeof hydrationPackSchema>;
export type BagFormData = z.infer<typeof bagSchema>;
export type RepairKitFormData = z.infer<typeof repairKitSchema>;
export type ClothingFormData = z.infer<typeof clothingSchema>;
export type RaceGearSelectionFormData = z.infer<typeof raceGearSelectionSchema>;
