/**
 * Drop Bag and Crew Planning Types
 * For managing race logistics like drop bags and crew support
 */

// ============================================
// Item Source Types
// ============================================

export type ItemSourceType = "gear_inventory" | "custom";

export type GearItemType =
  | "clothing"
  | "repair_kit"
  | "hydration_pack"
  | "bag"
  | "shoe"
  | "tire"
  | "bike";

export type CustomItemCategory =
  | "nutrition"
  | "clothing"
  | "repair"
  | "electronics"
  | "medical"
  | "other";

export const CUSTOM_ITEM_CATEGORY_LABELS: Record<CustomItemCategory, string> = {
  nutrition: "Nutrition",
  clothing: "Clothing",
  repair: "Repair",
  electronics: "Electronics",
  medical: "Medical",
  other: "Other",
};

// ============================================
// Extended Aid Station (with logistics flags)
// ============================================

export interface ExtendedAidStation {
  name: string;
  mile: number;
  supplies?: string[];
  cutoff_time?: string;
  type?: "aid_station" | "checkpoint";
  is_drop_bag?: boolean;
  is_crew_access?: boolean;
  drop_bag_notes?: string;
  crew_notes?: string;
}

// ============================================
// Drop Bag Types
// ============================================

export interface GearItemDisplay {
  id: string;
  name: string;
  brand?: string;
  model?: string;
  type: GearItemType;
  image_url?: string;
}

export interface DropBagItem {
  id: string;
  drop_bag_plan_id: string;
  location_mile: number;
  location_name: string;
  source_type: ItemSourceType;
  gear_type?: GearItemType;
  gear_id?: string;
  custom_name?: string;
  custom_category?: CustomItemCategory;
  quantity: number;
  notes?: string;
  is_critical: boolean;
  sort_order: number;
  created_at?: string;
  // Joined gear data for display
  gear_item?: GearItemDisplay;
}

// A single pass through an aid station
export interface DropBagPass {
  mile: number;
  name: string;
  direction: "outbound" | "inbound" | "single";
  arrival_time?: string;
  cutoff_time?: string;
  supplies?: string[];
  is_crew_access: boolean;
}

// A grouped drop bag location (may have multiple passes for out-and-back courses)
export interface DropBagLocation {
  // Primary identifier - either drop_bag_name or the station name
  drop_bag_name: string;
  // All passes through this location
  passes: DropBagPass[];
  // Items in this drop bag (shared across all passes)
  items: DropBagItem[];
  // Notes about this drop bag
  notes?: string;
  // Legacy single-pass fields (for backward compatibility)
  mile: number;
  name: string;
  arrival_time?: string;
  cutoff_time?: string;
  is_drop_bag: boolean;
  is_crew_access: boolean;
  supplies?: string[];
}

export interface DropBagPlan {
  id: string;
  user_id: string;
  race_plan_id: string;
  created_at: string;
  updated_at: string;
}

export interface DropBagPlanWithItems extends DropBagPlan {
  items: DropBagItem[];
}

// ============================================
// Crew Types
// ============================================

export type CrewMemberRole = "driver" | "pacer" | "support" | "photographer" | "other";

export const CREW_ROLE_LABELS: Record<CrewMemberRole, string> = {
  driver: "Driver",
  pacer: "Pacer",
  support: "Support",
  photographer: "Photographer",
  other: "Other",
};

export interface CrewMember {
  id: string;
  crew_plan_id: string;
  name: string;
  phone?: string;
  email?: string;
  role?: CrewMemberRole;
  notes?: string;
  sort_order: number;
  created_at?: string;
}

export interface CrewLocationItem {
  id: string;
  crew_plan_id: string;
  location_mile: number;
  location_name: string;
  source_type: ItemSourceType;
  gear_type?: GearItemType;
  gear_id?: string;
  custom_name?: string;
  custom_category?: CustomItemCategory;
  quantity: number;
  notes?: string;
  is_critical: boolean;
  sort_order: number;
  created_at?: string;
  // Joined gear data for display
  gear_item?: GearItemDisplay;
}

export interface CrewLocationInstructions {
  id?: string;
  crew_plan_id?: string;
  location_mile: number;
  location_name: string;
  expected_arrival_time?: string;
  expected_departure_time?: string;
  planned_stop_duration_minutes?: number;
  priority_actions?: string;
  nutrition_notes?: string;
  hydration_notes?: string;
  equipment_changes?: string;
  mental_cues?: string;
  parking_spot?: string;
  setup_notes?: string;
  sort_order?: number;
  created_at?: string;
}

export interface CrewLocation {
  mile: number;
  name: string;
  items: CrewLocationItem[];
  instructions?: CrewLocationInstructions;
  // Race-defined info (from races.crew_locations)
  access_type?: "unlimited" | "limited" | "reserved";
  parking_info?: string;
  shuttle_info?: string;
  setup_time?: string;
  restrictions?: string;
  race_notes?: string;
}

export interface CrewPlan {
  id: string;
  user_id: string;
  race_plan_id: string;
  crew_lead_name?: string;
  crew_lead_phone?: string;
  crew_lead_email?: string;
  general_instructions?: string;
  created_at: string;
  updated_at: string;
}

export interface CrewPlanWithDetails extends CrewPlan {
  members: CrewMember[];
  location_items: CrewLocationItem[];
  location_instructions: CrewLocationInstructions[];
}

// ============================================
// Race Crew Location (race-defined by admin)
// ============================================

export interface RaceCrewLocation {
  name: string;
  mile_out: number;
  mile_in?: number;
  access_type: "unlimited" | "limited" | "reserved";
  parking_info?: string;
  setup_time?: string;
  shuttle_info?: string;
  notes?: string;
  restrictions?: string;
}

// ============================================
// UI Helper Types
// ============================================

export type LogisticsTab = "dropbag" | "crew";

export interface LogisticsLocationSummary {
  mile: number;
  name: string;
  type: "drop_bag" | "crew" | "both";
  itemCount: number;
  hasCriticalItems: boolean;
  arrivalTime?: string;
}

// Common items for quick-add
export interface QuickAddItem {
  name: string;
  category: CustomItemCategory;
  icon?: string;
}

export const COMMON_DROP_BAG_ITEMS: QuickAddItem[] = [
  { name: "Extra socks", category: "clothing" },
  { name: "Arm warmers", category: "clothing" },
  { name: "Leg warmers", category: "clothing" },
  { name: "Rain jacket", category: "clothing" },
  { name: "Gloves", category: "clothing" },
  { name: "Spare tube", category: "repair" },
  { name: "CO2 cartridge", category: "repair" },
  { name: "Chain link", category: "repair" },
  { name: "Spare battery", category: "electronics" },
  { name: "Phone charger", category: "electronics" },
  { name: "Head lamp", category: "electronics" },
  { name: "Tail light", category: "electronics" },
  { name: "Gels", category: "nutrition" },
  { name: "Bars", category: "nutrition" },
  { name: "Drink mix", category: "nutrition" },
  { name: "Pickle juice", category: "nutrition" },
  { name: "Salt tabs", category: "nutrition" },
  { name: "Caffeine pills", category: "nutrition" },
  { name: "Ibuprofen", category: "medical" },
  { name: "Blister kit", category: "medical" },
  { name: "Anti-chafe cream", category: "medical" },
  { name: "Sunscreen", category: "other" },
  { name: "Lip balm", category: "other" },
];

export const COMMON_CREW_ITEMS: QuickAddItem[] = [
  ...COMMON_DROP_BAG_ITEMS,
  { name: "Fresh bottles", category: "nutrition" },
  { name: "Ice", category: "nutrition" },
  { name: "Wet towels", category: "other" },
  { name: "Dry towel", category: "other" },
  { name: "Chair", category: "other" },
  { name: "Umbrella", category: "other" },
  { name: "Cooler", category: "nutrition" },
  { name: "First aid kit", category: "medical" },
];
