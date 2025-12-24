export {
  calculateAltitudeAdjustedFTP,
  calculateTargetNP,
  calculateClimbPower,
  calculateFlatPower,
  calculateTerrainPower,
  calculatePowerRange,
} from "./power";

export {
  calculateEnergyKJ,
  calculateCaloriesBurned,
  calculateMinCHOPerHour,
  calculateRaceNutrition,
} from "./nutrition";

// Nutrition Science Engine (sports science-based calculations)
export {
  // Main calculation function
  calculateRaceNutritionPlan,
  // Individual calculation functions
  calculateCarbTargets,
  calculateFluidTargets,
  calculateSodiumTargets,
  calculateCalorieTarget,
  // Helper functions
  getCarbRangeForDuration,
  getAltitudeMultiplier,
  getFluidRangeForTemperature,
  getWeightFluidFactor,
  getDurationCategory,
  // Glucose:Fructose ratio helpers
  assessGlucoseFructoseRatio,
  hasOptimalCarbMix,
  // Validation
  validateHourlyIntake,
  isCaffeineLate,
  // Warning/Recommendation generators
  generateWarnings,
  generateRecommendations,
  // Constants
  CARB_RANGES,
  GUT_TRAINING_MAX_CARBS,
  ALTITUDE_THRESHOLDS,
  ALTITUDE_CARB_MULTIPLIERS,
  TEMPERATURE_RANGES,
  HUMIDITY_THRESHOLD,
  HUMIDITY_FLUID_MULTIPLIER,
  WEIGHT_THRESHOLDS,
  SODIUM_RANGES,
  SODIUM_HEAT_ADJUSTMENT,
  GLUCOSE_FRUCTOSE_RATIOS,
  CALORIES_PER_GRAM,
} from "./nutritionScience";
export type {
  SweatRate,
  GutTrainingLevel,
  NutritionInputs,
  HourlyTargets,
  RaceNutritionPlan,
  GlucoseFructoseRatioQuality,
  HourlyValidation,
} from "./nutritionScience";

export {
  calculateSegmentTime,
  calculateRequiredSpeed,
  formatDuration,
  parseDuration,
  calculateArrivalTime,
  calculateCutoffMargin,
  getCutoffStatus,
  estimateSpeed,
  calculateCheckpointArrivals,
  calculateTotalTime,
  generateSegmentsFromAidStations,
  calculateTerrainDifficulty,
  calculateTerrainAdjustedTime,
  extractSegmentElevation,
} from "./pacing";
export type { ElevationPoint, Segment } from "./pacing";
