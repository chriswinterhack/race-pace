/**
 * Sports Science Engine for Nutrition Planning
 *
 * Implements evidence-based nutrition recommendations for endurance cycling.
 * Based on current scientific consensus for carbohydrate, hydration, and
 * electrolyte intake during ultra-endurance events.
 *
 * Key references:
 * - Jeukendrup (2014): Multiple transportable carbohydrates
 * - Thomas et al. (2016): ACSM nutrition guidelines
 * - Stellingwerff & Cox (2014): Gut training adaptations
 */

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

/**
 * Sweat rate classification for sodium recommendations
 */
export type SweatRate = "light" | "average" | "heavy";

/**
 * Gut training level affects max carbohydrate absorption
 */
export type GutTrainingLevel = "beginner" | "intermediate" | "advanced";

/**
 * Inputs for calculating personalized nutrition targets
 */
export interface NutritionInputs {
  /** Expected race duration in hours */
  raceDurationHours: number;
  /** Total elevation gain in feet */
  elevationGainFt: number;
  /** Maximum elevation reached in feet */
  maxElevationFt: number;
  /** Expected temperature in Fahrenheit */
  temperatureF: number;
  /** Expected humidity percentage (0-100) */
  humidity: number;
  /** Athlete weight in kilograms */
  athleteWeightKg: number;
  /** Self-reported sweat rate classification */
  sweatRate?: SweatRate;
  /** Level of gut training for high carb intake */
  gutTrainingLevel?: GutTrainingLevel;
  /** Known sweat rate in ml/hour (if tested) */
  knownSweatRateMlPerHour?: number;
}

/**
 * Hourly intake targets with min/max/target ranges
 */
export interface HourlyTargets {
  /** Minimum carbohydrate intake in grams */
  carbsGramsMin: number;
  /** Maximum carbohydrate intake in grams */
  carbsGramsMax: number;
  /** Target carbohydrate intake in grams */
  carbsGramsTarget: number;
  /** Minimum fluid intake in milliliters */
  fluidMlMin: number;
  /** Maximum fluid intake in milliliters */
  fluidMlMax: number;
  /** Target fluid intake in milliliters */
  fluidMlTarget: number;
  /** Minimum sodium intake in milligrams */
  sodiumMgMin: number;
  /** Maximum sodium intake in milligrams */
  sodiumMgMax: number;
  /** Target sodium intake in milligrams */
  sodiumMgTarget: number;
  /** Calorie target (derived from carbs + other macros) */
  caloriesTarget: number;
}

/**
 * Complete race nutrition plan with targets and recommendations
 */
export interface RaceNutritionPlan {
  /** Per-hour intake targets */
  hourlyTargets: HourlyTargets;
  /** Total requirements for entire race */
  totalTargets: {
    carbs: number;
    calories: number;
    sodium: number;
    fluid: number;
  };
  /** Warning messages for athlete awareness */
  warnings: string[];
  /** Positive recommendations */
  recommendations: string[];
  /** Raw calculation factors for transparency */
  factors: {
    altitudeMultiplier: number;
    temperatureMultiplier: number;
    humidityMultiplier: number;
    durationCategory: string;
  };
}

/**
 * Glucose:Fructose ratio quality assessment
 */
export type GlucoseFructoseRatioQuality = "optimal" | "acceptable" | "suboptimal" | "unknown";

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Carbohydrate intake ranges by race duration (grams per hour)
 * Based on Jeukendrup & Stellingwerff research
 */
export const CARB_RANGES = {
  /** Under 1 hour: water only, no carbs needed */
  UNDER_1_HOUR: { min: 0, max: 0 },
  /** 1-2 hours: moderate intake */
  ONE_TO_TWO_HOURS: { min: 30, max: 60 },
  /** 2-3 hours: higher intake, approaching MTC threshold */
  TWO_TO_THREE_HOURS: { min: 60, max: 90 },
  /** 3+ hours: maximum absorption with proper carb mix */
  OVER_THREE_HOURS: { min: 80, max: 120 },
} as const;

/**
 * Maximum carbohydrate absorption by gut training level
 * Advanced athletes can absorb 120g+ with proper gut training
 */
export const GUT_TRAINING_MAX_CARBS: Record<GutTrainingLevel, number> = {
  beginner: 80,
  intermediate: 100,
  advanced: 120,
} as const;

/**
 * Altitude thresholds for carbohydrate adjustment (feet)
 * Higher altitude increases glycolytic demand
 */
export const ALTITUDE_THRESHOLDS = {
  /** Below this: no adjustment */
  MODERATE: 8000,
  /** Above this: increased adjustment */
  HIGH: 10000,
} as const;

/**
 * Carbohydrate multipliers by altitude
 * Based on increased glycolytic demand at altitude
 */
export const ALTITUDE_CARB_MULTIPLIERS = {
  /** Below 8,000 ft: no adjustment */
  SEA_LEVEL: 1.0,
  /** 8,000-10,000 ft: 10-15% increase */
  MODERATE: 1.125,
  /** Above 10,000 ft: 15-20% increase */
  HIGH: 1.175,
} as const;

/**
 * Temperature ranges for hydration (Fahrenheit)
 */
export const TEMPERATURE_RANGES = {
  /** Cold/Cool conditions */
  COLD: { max: 50, fluidMin: 400, fluidMax: 600 },
  /** Temperate conditions */
  TEMPERATE: { min: 50, max: 70, fluidMin: 500, fluidMax: 750 },
  /** Warm conditions */
  WARM: { min: 70, max: 85, fluidMin: 750, fluidMax: 1000 },
  /** Hot conditions */
  HOT: { min: 85, fluidMin: 1000, fluidMax: 1500 },
} as const;

/**
 * Humidity threshold for fluid increase
 * High humidity impairs evaporative cooling
 */
export const HUMIDITY_THRESHOLD = 70;

/**
 * Humidity multiplier for fluid needs
 * 15-25% increase when humidity > 70%
 */
export const HUMIDITY_FLUID_MULTIPLIER = 1.20;

/**
 * Weight-based fluid adjustment thresholds (kg)
 */
export const WEIGHT_THRESHOLDS = {
  LIGHT: 65,
  HEAVY: 85,
} as const;

/**
 * Sodium ranges by sweat rate (mg per hour)
 */
export const SODIUM_RANGES: Record<SweatRate, { min: number; max: number }> = {
  light: { min: 300, max: 500 },
  average: { min: 500, max: 700 },
  heavy: { min: 700, max: 1000 },
} as const;

/**
 * Heat adjustment for sodium (mg per hour)
 */
export const SODIUM_HEAT_ADJUSTMENT = {
  /** Hot conditions (85°F+) */
  HOT: 250,
  /** High humidity (>70%) */
  HIGH_HUMIDITY: 150,
} as const;

/**
 * Glucose:Fructose ratios and their quality
 * 1:0.8 or 2:1 are optimal for absorption
 */
export const GLUCOSE_FRUCTOSE_RATIOS = {
  OPTIMAL: ["1:0.8", "2:1", "1:1"],
  ACCEPTABLE: ["3:1", "1:0.5"],
} as const;

/**
 * Calories per gram of macronutrient
 */
export const CALORIES_PER_GRAM = {
  CARBS: 4,
  PROTEIN: 4,
  FAT: 9,
} as const;

// ============================================================================
// CARBOHYDRATE CALCULATIONS
// ============================================================================

/**
 * Get base carbohydrate range for race duration
 */
export function getCarbRangeForDuration(durationHours: number): { min: number; max: number } {
  if (durationHours < 1) {
    return { ...CARB_RANGES.UNDER_1_HOUR };
  }
  if (durationHours < 2) {
    return { ...CARB_RANGES.ONE_TO_TWO_HOURS };
  }
  if (durationHours < 3) {
    return { ...CARB_RANGES.TWO_TO_THREE_HOURS };
  }
  return { ...CARB_RANGES.OVER_THREE_HOURS };
}

/**
 * Get altitude multiplier for carbohydrate needs
 */
export function getAltitudeMultiplier(maxElevationFt: number): number {
  if (maxElevationFt >= ALTITUDE_THRESHOLDS.HIGH) {
    return ALTITUDE_CARB_MULTIPLIERS.HIGH;
  }
  if (maxElevationFt >= ALTITUDE_THRESHOLDS.MODERATE) {
    return ALTITUDE_CARB_MULTIPLIERS.MODERATE;
  }
  return ALTITUDE_CARB_MULTIPLIERS.SEA_LEVEL;
}

/**
 * Calculate carbohydrate targets per hour
 */
export function calculateCarbTargets(
  durationHours: number,
  maxElevationFt: number,
  gutTrainingLevel: GutTrainingLevel = "intermediate"
): { min: number; max: number; target: number } {
  const baseRange = getCarbRangeForDuration(durationHours);
  const altitudeMultiplier = getAltitudeMultiplier(maxElevationFt);
  const maxAbsorption = GUT_TRAINING_MAX_CARBS[gutTrainingLevel];

  // Apply altitude adjustment
  const adjustedMin = Math.round(baseRange.min * altitudeMultiplier);
  const adjustedMax = Math.round(baseRange.max * altitudeMultiplier);

  // Cap at gut training max
  const cappedMax = Math.min(adjustedMax, maxAbsorption);

  // Target is middle of range
  const target = Math.round((adjustedMin + cappedMax) / 2);

  return {
    min: adjustedMin,
    max: cappedMax,
    target,
  };
}

// ============================================================================
// HYDRATION CALCULATIONS
// ============================================================================

/**
 * Get base fluid range for temperature
 */
export function getFluidRangeForTemperature(temperatureF: number): { min: number; max: number } {
  if (temperatureF < TEMPERATURE_RANGES.COLD.max) {
    return { min: TEMPERATURE_RANGES.COLD.fluidMin, max: TEMPERATURE_RANGES.COLD.fluidMax };
  }
  if (temperatureF < TEMPERATURE_RANGES.TEMPERATE.max) {
    return { min: TEMPERATURE_RANGES.TEMPERATE.fluidMin, max: TEMPERATURE_RANGES.TEMPERATE.fluidMax };
  }
  if (temperatureF < TEMPERATURE_RANGES.WARM.max) {
    return { min: TEMPERATURE_RANGES.WARM.fluidMin, max: TEMPERATURE_RANGES.WARM.fluidMax };
  }
  return { min: TEMPERATURE_RANGES.HOT.fluidMin, max: TEMPERATURE_RANGES.HOT.fluidMax };
}

/**
 * Get weight-based fluid adjustment factor
 * Lighter riders need less fluid, heavier riders need more
 */
export function getWeightFluidFactor(weightKg: number): number {
  if (weightKg < WEIGHT_THRESHOLDS.LIGHT) {
    return 0.9; // 10% less for lighter riders
  }
  if (weightKg > WEIGHT_THRESHOLDS.HEAVY) {
    return 1.1; // 10% more for heavier riders
  }
  return 1.0;
}

/**
 * Calculate fluid targets per hour
 */
export function calculateFluidTargets(
  temperatureF: number,
  humidity: number,
  athleteWeightKg: number,
  knownSweatRateMlPerHour?: number
): { min: number; max: number; target: number } {
  // If athlete has tested sweat rate, use it
  if (knownSweatRateMlPerHour && knownSweatRateMlPerHour > 0) {
    // Target 100% of sweat rate, range from 80-120%
    return {
      min: Math.round(knownSweatRateMlPerHour * 0.8),
      max: Math.round(knownSweatRateMlPerHour * 1.2),
      target: Math.round(knownSweatRateMlPerHour),
    };
  }

  // Calculate from environmental factors
  const baseRange = getFluidRangeForTemperature(temperatureF);
  const weightFactor = getWeightFluidFactor(athleteWeightKg);

  // Apply humidity adjustment
  const humidityMultiplier = humidity > HUMIDITY_THRESHOLD ? HUMIDITY_FLUID_MULTIPLIER : 1.0;

  // Calculate adjusted range
  const adjustedMin = Math.round(baseRange.min * weightFactor * humidityMultiplier);
  const adjustedMax = Math.round(baseRange.max * weightFactor * humidityMultiplier);
  const target = Math.round((adjustedMin + adjustedMax) / 2);

  return {
    min: adjustedMin,
    max: adjustedMax,
    target,
  };
}

// ============================================================================
// SODIUM CALCULATIONS
// ============================================================================

/**
 * Calculate sodium targets per hour
 */
export function calculateSodiumTargets(
  sweatRate: SweatRate = "average",
  temperatureF: number,
  humidity: number
): { min: number; max: number; target: number } {
  const baseRange = SODIUM_RANGES[sweatRate];

  // Start with base range
  let adjustedMin = baseRange.min;
  let adjustedMax = baseRange.max;

  // Add heat adjustment
  if (temperatureF >= TEMPERATURE_RANGES.HOT.min) {
    adjustedMin += SODIUM_HEAT_ADJUSTMENT.HOT;
    adjustedMax += SODIUM_HEAT_ADJUSTMENT.HOT;
  }

  // Add humidity adjustment
  if (humidity > HUMIDITY_THRESHOLD) {
    adjustedMin += SODIUM_HEAT_ADJUSTMENT.HIGH_HUMIDITY;
    adjustedMax += SODIUM_HEAT_ADJUSTMENT.HIGH_HUMIDITY;
  }

  const target = Math.round((adjustedMin + adjustedMax) / 2);

  return {
    min: adjustedMin,
    max: adjustedMax,
    target,
  };
}

// ============================================================================
// CALORIE CALCULATIONS
// ============================================================================

/**
 * Calculate calorie target from carbohydrate target
 * Most calories during endurance events come from carbs
 */
export function calculateCalorieTarget(carbsGrams: number): number {
  // Primary calories from carbs, plus small buffer for protein/fat
  return Math.round(carbsGrams * CALORIES_PER_GRAM.CARBS * 1.1);
}

// ============================================================================
// GLUCOSE:FRUCTOSE RATIO ASSESSMENT
// ============================================================================

/**
 * Assess quality of glucose:fructose ratio
 * For high carb intake (>60g/hr), proper ratio is critical for absorption
 */
export function assessGlucoseFructoseRatio(ratio: string | null | undefined): GlucoseFructoseRatioQuality {
  if (!ratio) {
    return "unknown";
  }

  const normalizedRatio = ratio.toLowerCase().trim();

  if (GLUCOSE_FRUCTOSE_RATIOS.OPTIMAL.some(r => normalizedRatio.includes(r))) {
    return "optimal";
  }

  if (GLUCOSE_FRUCTOSE_RATIOS.ACCEPTABLE.some(r => normalizedRatio.includes(r))) {
    return "acceptable";
  }

  if (normalizedRatio.includes("glucose-only") || normalizedRatio === "glucose") {
    return "suboptimal";
  }

  return "unknown";
}

/**
 * Check if product has optimal ratio for high carb intake
 */
export function hasOptimalCarbMix(ratio: string | null | undefined): boolean {
  const quality = assessGlucoseFructoseRatio(ratio);
  return quality === "optimal" || quality === "acceptable";
}

// ============================================================================
// DURATION CATEGORY
// ============================================================================

/**
 * Get human-readable duration category
 */
export function getDurationCategory(durationHours: number): string {
  if (durationHours < 1) return "short";
  if (durationHours < 2) return "moderate";
  if (durationHours < 4) return "endurance";
  if (durationHours < 8) return "ultra";
  return "extreme ultra";
}

// ============================================================================
// WARNING & RECOMMENDATION GENERATION
// ============================================================================

/**
 * Generate warnings based on race conditions
 */
export function generateWarnings(inputs: NutritionInputs): string[] {
  const warnings: string[] = [];

  // Altitude warnings
  if (inputs.maxElevationFt >= ALTITUDE_THRESHOLDS.HIGH) {
    warnings.push(
      `High altitude (${inputs.maxElevationFt.toLocaleString()} ft) increases carbohydrate needs by 15-20%. ` +
      "Consider packing extra gels."
    );
  } else if (inputs.maxElevationFt >= ALTITUDE_THRESHOLDS.MODERATE) {
    warnings.push(
      `Moderate altitude (${inputs.maxElevationFt.toLocaleString()} ft) increases carbohydrate needs by 10-15%.`
    );
  }

  // Heat warnings
  if (inputs.temperatureF >= TEMPERATURE_RANGES.HOT.min) {
    warnings.push(
      `Hot conditions (${inputs.temperatureF}°F) significantly increase fluid and sodium needs. ` +
      "Start hydrating early and drink before you're thirsty."
    );
  }

  // Humidity warnings
  if (inputs.humidity > HUMIDITY_THRESHOLD) {
    warnings.push(
      `High humidity (${inputs.humidity}%) impairs sweat evaporation. ` +
      "Increase fluid intake and consider ice/cooling strategies."
    );
  }

  // Combined heat + humidity
  if (inputs.temperatureF >= TEMPERATURE_RANGES.WARM.min && inputs.humidity > HUMIDITY_THRESHOLD) {
    warnings.push(
      "Heat + humidity combination creates high heat stress. Monitor for heat illness symptoms."
    );
  }

  // Long duration warnings
  if (inputs.raceDurationHours >= 8) {
    warnings.push(
      "Ultra-distance event: Consider solid foods alongside gels to prevent taste fatigue. " +
      "Practice your nutrition plan in training."
    );
  }

  // Gut training warnings
  if (inputs.gutTrainingLevel === "beginner" && inputs.raceDurationHours >= 3) {
    warnings.push(
      "For races over 3 hours, gut training helps you absorb more carbs. " +
      "Practice with 80-100g/hour in training to build tolerance."
    );
  }

  return warnings;
}

/**
 * Generate positive recommendations
 */
export function generateRecommendations(
  inputs: NutritionInputs,
  hourlyTargets: HourlyTargets
): string[] {
  const recommendations: string[] = [];

  // High carb intake recommendation
  if (hourlyTargets.carbsGramsTarget >= 60) {
    recommendations.push(
      "At 60g+/hour carbs, use products with glucose + fructose (1:0.8 or 2:1 ratio) " +
      "to maximize absorption."
    );
  }

  // Sodium recommendation for heavy sweaters
  if (inputs.sweatRate === "heavy" || hourlyTargets.sodiumMgTarget >= 700) {
    recommendations.push(
      "Consider electrolyte supplements (LMNT, SaltStick, Precision Hydration) in addition to food."
    );
  }

  // Timing recommendation
  recommendations.push(
    "Set a timer to eat every 20-30 minutes rather than waiting until you feel hungry."
  );

  // Early race recommendation
  recommendations.push(
    "Front-load nutrition in the first 2-3 hours while intensity is lower and gut is fresh."
  );

  // Hydration recommendation
  if (inputs.temperatureF >= TEMPERATURE_RANGES.WARM.min) {
    recommendations.push(
      "In warm conditions, drink 500ml in the hour before the start."
    );
  }

  return recommendations;
}

// ============================================================================
// MAIN CALCULATION FUNCTION
// ============================================================================

/**
 * Calculate complete race nutrition plan based on inputs
 *
 * @param inputs - Race and athlete parameters
 * @returns Complete nutrition plan with targets, warnings, and recommendations
 */
export function calculateRaceNutritionPlan(inputs: NutritionInputs): RaceNutritionPlan {
  // Calculate individual targets
  const carbTargets = calculateCarbTargets(
    inputs.raceDurationHours,
    inputs.maxElevationFt,
    inputs.gutTrainingLevel
  );

  const fluidTargets = calculateFluidTargets(
    inputs.temperatureF,
    inputs.humidity,
    inputs.athleteWeightKg,
    inputs.knownSweatRateMlPerHour
  );

  const sodiumTargets = calculateSodiumTargets(
    inputs.sweatRate,
    inputs.temperatureF,
    inputs.humidity
  );

  const caloriesTarget = calculateCalorieTarget(carbTargets.target);

  // Compile hourly targets
  const hourlyTargets: HourlyTargets = {
    carbsGramsMin: carbTargets.min,
    carbsGramsMax: carbTargets.max,
    carbsGramsTarget: carbTargets.target,
    fluidMlMin: fluidTargets.min,
    fluidMlMax: fluidTargets.max,
    fluidMlTarget: fluidTargets.target,
    sodiumMgMin: sodiumTargets.min,
    sodiumMgMax: sodiumTargets.max,
    sodiumMgTarget: sodiumTargets.target,
    caloriesTarget,
  };

  // Calculate race totals
  const totalTargets = {
    carbs: Math.round(carbTargets.target * inputs.raceDurationHours),
    calories: Math.round(caloriesTarget * inputs.raceDurationHours),
    sodium: Math.round(sodiumTargets.target * inputs.raceDurationHours),
    fluid: Math.round(fluidTargets.target * inputs.raceDurationHours),
  };

  // Generate warnings and recommendations
  const warnings = generateWarnings(inputs);
  const recommendations = generateRecommendations(inputs, hourlyTargets);

  // Calculation factors for transparency
  const factors = {
    altitudeMultiplier: getAltitudeMultiplier(inputs.maxElevationFt),
    temperatureMultiplier: inputs.temperatureF >= TEMPERATURE_RANGES.HOT.min ? 1.3 : 1.0,
    humidityMultiplier: inputs.humidity > HUMIDITY_THRESHOLD ? HUMIDITY_FLUID_MULTIPLIER : 1.0,
    durationCategory: getDurationCategory(inputs.raceDurationHours),
  };

  return {
    hourlyTargets,
    totalTargets,
    warnings,
    recommendations,
    factors,
  };
}

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Validate hourly intake against targets
 */
export interface HourlyValidation {
  carbsStatus: "below" | "on-target" | "above";
  carbsPercent: number;
  fluidStatus: "below" | "on-target" | "above";
  fluidPercent: number;
  sodiumStatus: "below" | "on-target" | "above";
  sodiumPercent: number;
  warnings: string[];
}

/**
 * Validate actual intake against hourly targets
 */
export function validateHourlyIntake(
  actual: { carbs: number; fluid: number; sodium: number },
  targets: HourlyTargets,
  hasOptimalCarbRatio: boolean = true
): HourlyValidation {
  const warnings: string[] = [];

  // Calculate percentages
  const carbsPercent = Math.round((actual.carbs / targets.carbsGramsTarget) * 100);
  const fluidPercent = Math.round((actual.fluid / targets.fluidMlTarget) * 100);
  const sodiumPercent = Math.round((actual.sodium / targets.sodiumMgTarget) * 100);

  // Determine status
  const getStatus = (actual: number, min: number, max: number): "below" | "on-target" | "above" => {
    if (actual < min * 0.8) return "below"; // More than 20% under min
    if (actual > max * 1.2) return "above"; // More than 20% over max
    return "on-target";
  };

  const carbsStatus = getStatus(actual.carbs, targets.carbsGramsMin, targets.carbsGramsMax);
  const fluidStatus = getStatus(actual.fluid, targets.fluidMlMin, targets.fluidMlMax);
  const sodiumStatus = getStatus(actual.sodium, targets.sodiumMgMin, targets.sodiumMgMax);

  // Generate warnings
  if (carbsStatus === "below") {
    warnings.push("Carb intake below target - consider adding a gel or chews");
  }

  if (actual.carbs > 60 && !hasOptimalCarbRatio) {
    warnings.push("High carb intake without glucose:fructose mix may cause GI issues");
  }

  if (sodiumStatus === "below") {
    warnings.push("No sodium this hour - add electrolytes");
  }

  if (fluidStatus === "below") {
    warnings.push("Fluid intake below target");
  }

  return {
    carbsStatus,
    carbsPercent,
    fluidStatus,
    fluidPercent,
    sodiumStatus,
    sodiumPercent,
    warnings,
  };
}

/**
 * Check if it's late in race for caffeine
 * Caffeine late in race (after hour 8) may affect post-race sleep
 */
export function isCaffeineLate(hourNumber: number, totalHours: number): boolean {
  // Caffeine is "late" if we're in the final 4 hours or after hour 8
  return hourNumber >= 8 || hourNumber > totalHours - 4;
}
