// Main planner component
export { NutritionPlanner } from "./NutritionPlanner";

// Product components
export { ProductCard, ProductChip } from "./ProductCard";
export { ProductPalette } from "./ProductPalette";

// Targets and progress
export { NutritionTargets, NutritionProgress, NutritionWarnings } from "./NutritionTargets";

// Timeline components
export { NutritionTimeline, AidStationMarker } from "./NutritionTimeline";
export { TimelineHourRow } from "./TimelineHourRow";

// Types
export type {
  NutritionProduct,
  TimelineProduct,
  TimelineHour,
  ProductCategory,
  ProductSource,
  ProductFilters,
  IntakeStatus,
  HourValidation,
  PackingListGroup,
} from "./types";

export {
  CATEGORY_CONFIG,
  PRODUCT_SOURCE_INFO,
  STATUS_COLORS,
} from "./types";
