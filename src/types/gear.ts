// Gear inventory types for FinalClimb

// Gear category enums
export type BikeType = "road" | "gravel" | "mtb" | "cx";
export type TireType = "tubeless" | "clincher" | "tubular";
export type TireWidthUnit = "mm" | "in";
export type ShoeType = "road" | "gravel" | "mtb" | "flat";
export type CleatType = "spd" | "spd_sl" | "look" | "speedplay" | "time" | "flat";

// Common tire width presets
export const TIRE_WIDTH_OPTIONS_MM = [
  { value: 23, label: "23mm", category: "road" },
  { value: 25, label: "25mm", category: "road" },
  { value: 28, label: "28mm", category: "road" },
  { value: 30, label: "30mm", category: "road" },
  { value: 32, label: "32mm", category: "road" },
  { value: 35, label: "35mm", category: "gravel" },
  { value: 38, label: "38mm", category: "gravel" },
  { value: 40, label: "40mm", category: "gravel" },
  { value: 42, label: "42mm", category: "gravel" },
  { value: 45, label: "45mm", category: "gravel" },
  { value: 47, label: "47mm", category: "gravel" },
  { value: 50, label: "50mm", category: "gravel" },
  { value: 53, label: "53mm", category: "gravel" },
  { value: 55, label: "55mm", category: "gravel" },
] as const;

export const TIRE_WIDTH_OPTIONS_IN = [
  { value: 1.9, label: "1.9\"", category: "mtb" },
  { value: 2.0, label: "2.0\"", category: "mtb" },
  { value: 2.1, label: "2.1\"", category: "mtb" },
  { value: 2.2, label: "2.2\"", category: "mtb" },
  { value: 2.25, label: "2.25\"", category: "mtb" },
  { value: 2.3, label: "2.3\"", category: "mtb" },
  { value: 2.35, label: "2.35\"", category: "mtb" },
  { value: 2.4, label: "2.4\"", category: "mtb" },
  { value: 2.5, label: "2.5\"", category: "mtb" },
  { value: 2.6, label: "2.6\"", category: "mtb" },
  { value: 2.8, label: "2.8\"", category: "plus" },
  { value: 3.0, label: "3.0\"", category: "plus" },
] as const;
export type BagType = "saddle" | "frame" | "handlebar" | "top_tube" | "stem" | "feed" | "travel_bag";
export type ClothingType =
  | "jersey"
  | "bibs"
  | "jacket"
  | "vest"
  | "arm_warmers"
  | "leg_warmers"
  | "knee_warmers"
  | "gloves"
  | "cap"
  | "socks"
  | "shoe_covers"
  | "base_layer"
  | "shorts"
  | "tights"
  | "shirt"
  | "other";

// User inventory item types
export interface UserBike {
  id: string;
  user_id: string;
  brand: string;
  model: string;
  year: number | null;
  bike_type: BikeType;
  image_url: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserTire {
  id: string;
  user_id: string;
  brand: string;
  model: string;
  width_value: number;
  width_unit: TireWidthUnit;
  tire_type: TireType | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// Helper to format tire width display
export function formatTireWidth(value: number, unit: TireWidthUnit): string {
  if (unit === "in") {
    return `${value}"`;
  }
  return `${value}mm`;
}

export interface UserShoe {
  id: string;
  user_id: string;
  brand: string;
  model: string;
  shoe_type: ShoeType | null;
  cleat_type: CleatType | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserHydrationPack {
  id: string;
  user_id: string;
  brand: string;
  model: string;
  capacity_liters: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserBag {
  id: string;
  user_id: string;
  brand: string;
  model: string;
  bag_type: BagType;
  capacity_liters: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserRepairKit {
  id: string;
  user_id: string;
  name: string;
  items: string[];
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserClothing {
  id: string;
  user_id: string;
  brand: string | null;
  name: string;
  clothing_type: ClothingType;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// Race-specific gear selection
export interface RaceGearSelection {
  id: string;
  user_id: string;
  race_id: string;
  race_edition_id: string | null;
  race_distance_id: string | null;
  bike_id: string | null;
  front_tire_id: string | null;
  rear_tire_id: string | null;
  shoe_id: string | null;
  hydration_pack_id: string | null;
  repair_kit_id: string | null;
  is_public: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// Race gear selection with expanded relations
export interface RaceGearSelectionFull extends RaceGearSelection {
  bike: UserBike | null;
  front_tire: UserTire | null;
  rear_tire: UserTire | null;
  shoe: UserShoe | null;
  hydration_pack: UserHydrationPack | null;
  repair_kit: UserRepairKit | null;
  bags: UserBag[];
  clothing: UserClothing[];
}

// User's complete gear inventory
export interface UserGearInventory {
  bikes: UserBike[];
  tires: UserTire[];
  shoes: UserShoe[];
  hydration_packs: UserHydrationPack[];
  bags: UserBag[];
  repair_kits: UserRepairKit[];
  clothing: UserClothing[];
}

// Community gear aggregation for stats
export interface GearAggregation {
  item_type: "bike" | "tire" | "shoe" | "hydration_pack" | "bag";
  brand: string;
  model: string;
  width?: string; // For tires: "2.4"" or "40mm"
  count: number;
  percentage: number;
}

// Gear stats for a race
export interface RaceGearStats {
  total_participants: number;
  bikes: GearAggregation[];
  front_tires: GearAggregation[];
  rear_tires: GearAggregation[];
  shoes: GearAggregation[];
  hydration_packs: GearAggregation[];
}

// Input types for creating/updating gear (without id, timestamps)
export type UserBikeInput = Omit<UserBike, "id" | "user_id" | "created_at" | "updated_at">;
export type UserTireInput = Omit<UserTire, "id" | "user_id" | "created_at" | "updated_at">;
export type UserShoeInput = Omit<UserShoe, "id" | "user_id" | "created_at" | "updated_at">;
export type UserHydrationPackInput = Omit<UserHydrationPack, "id" | "user_id" | "created_at" | "updated_at">;
export type UserBagInput = Omit<UserBag, "id" | "user_id" | "created_at" | "updated_at">;
export type UserRepairKitInput = Omit<UserRepairKit, "id" | "user_id" | "created_at" | "updated_at">;
export type UserClothingInput = Omit<UserClothing, "id" | "user_id" | "created_at" | "updated_at">;

export interface RaceGearSelectionInput {
  race_id: string;
  race_edition_id?: string | null;
  race_distance_id?: string | null;
  bike_id?: string | null;
  front_tire_id?: string | null;
  rear_tire_id?: string | null;
  shoe_id?: string | null;
  hydration_pack_id?: string | null;
  repair_kit_id?: string | null;
  bag_ids?: string[];
  clothing_ids?: string[];
  is_public?: boolean;
  notes?: string | null;
}

// Helper types for display labels
export const BIKE_TYPE_LABELS: Record<BikeType, string> = {
  road: "Road",
  gravel: "Gravel",
  mtb: "Mountain",
  cx: "Cyclocross",
};

export const TIRE_TYPE_LABELS: Record<TireType, string> = {
  tubeless: "Tubeless",
  clincher: "Clincher",
  tubular: "Tubular",
};

export const SHOE_TYPE_LABELS: Record<ShoeType, string> = {
  road: "Road",
  gravel: "Gravel",
  mtb: "MTB",
  flat: "Flat Pedal",
};

export const CLEAT_TYPE_LABELS: Record<CleatType, string> = {
  spd: "SPD (2-bolt)",
  spd_sl: "SPD-SL (3-bolt)",
  look: "Look (3-bolt)",
  speedplay: "Speedplay",
  time: "Time",
  flat: "Flat (no cleats)",
};

export const BAG_TYPE_LABELS: Record<BagType, string> = {
  saddle: "Saddle Bag",
  frame: "Frame Bag",
  handlebar: "Handlebar Bag",
  top_tube: "Top Tube Bag",
  stem: "Stem Bag",
  feed: "Feed Bag",
  travel_bag: "Travel Bag",
};

export const CLOTHING_TYPE_LABELS: Record<ClothingType, string> = {
  jersey: "Jersey",
  bibs: "Bib Shorts",
  jacket: "Jacket",
  vest: "Vest",
  arm_warmers: "Arm Warmers",
  leg_warmers: "Leg Warmers",
  knee_warmers: "Knee Warmers",
  gloves: "Gloves",
  cap: "Cap",
  socks: "Socks",
  shoe_covers: "Shoe Covers",
  base_layer: "Base Layer",
  shorts: "Shorts",
  tights: "Tights",
  shirt: "Shirt",
  other: "Other",
};
