/**
 * Types for the Nutrition Planner feature
 */

import type {
  SweatRate,
  GutTrainingLevel,
  HourlyTargets,
} from "@/lib/calculations/nutritionScience";

// ============================================================================
// Product Types
// ============================================================================

/**
 * Product category for filtering and display
 */
export type ProductCategory =
  | "gel"
  | "chew"
  | "bar"
  | "drink_mix"
  | "real_food"
  | "electrolyte"
  | "other";

/**
 * Nutrition product from database
 */
export interface NutritionProduct {
  id: string;
  brand: string;
  name: string;
  category: ProductCategory;

  // Per serving nutritional info
  servingSize: string | null;
  calories: number;
  carbsGrams: number;
  sodiumMg: number;

  // Advanced carb data
  sugarsGrams: number | null;
  glucoseGrams: number | null;
  fructoseGrams: number | null;
  maltodextrinGrams: number | null;
  glucoseFructoseRatio: string | null;

  // Additional nutritional info
  caffeineMg: number | null;
  proteinGrams: number | null;
  fatGrams: number | null;
  fiberGrams: number | null;

  // Hydration component
  waterContentMl: number | null;

  // Metadata
  imageUrl: string | null;
  isVerified: boolean;
  notes: string | null;
}

/**
 * Product item in the timeline (with quantity and source)
 */
export interface TimelineProduct {
  id: string;
  productId: string;
  product: NutritionProduct;
  quantity: number;
  fluidMl: number | null; // Custom fluid amount for drink mixes
  source: ProductSource;
  sourceLocationId: string | null;
  sourceName: string | null;
  notes: string | null;
  sortOrder: number;
}

/**
 * Source of nutrition product
 */
export type ProductSource = "on_bike" | "drop_bag" | "aid_station" | "crew";

/**
 * Display info for product source
 */
export const PRODUCT_SOURCE_INFO: Record<ProductSource, { label: string; icon: string; color: string }> = {
  on_bike: { label: "On Bike", icon: "🚴", color: "bg-blue-100 text-blue-800" },
  drop_bag: { label: "Drop Bag", icon: "📦", color: "bg-amber-100 text-amber-800" },
  aid_station: { label: "Aid Station", icon: "🏁", color: "bg-green-100 text-green-800" },
  crew: { label: "Crew", icon: "👋", color: "bg-purple-100 text-purple-800" },
};

// ============================================================================
// Timeline Types
// ============================================================================

/**
 * Single hour row in the nutrition timeline
 */
export interface TimelineHour {
  hourNumber: number;
  startTime: string; // e.g., "6:00 AM"
  endTime: string; // e.g., "7:00 AM"
  products: TimelineProduct[];
  waterMl: number;
  waterSource: ProductSource | null;

  // Calculated totals for this hour
  totals: {
    carbs: number;
    calories: number;
    sodium: number;
    caffeine: number;
    fluid: number; // includes water + drink mixes
  };

  // Course context (if available)
  courseContext?: {
    startMile: number;
    endMile: number;
    segmentName: string | null;
    avgGradient: number;
    isClimbing: boolean;
  };

  // Aid station in this hour (if any)
  aidStation?: {
    id: string;
    name: string;
    mile: number;
    hasDropBags: boolean;
    hasCrewAccess: boolean;
  };
}

/**
 * Validation status for hourly intake
 */
export type IntakeStatus = "below" | "on-target" | "above";

/**
 * Hourly validation result
 */
export interface HourValidation {
  carbsStatus: IntakeStatus;
  carbsPercent: number;
  fluidStatus: IntakeStatus;
  fluidPercent: number;
  sodiumStatus: IntakeStatus;
  sodiumPercent: number;
  hasOptimalCarbRatio: boolean;
  warnings: string[];
}

// ============================================================================
// Planner State Types
// ============================================================================

/**
 * Product filter options
 */
export interface ProductFilters {
  search: string;
  categories: ProductCategory[];
  caffeineOnly: boolean;
  caffeineeFree: boolean;
  favoritesOnly: boolean;
}

/**
 * Weather conditions for target calculation
 */
export interface WeatherConditions {
  temperatureF: number;
  humidity: number;
}

/**
 * Athlete nutrition preferences
 */
export interface AthleteNutritionProfile {
  gutTrainingLevel: GutTrainingLevel;
  sweatRate: SweatRate;
  knownSweatRateMlPerHour: number | null;
}

/**
 * Complete nutrition plan state
 */
export interface NutritionPlanState {
  // Plan identity
  nutritionPlanId: string | null;
  racePlanId: string | null;

  // Race info
  raceDurationHours: number;
  maxElevationFt: number;
  raceStartTime: string;

  // Athlete info
  athleteWeightKg: number;
  athleteProfile: AthleteNutritionProfile;

  // Weather
  weather: WeatherConditions;

  // Calculated targets
  hourlyTargets: HourlyTargets | null;
  totalTargets: {
    carbs: number;
    calories: number;
    sodium: number;
    fluid: number;
  } | null;

  // Timeline data
  hours: TimelineHour[];

  // Products
  products: NutritionProduct[];
  favoriteProductIds: Set<string>;

  // UI state
  selectedHourIndex: number | null;
  selectedProductId: string | null;
  filters: ProductFilters;
  isDragging: boolean;

  // Warnings/recommendations
  warnings: string[];
  recommendations: string[];
}

// ============================================================================
// Drag & Drop Types
// ============================================================================

/**
 * Data attached to draggable product
 */
export interface DraggableProductData {
  type: "product";
  product: NutritionProduct;
  fromHour?: number; // If moving from existing position
  fromIndex?: number;
}

/**
 * Droppable hour zone data
 */
export interface DroppableHourData {
  type: "hour";
  hourNumber: number;
}

// ============================================================================
// Packing List Types
// ============================================================================

/**
 * Grouped products by source for packing lists
 */
export interface PackingListGroup {
  source: ProductSource;
  locationName: string | null;
  locationMile: number | null;
  items: Array<{
    product: NutritionProduct;
    quantity: number;
    totalCarbs: number;
    totalCalories: number;
  }>;
  totals: {
    carbs: number;
    calories: number;
    sodium: number;
    items: number;
  };
}

// ============================================================================
// UI Component Props
// ============================================================================

/**
 * Category display configuration
 */
export interface CategoryConfig {
  label: string;
  icon: string; // Emoji fallback
  iconImage?: string; // Optional image path (e.g., "/icons/gel.png")
  color: string;
}

export const CATEGORY_CONFIG: Record<ProductCategory, CategoryConfig> = {
  gel: { label: "Gels", icon: "⚡", iconImage: "/icons/gel.png", color: "bg-sky-100 text-sky-800" },
  chew: { label: "Chews", icon: "🍬", color: "bg-pink-100 text-pink-800" },
  bar: { label: "Bars", icon: "🍫", color: "bg-amber-100 text-amber-800" },
  drink_mix: { label: "Drinks", icon: "🥤", color: "bg-blue-100 text-blue-800" },
  real_food: { label: "Real Food", icon: "🍌", color: "bg-green-100 text-green-800" },
  electrolyte: { label: "Electrolytes", icon: "⚡", color: "bg-yellow-100 text-yellow-800" },
  other: { label: "Other", icon: "📦", color: "bg-gray-100 text-gray-800" },
};

/**
 * Status color configuration for validation
 */
export const STATUS_COLORS = {
  below: {
    bg: "bg-red-50",
    border: "border-red-200",
    text: "text-red-700",
    fill: "bg-red-500",
  },
  "on-target": {
    bg: "bg-green-50",
    border: "border-green-200",
    text: "text-green-700",
    fill: "bg-green-500",
  },
  above: {
    bg: "bg-amber-50",
    border: "border-amber-200",
    text: "text-amber-700",
    fill: "bg-amber-500",
  },
} as const;
