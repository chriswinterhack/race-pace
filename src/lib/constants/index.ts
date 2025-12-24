/**
 * Application-wide constants
 * Import these instead of using magic numbers in code
 */

/**
 * Unit conversion factors
 */
export const CONVERSION = {
  KM_TO_MILES: 0.621371,
  MILES_TO_KM: 1.60934,
  METERS_TO_FEET: 3.28084,
  FEET_TO_METERS: 0.3048,
  MILES_TO_FEET: 5280,
  MPS_TO_MPH: 2.237,
  MPS_TO_KPH: 3.6,
} as const;

/**
 * Grade/gradient thresholds for terrain classification
 */
export const GRADE_THRESHOLDS = {
  /** >= 2% is considered climbing */
  CLIMBING: 2.0,
  /** -2% to 2% is considered flat */
  FLAT_MIN: -2.0,
  /** >= 8% is steep climbing */
  STEEP_CLIMB: 8.0,
  /** <= -8% is steep descent */
  STEEP_DESCENT: -8.0,
} as const;

/**
 * Time thresholds for race duration categories (in minutes)
 */
export const TIME_THRESHOLDS = {
  /** 4 hours - short race */
  SHORT_RACE_MINUTES: 240,
  /** 8 hours - long race */
  LONG_RACE_MINUTES: 480,
} as const;

/**
 * Power calculation constants
 */
export const POWER = {
  /** Intensity factors by effort level */
  INTENSITY_FACTORS: {
    safe: 0.67,
    tempo: 0.70,
    pushing: 0.73,
  },
  /** Power multipliers by terrain */
  TERRAIN_MULTIPLIERS: {
    climb: 1.20,
    flat: 0.90,
    descent: 0.40,
  },
  /** Default altitude adjustment factor */
  DEFAULT_ALTITUDE_ADJUSTMENT: 0.20,
} as const;

/**
 * Nutrition defaults
 */
export const NUTRITION = {
  /** Default carbohydrate target (grams per hour) */
  DEFAULT_CHO_PER_HOUR: 90,
  /** Default hydration target (ml per hour) */
  DEFAULT_HYDRATION_ML_PER_HOUR: 750,
  /** Default sodium target (mg per hour) */
  DEFAULT_SODIUM_MG_PER_HOUR: 500,
} as const;

/**
 * UI constants
 */
export const UI = {
  /** Maximum file size for component splitting (lines) */
  MAX_FILE_LINES: 400,
  /** Debounce delay for autosave (ms) */
  AUTOSAVE_DEBOUNCE_MS: 500,
  /** Animation duration for transitions (ms) */
  TRANSITION_DURATION_MS: 200,
} as const;
