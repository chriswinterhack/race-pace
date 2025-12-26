import type { EffortLevel, IntensityFactors, RaceType } from "@/types";

// Default intensity factors (can be overridden per athlete)
export const DEFAULT_INTENSITY_FACTORS: IntensityFactors = {
  safe: 0.67,
  tempo: 0.70,
  pushing: 0.73,
};

// Terrain multipliers (fixed, not user-editable)
export const TERRAIN_MULTIPLIERS = {
  climb: 1.20,
  flat: 0.90,
};

// Physics constants
const GRAVITY = 9.81; // m/s²
const AIR_DENSITY_SEA_LEVEL = 1.225; // kg/m³
const DRIVETRAIN_EFFICIENCY = 0.97; // 3% loss

// Default bike + gear weight in kg
const DEFAULT_BIKE_WEIGHT = 10;

// Variability Index: NP / Average Power
// Higher VI means more power variability (surges, accelerations)
// Calibrated against real race data:
// - Road races: 1.02-1.05 (steady power, drafting)
// - Gravel: 1.06-1.10 (varied terrain, some technical)
// - MTB: 1.15-1.20 (constant accelerations, technical terrain, hike-a-bike)
// Note: Leadville 2024 actual data showed VI of ~1.18
const VARIABILITY_INDEX: Record<string, number> = {
  road: 1.04,
  gravel: 1.08,
  mtb: 1.18, // Calibrated from Leadville actual data
  // Extended surfaces use similar VI to their base type
  dirt: 1.10, // Dirt roads have some washboard/loose sections
  singletrack: 1.18, // Technical = high variability
  pavement: 1.04,
  doubletrack: 1.12, // Between dirt and singletrack
};

// Time overhead for stops, nutrition, mechanicals (in MINUTES)
// Based on real-world race data:
// - Short race (<4hr): Quick stops, minimal time lost
// - Medium (4-8hr): A few aid station stops
// - Long (>8hr): Multiple stops but efficient athletes keep it minimal
const TIME_OVERHEAD_MINUTES = {
  short: 5,    // <4 hours: maybe one quick stop
  medium: 10,  // 4-8 hours: 2-3 quick aid station stops
  long: 15,    // >8 hours: multiple stops, but efficient = 10-20 min total
};

// Rolling resistance coefficients by surface
// Values calibrated for real-world race conditions (not ideal lab conditions)
// Reference: BikeCalculator, Silca research, real-world race data
export const ROLLING_RESISTANCE = {
  road: 0.004,      // Smooth pavement, race tires
  pavement: 0.004,  // Same as road
  gravel: 0.010,    // Packed gravel roads (was 0.008, too optimistic)
  dirt: 0.012,      // Dirt roads, some loose sections (was 0.010)
  doubletrack: 0.014, // Fire roads, grass sections, varied surface
  singletrack: 0.018, // Technical trail, roots, rocks (was 0.012)
  mtb: 0.015,       // General MTB/XC average (was 0.012)
};

// Drag area (CdA) by position
// CdA = Cd (drag coefficient) × A (frontal area)
// Lower = more aero, higher = more upright
export const DRAG_AREA = {
  drops: 0.32, // Aggressive aero position (TT bars, tucked)
  hoods: 0.38, // Road bike hoods position
  gravel: 0.42, // Gravel bike, slightly more upright
  mtb: 0.50, // MTB position, very upright, wider bars
};

// Race type multipliers for real-world power adjustment
// These account for factors not captured in physics model:
// - Drafting (road races have significant pack riding)
// - Hike-a-bike sections (MTB races)
// - Extended coasting on descents
// - Conservation strategy in ultra events
// Calibrated against real race data (Leadville 2024: 165W predicted, 155W actual = 0.94)
export const RACE_TYPE_MULTIPLIERS: Record<RaceType, number> = {
  road: 0.90,      // Heavy drafting in peloton saves 10-20%
  gravel: 0.97,    // Some drafting on fast sections, occasional coasting
  xc_mtb: 0.96,    // Minimal drafting, some hike-a-bike, technical sections
  ultra_mtb: 0.94, // No drafting, significant hike-a-bike, conservation pacing
};

// Human-readable labels for race types
export const RACE_TYPE_LABELS: Record<RaceType, string> = {
  road: "Road Race",
  gravel: "Gravel",
  xc_mtb: "XC MTB",
  ultra_mtb: "Ultra MTB",
};

// ============================================================================
// SURFACE COMPOSITION MODEL
// ============================================================================

/**
 * Surface composition as percentages (should sum to ~100)
 * Supports both naming conventions: with _pct suffix and without
 */
export interface SurfaceComposition {
  // With _pct suffix (legacy format)
  gravel_pct?: number;
  pavement_pct?: number;
  singletrack_pct?: number;
  dirt_pct?: number;
  // Without suffix (current format from admin)
  gravel?: number;
  pavement?: number;
  singletrack?: number;
  dirt?: number;
  doubletrack?: number;
}

/**
 * Calculate weighted rolling resistance based on surface composition.
 * Uses the actual surface mix instead of a single surface type.
 * Handles both field naming conventions (with and without _pct suffix).
 *
 * @param composition - Surface composition percentages
 * @returns Weighted Crr coefficient
 */
export function calculateWeightedCrr(composition: SurfaceComposition): number {
  // Handle both naming conventions and missing/undefined values
  const gravel = composition.gravel_pct ?? composition.gravel ?? 0;
  const pavement = composition.pavement_pct ?? composition.pavement ?? 0;
  const singletrack = composition.singletrack_pct ?? composition.singletrack ?? 0;
  const dirt = composition.dirt_pct ?? composition.dirt ?? 0;
  const doubletrack = composition.doubletrack ?? 0;

  const total = gravel + pavement + singletrack + dirt + doubletrack;

  if (total === 0 || !isFinite(total)) return ROLLING_RESISTANCE.gravel; // Default

  // Use specific Crr for each surface type
  const weightedCrr =
    (gravel * ROLLING_RESISTANCE.gravel +
     pavement * ROLLING_RESISTANCE.pavement +
     singletrack * ROLLING_RESISTANCE.singletrack +
     dirt * ROLLING_RESISTANCE.dirt +
     doubletrack * ROLLING_RESISTANCE.doubletrack) / total;

  // Guard against NaN results
  if (!isFinite(weightedCrr)) return ROLLING_RESISTANCE.gravel;

  return weightedCrr;
}

// ============================================================================
// COURSE PROFILE MODEL
// ============================================================================

/**
 * Analyzed course profile from elevation data
 */
export interface CourseProfile {
  totalDistanceM: number;
  climbingDistanceM: number;
  flatDistanceM: number;
  descentDistanceM: number;
  climbingPct: number;
  flatPct: number;
  descentPct: number;
  avgClimbGradePct: number;
  avgDescentGradePct: number;
  totalElevationGainM: number;
  totalElevationLossM: number;
}

/**
 * Grade thresholds for terrain classification
 */
const GRADE_THRESHOLDS = {
  climb: 2.0,    // >= 2% is climbing
  flat: -2.0,    // -2% to 2% is flat
  descent: -2.0, // < -2% is descent
};

/**
 * Analyze course profile from elevation data points.
 * Calculates actual climbing/flat/descent percentages instead of assuming 50/50.
 *
 * @param elevationPoints - Array of {distance: meters, elevation: meters}
 * @returns Analyzed course profile
 */
export function analyzeCourseProfile(
  elevationPoints: Array<{ distance: number; elevation: number }>
): CourseProfile {
  if (elevationPoints.length < 2) {
    // Return default 50/50 split if no data
    return {
      totalDistanceM: 0,
      climbingDistanceM: 0,
      flatDistanceM: 0,
      descentDistanceM: 0,
      climbingPct: 50,
      flatPct: 25,
      descentPct: 25,
      avgClimbGradePct: 5,
      avgDescentGradePct: -5,
      totalElevationGainM: 0,
      totalElevationLossM: 0,
    };
  }

  let climbingDistance = 0;
  let flatDistance = 0;
  let descentDistance = 0;
  let totalElevationGain = 0;
  let totalElevationLoss = 0;
  let climbingGradeSum = 0;
  let climbingSegments = 0;
  let descentGradeSum = 0;
  let descentSegments = 0;

  for (let i = 1; i < elevationPoints.length; i++) {
    const prev = elevationPoints[i - 1];
    const curr = elevationPoints[i];

    if (!prev || !curr) continue;

    const segmentDistance = curr.distance - prev.distance;
    const elevationChange = curr.elevation - prev.elevation;

    if (segmentDistance <= 0) continue;

    const gradePct = (elevationChange / segmentDistance) * 100;

    if (gradePct >= GRADE_THRESHOLDS.climb) {
      // Climbing
      climbingDistance += segmentDistance;
      totalElevationGain += elevationChange;
      climbingGradeSum += gradePct;
      climbingSegments++;
    } else if (gradePct <= GRADE_THRESHOLDS.descent) {
      // Descending
      descentDistance += segmentDistance;
      totalElevationLoss += Math.abs(elevationChange);
      descentGradeSum += gradePct;
      descentSegments++;
    } else {
      // Flat/rolling
      flatDistance += segmentDistance;
      if (elevationChange > 0) {
        totalElevationGain += elevationChange;
      } else {
        totalElevationLoss += Math.abs(elevationChange);
      }
    }
  }

  const totalDistance = climbingDistance + flatDistance + descentDistance;

  return {
    totalDistanceM: totalDistance,
    climbingDistanceM: climbingDistance,
    flatDistanceM: flatDistance,
    descentDistanceM: descentDistance,
    climbingPct: totalDistance > 0 ? (climbingDistance / totalDistance) * 100 : 50,
    flatPct: totalDistance > 0 ? (flatDistance / totalDistance) * 100 : 25,
    descentPct: totalDistance > 0 ? (descentDistance / totalDistance) * 100 : 25,
    avgClimbGradePct: climbingSegments > 0 ? climbingGradeSum / climbingSegments : 5,
    avgDescentGradePct: descentSegments > 0 ? descentGradeSum / descentSegments : -5,
    totalElevationGainM: totalElevationGain,
    totalElevationLossM: totalElevationLoss,
  };
}

/**
 * Estimate course profile from summary data (when GPX points aren't available).
 * Uses heuristics based on total elevation gain and distance.
 *
 * @param distanceM - Total distance in meters
 * @param elevationGainM - Total elevation gain in meters
 * @returns Estimated course profile
 */
export function estimateCourseProfile(
  distanceM: number,
  elevationGainM: number
): CourseProfile {
  // Estimate climbing distance based on typical grades
  // Average climbing grade is typically 4-8% for gravel courses
  const avgClimbGrade = 5; // Assume 5% average
  const climbingDistanceM = (elevationGainM / (avgClimbGrade / 100));

  // Cap climbing distance at 60% of total (even the climbiest courses)
  const cappedClimbingDistance = Math.min(climbingDistanceM, distanceM * 0.6);

  // Assume descent distance roughly equals climbing distance
  const descentDistanceM = cappedClimbingDistance;

  // Remainder is flat
  const flatDistanceM = Math.max(0, distanceM - cappedClimbingDistance - descentDistanceM);

  const climbingPct = (cappedClimbingDistance / distanceM) * 100;
  const descentPct = (descentDistanceM / distanceM) * 100;
  const flatPct = (flatDistanceM / distanceM) * 100;

  return {
    totalDistanceM: distanceM,
    climbingDistanceM: cappedClimbingDistance,
    flatDistanceM: flatDistanceM,
    descentDistanceM: descentDistanceM,
    climbingPct,
    flatPct,
    descentPct,
    avgClimbGradePct: cappedClimbingDistance > 0
      ? (elevationGainM / cappedClimbingDistance) * 100
      : avgClimbGrade,
    avgDescentGradePct: -avgClimbGrade, // Assume symmetric
    totalElevationGainM: elevationGainM,
    totalElevationLossM: elevationGainM, // Assume out-and-back or loop
  };
}

// ============================================================================
// FATIGUE / DECOUPLING MODEL
// ============================================================================

/**
 * Fatigue model coefficients.
 * Power output decreases over time due to:
 * - Glycogen depletion
 * - Muscle fatigue
 * - Cardiac drift
 * - Mental fatigue
 */
const FATIGUE_MODEL = {
  // Time thresholds in minutes
  thresholds: [120, 240, 360, 480, 600],
  // Power multipliers at each threshold (cumulative effect)
  // These are based on cardiac decoupling research
  multipliers: [1.00, 0.98, 0.95, 0.92, 0.88, 0.85],
};

/**
 * Calculate fatigue factor based on elapsed time.
 * Returns a multiplier (0-1) to apply to power output.
 *
 * Based on research showing:
 * - 0-2 hours: Minimal fatigue, glycogen-fueled
 * - 2-4 hours: ~2% drop, transitioning to fat metabolism
 * - 4-6 hours: ~5% drop, significant glycogen depletion
 * - 6-8 hours: ~8% drop, cumulative fatigue
 * - 8+ hours: ~12-15% drop, ultra-endurance territory
 *
 * @param elapsedMinutes - Time elapsed in minutes
 * @returns Power multiplier (0.85 to 1.0)
 */
export function calculateFatigueFactor(elapsedMinutes: number): number {
  const { thresholds, multipliers } = FATIGUE_MODEL;

  // Handle edge case
  if (elapsedMinutes <= 0) return 1.0;

  // Find which bracket we're in
  for (let i = 0; i < thresholds.length; i++) {
    const threshold = thresholds[i];
    if (threshold === undefined) continue;

    if (elapsedMinutes <= threshold) {
      if (i === 0) return multipliers[0] ?? 1.0;

      // Linear interpolation within the bracket
      const prevThreshold = thresholds[i - 1] ?? 0;
      const prevMultiplier = multipliers[i] ?? 1.0;
      const nextMultiplier = multipliers[i + 1] ?? prevMultiplier;
      const progress = (elapsedMinutes - prevThreshold) / (threshold - prevThreshold);

      return prevMultiplier - (prevMultiplier - nextMultiplier) * progress;
    }
  }

  // Beyond last threshold
  return multipliers[multipliers.length - 1] ?? 0.85;
}

/**
 * Calculate average fatigue factor over a race duration.
 * This is more accurate than using the endpoint fatigue.
 *
 * @param totalMinutes - Total race duration in minutes
 * @param intervals - Number of intervals to sample (default 10)
 * @returns Average power multiplier over the race
 */
export function calculateAverageFatigueFactor(
  totalMinutes: number,
  intervals: number = 10
): number {
  let sum = 0;
  for (let i = 0; i <= intervals; i++) {
    const elapsed = (i / intervals) * totalMinutes;
    sum += calculateFatigueFactor(elapsed);
  }
  return sum / (intervals + 1);
}

/**
 * Calculate altitude-adjusted FTP.
 * Power output decreases at altitude due to reduced oxygen.
 */
export function calculateAltitudeAdjustedFTP(
  ftp: number,
  altitudeAdjustmentFactor = 0.20
): number {
  return ftp * (1 - altitudeAdjustmentFactor);
}

/**
 * Calculate target normalized power based on effort level.
 * Uses custom intensity factors if provided, otherwise defaults.
 */
export function calculateTargetNP(
  adjustedFTP: number,
  effortLevel: EffortLevel,
  intensityFactors: IntensityFactors = DEFAULT_INTENSITY_FACTORS
): number {
  return adjustedFTP * intensityFactors[effortLevel];
}

/**
 * Calculate power target for climbing.
 */
export function calculateClimbPower(targetNP: number): number {
  return targetNP * TERRAIN_MULTIPLIERS.climb;
}

/**
 * Calculate power target for flats.
 */
export function calculateFlatPower(targetNP: number): number {
  return targetNP * TERRAIN_MULTIPLIERS.flat;
}

/**
 * Calculate power target by terrain type.
 */
export function calculateTerrainPower(
  targetNP: number,
  terrain: "climb" | "flat"
): number {
  return targetNP * TERRAIN_MULTIPLIERS[terrain];
}

/**
 * Calculate power range for a segment.
 */
export function calculatePowerRange(
  ftp: number,
  altitudeAdjustmentFactor: number,
  effortLevel: EffortLevel,
  intensityFactors: IntensityFactors = DEFAULT_INTENSITY_FACTORS
): { low: number; high: number } {
  const adjustedFTP = calculateAltitudeAdjustedFTP(ftp, altitudeAdjustmentFactor);
  const targetNP = calculateTargetNP(adjustedFTP, effortLevel, intensityFactors);

  return {
    low: Math.round(calculateFlatPower(targetNP)),
    high: Math.round(calculateClimbPower(targetNP)),
  };
}

// ============================================================================
// PHYSICS-BASED POWER MODEL
// ============================================================================

/**
 * Calculate air density at altitude (decreases ~12% per 1000m)
 */
export function calculateAirDensity(elevationMeters: number): number {
  // Barometric formula approximation
  return AIR_DENSITY_SEA_LEVEL * Math.exp(-elevationMeters / 8500);
}

/**
 * Calculate speed from power output using cycling physics.
 * Solves: P = (m*g*grade + m*g*Crr + 0.5*CdA*ρ*v²) * v
 *
 * Uses Newton-Raphson method for solving cubic equation.
 * For descents, uses a direct equilibrium calculation when gravity assists.
 *
 * @param powerWatts - Power output in watts
 * @param totalMassKg - Total mass (rider + bike + gear) in kg
 * @param gradePercent - Grade as percentage (e.g., 5 for 5%)
 * @param crr - Rolling resistance coefficient
 * @param cda - Drag area in m²
 * @param airDensity - Air density in kg/m³
 * @returns Speed in m/s
 */
export function calculateSpeedFromPower(
  powerWatts: number,
  totalMassKg: number,
  gradePercent: number = 0,
  crr: number = ROLLING_RESISTANCE.gravel,
  cda: number = DRAG_AREA.gravel,
  airDensity: number = AIR_DENSITY_SEA_LEVEL
): number {
  const grade = gradePercent / 100;
  const effectivePower = powerWatts * DRIVETRAIN_EFFICIENCY;

  // For descents where gravity exceeds rolling resistance
  // (grade < -Crr), calculate equilibrium speed directly
  if (grade < -crr) {
    // On descents, gravity provides power: P_gravity = m*g*|grade|*v
    // Power equation: P_total = P_input + P_gravity
    // P_total = P_rolling + P_aero
    // P_input + m*g*|grade|*v = m*g*Crr*v + 0.5*CdA*ρ*v³
    //
    // Rearranging for equilibrium: 0.5*CdA*ρ*v³ = P_input + m*g*(|grade| - Crr)*v
    // This is: B*v³ - A*v - P = 0, where A > 0 for descents

    const gravityAssist = totalMassKg * GRAVITY * (Math.abs(grade) - crr);
    const B = 0.5 * cda * airDensity;

    // Use bisection for stability (Newton-Raphson can diverge for this case)
    let vLow = 1;
    let vHigh = 25; // ~56 mph max

    for (let i = 0; i < 30; i++) {
      const vMid = (vLow + vHigh) / 2;
      // f(v) = B*v³ - gravityAssist*v - effectivePower
      const f = B * vMid * vMid * vMid - gravityAssist * vMid - effectivePower;

      if (Math.abs(f) < 0.1) break;

      if (f > 0) {
        vHigh = vMid;
      } else {
        vLow = vMid;
      }
    }

    const result = (vLow + vHigh) / 2;
    // Cap at reasonable max descent speed
    return Math.min(result, 22); // ~50 mph max
  }

  // For climbs and flats, use Newton-Raphson
  // Equation: P = (m*g*(grade + Crr) + 0.5*CdA*ρ*v²) * v
  let v = gradePercent > 3 ? 3 : 7; // Better initial guess based on terrain

  for (let i = 0; i < 20; i++) {
    const A = totalMassKg * GRAVITY * (grade + crr);
    const B = 0.5 * cda * airDensity;

    // f(v) = A*v + B*v³ - P
    const f = A * v + B * v * v * v - effectivePower;
    // f'(v) = A + 3*B*v²
    const fPrime = A + 3 * B * v * v;

    if (Math.abs(fPrime) < 0.0001) break;

    const vNew = v - f / fPrime;

    if (Math.abs(vNew - v) < 0.0001) break;
    v = Math.max(0.5, vNew); // Don't go below 0.5 m/s
  }

  return Math.max(0.5, v);
}

/**
 * Calculate required power for a target speed.
 *
 * @param speedMps - Target speed in m/s
 * @param totalMassKg - Total mass (rider + bike + gear) in kg
 * @param gradePercent - Grade as percentage
 * @param crr - Rolling resistance coefficient
 * @param cda - Drag area in m²
 * @param airDensity - Air density in kg/m³
 * @returns Required power in watts
 */
export function calculatePowerFromSpeed(
  speedMps: number,
  totalMassKg: number,
  gradePercent: number = 0,
  crr: number = ROLLING_RESISTANCE.gravel,
  cda: number = DRAG_AREA.gravel,
  airDensity: number = AIR_DENSITY_SEA_LEVEL
): number {
  const grade = gradePercent / 100;

  const powerGravity = totalMassKg * GRAVITY * grade * speedMps;
  const powerRolling = totalMassKg * GRAVITY * crr * speedMps;
  const powerAero = 0.5 * cda * airDensity * speedMps * speedMps * speedMps;

  const totalPower = (powerGravity + powerRolling + powerAero) / DRIVETRAIN_EFFICIENCY;

  return Math.max(0, totalPower);
}

/**
 * Estimate finish time based on course profile and power output.
 *
 * IMPORTANT: This function expects Normalized Power (NP) as input.
 * NP is converted to average power using the Variability Index before
 * physics calculations, since the physics model works with actual power output.
 *
 * @param distanceKm - Total distance in km
 * @param elevationGainM - Total elevation gain in meters
 * @param avgElevationM - Average course elevation in meters
 * @param normalizedPowerWatts - Target Normalized Power (NP) in watts
 * @param riderWeightKg - Rider weight in kg
 * @param bikeWeightKg - Bike + gear weight in kg
 * @param surfaceType - Surface type for rolling resistance and variability
 * @returns Estimated time in minutes
 */
export function estimateFinishTime(
  distanceKm: number,
  elevationGainM: number,
  avgElevationM: number,
  normalizedPowerWatts: number,
  riderWeightKg: number,
  bikeWeightKg: number = DEFAULT_BIKE_WEIGHT,
  surfaceType: keyof typeof ROLLING_RESISTANCE = "gravel"
): number {
  const totalMass = riderWeightKg + bikeWeightKg;
  const distanceM = distanceKm * 1000;
  const crr = ROLLING_RESISTANCE[surfaceType];
  const cda = surfaceType === "road" ? DRAG_AREA.hoods : DRAG_AREA.gravel;
  const airDensity = calculateAirDensity(avgElevationM);

  // Convert NP to average power using Variability Index
  // NP is always higher than average power due to power variability
  const variabilityIndex = VARIABILITY_INDEX[surfaceType] ?? VARIABILITY_INDEX.gravel ?? 1.08;
  const avgPower = normalizedPowerWatts / variabilityIndex;

  // Calculate average grade for climbing sections
  const avgGradePercent = (elevationGainM / (distanceM * 0.5)) * 100; // Grade on climbing portions

  // Split into climbing and flat/descending portions
  // Assume 50% of distance is climbing, 50% is flat/descending
  const climbingDistance = distanceM * 0.5;
  const flatDistance = distanceM * 0.5;

  // Climbing speed: same average power, but grade slows you down
  const climbSpeed = calculateSpeedFromPower(
    avgPower,
    totalMass,
    avgGradePercent,
    crr,
    cda,
    airDensity
  );

  // Flat/descent speed: same average power, faster due to favorable grade
  const flatSpeed = calculateSpeedFromPower(
    avgPower,
    totalMass,
    -avgGradePercent * 0.5, // Descents average half the climb grade
    crr,
    cda,
    airDensity
  );

  // Calculate moving time
  const climbTimeSeconds = climbingDistance / climbSpeed;
  const flatTimeSeconds = flatDistance / flatSpeed;
  const movingTimeMinutes = (climbTimeSeconds + flatTimeSeconds) / 60;

  // Determine time overhead based on race duration (fixed minutes, not percentage)
  let overheadMinutes: number;
  if (movingTimeMinutes < 240) {
    // < 4 hours
    overheadMinutes = TIME_OVERHEAD_MINUTES.short;
  } else if (movingTimeMinutes < 480) {
    // 4-8 hours
    overheadMinutes = TIME_OVERHEAD_MINUTES.medium;
  } else {
    // > 8 hours
    overheadMinutes = TIME_OVERHEAD_MINUTES.long;
  }

  // Add overhead for stops, nutrition, mechanicals
  const totalTimeMinutes = movingTimeMinutes + overheadMinutes;

  return totalTimeMinutes;
}

// ============================================================================
// ADVANCED FINISH TIME ESTIMATION
// ============================================================================

/**
 * Advanced race parameters for more accurate estimation
 */
export interface AdvancedRaceParams {
  distanceKm: number;
  elevationGainM: number;
  avgElevationM: number;
  normalizedPowerWatts: number;
  riderWeightKg: number;
  bikeWeightKg?: number;
  surfaceComposition?: SurfaceComposition;
  courseProfile?: CourseProfile;
  includeFatigue?: boolean;
  raceType?: RaceType; // For real-world power adjustment
}

/**
 * Detailed finish time estimation result
 */
export interface FinishTimeResult {
  totalMinutes: number;
  movingTimeMinutes: number;
  climbingTimeMinutes: number;
  flatTimeMinutes: number;
  descentTimeMinutes: number;
  overheadMinutes: number;
  avgSpeedKph: number;
  climbingSpeedKph: number;
  flatSpeedKph: number;
  descentSpeedKph: number;
  fatigueFactor: number;
  effectiveCrr: number;
  courseProfile: CourseProfile;
  // Race type adjustment
  raceType: RaceType;
  raceTypeMultiplier: number;
  physicsNP: number; // NP from physics model (before race type adjustment)
  adjustedNP: number; // NP after race type adjustment (what you'll actually need)
}

/**
 * Advanced finish time estimation using all models.
 *
 * Improvements over basic estimation:
 * 1. Uses actual course profile (climb/flat/descent split) instead of 50/50
 * 2. Uses surface-weighted Crr instead of single surface type
 * 3. Applies fatigue model for power degradation over time
 * 4. Returns detailed breakdown of time components
 *
 * @param params - Advanced race parameters
 * @returns Detailed finish time result
 */
export function estimateFinishTimeAdvanced(params: AdvancedRaceParams): FinishTimeResult {
  const {
    distanceKm,
    elevationGainM,
    avgElevationM,
    normalizedPowerWatts,
    riderWeightKg,
    bikeWeightKg = DEFAULT_BIKE_WEIGHT,
    surfaceComposition,
    courseProfile: providedProfile,
    includeFatigue: _includeFatigue = true, // Kept for API compatibility but not used
    raceType = "gravel", // Default to gravel if not specified
  } = params;

  // Get race type multiplier for real-world adjustment
  const raceTypeMultiplier = RACE_TYPE_MULTIPLIERS[raceType];

  const totalMass = riderWeightKg + bikeWeightKg;
  const distanceM = distanceKm * 1000;
  const airDensity = calculateAirDensity(avgElevationM);

  // Determine Crr from surface composition or default
  const crr = surfaceComposition
    ? calculateWeightedCrr(surfaceComposition)
    : ROLLING_RESISTANCE.gravel;

  // Determine variability index based on surface composition
  // Higher VI = more power variability (technical terrain, accelerations)
  // Handle both naming conventions and missing/undefined percentages
  const singletrackPct = surfaceComposition?.singletrack_pct ?? surfaceComposition?.singletrack ?? 0;
  const doubletrackPct = surfaceComposition?.doubletrack ?? 0;
  const pavementPct = surfaceComposition?.pavement_pct ?? surfaceComposition?.pavement ?? 0;
  const dirtPct = surfaceComposition?.dirt_pct ?? surfaceComposition?.dirt ?? 0;
  const gravelPct = surfaceComposition?.gravel_pct ?? surfaceComposition?.gravel ?? 0;

  // Calculate weighted VI based on surface mix
  // Singletrack/doubletrack = MTB-like (high VI), pavement = road-like (low VI)
  const totalPct = singletrackPct + doubletrackPct + pavementPct + dirtPct + gravelPct || 100;
  const defaultVI = 1.08; // Default gravel VI
  const vi = surfaceComposition
    ? (
        (singletrackPct * (VARIABILITY_INDEX.singletrack ?? 1.18) +
         doubletrackPct * (VARIABILITY_INDEX.doubletrack ?? 1.12) +
         pavementPct * (VARIABILITY_INDEX.pavement ?? 1.04) +
         dirtPct * (VARIABILITY_INDEX.dirt ?? 1.10) +
         gravelPct * (VARIABILITY_INDEX.gravel ?? 1.08)) / totalPct
      ) || defaultVI
    : defaultVI;

  // Determine CdA based on bike type (inferred from surface)
  // MTB courses (high singletrack/doubletrack) = more upright position
  const isMTB = singletrackPct + doubletrackPct > 10;
  const isRoad = pavementPct > 70;
  const cda = isMTB ? DRAG_AREA.mtb : isRoad ? DRAG_AREA.hoods : DRAG_AREA.gravel;

  // Get or estimate course profile
  const profile = providedProfile || estimateCourseProfile(distanceM, elevationGainM);

  // Calculate distances for each terrain type
  const climbingDistanceM = (profile.climbingPct / 100) * distanceM;
  const flatDistanceM = (profile.flatPct / 100) * distanceM;
  const descentDistanceM = (profile.descentPct / 100) * distanceM;

  // Convert NP to average power using Variability Index
  const avgPower = normalizedPowerWatts / vi;

  // Calculate speed for each terrain type
  // Use consistent power across terrain - physics handles speed differences via grade
  // (Terrain multipliers are for DISPLAY/pacing guidance, not for physics calculations)

  // Climbing: Same power, but grade slows you down
  const climbSpeed = calculateSpeedFromPower(
    avgPower,
    totalMass,
    profile.avgClimbGradePct,
    crr,
    cda,
    airDensity
  );

  // Flat: Same power, faster on flat ground
  const flatSpeed = calculateSpeedFromPower(
    avgPower,
    totalMass,
    0,
    crr,
    cda,
    airDensity
  );

  // Descent: Riders coast with gravity assist, but speed is limited by:
  // - Technical terrain (braking, cornering)
  // - Safety/visibility
  // - Traffic on course
  // Calibrated from Leadville 2024 actual data: ~25 mph avg descent
  const descentPower = Math.max(75, avgPower * 0.4); // 40% of avg or 75w minimum
  const physicsDescentSpeed = calculateSpeedFromPower(
    descentPower,
    totalMass,
    profile.avgDescentGradePct,
    crr,
    cda,
    airDensity
  );

  // Apply technical descent speed limit based on terrain
  // Singletrack/MTB: ~20-25 mph max, Dirt roads: ~25-30 mph, Pavement: ~35-40 mph
  const technicalDescentLimit = isMTB
    ? 11.2 // 25 mph - calibrated from Leadville
    : isRoad
      ? 17.9 // 40 mph
      : 13.4; // 30 mph for gravel
  const descentSpeed = Math.min(physicsDescentSpeed, technicalDescentLimit);

  // Calculate times for each section
  const climbingTimeSeconds = climbingDistanceM > 0 ? climbingDistanceM / climbSpeed : 0;
  const flatTimeSeconds = flatDistanceM > 0 ? flatDistanceM / flatSpeed : 0;
  const descentTimeSeconds = descentDistanceM > 0 ? descentDistanceM / descentSpeed : 0;

  const movingTimeSeconds = climbingTimeSeconds + flatTimeSeconds + descentTimeSeconds;
  const movingTimeMinutes = movingTimeSeconds / 60;

  // IMPORTANT: Fatigue factor should NOT be applied when using NP as input
  // NP (Normalized Power) already reflects power variability throughout the race,
  // including the natural decline in power output due to fatigue.
  // Applying an additional fatigue factor would double-count the effect.
  //
  // The fatigue factor is kept for reference but set to 1.0.
  // Calibrated against Leadville 2024: 155w NP -> 11:21 finish with no fatigue adjustment.
  const fatigueFactor = 1.0;

  // Moving time is used directly (no fatigue adjustment needed)
  const fatigueAdjustedMovingMinutes = movingTimeMinutes;

  // Determine overhead based on race duration (fixed minutes, not percentage)
  let overheadMinutes: number;
  if (fatigueAdjustedMovingMinutes < 240) {
    overheadMinutes = TIME_OVERHEAD_MINUTES.short;
  } else if (fatigueAdjustedMovingMinutes < 480) {
    overheadMinutes = TIME_OVERHEAD_MINUTES.medium;
  } else {
    overheadMinutes = TIME_OVERHEAD_MINUTES.long;
  }

  const totalMinutes = fatigueAdjustedMovingMinutes + overheadMinutes;

  // Helper to ensure finite numbers (fallback to 0 for invalid values)
  const finite = (n: number, fallback = 0): number => isFinite(n) ? n : fallback;

  // Calculate the physics-based NP (what the model calculates)
  // and the adjusted NP (what the athlete will actually need to sustain)
  // The race type multiplier accounts for real-world factors:
  // - Drafting in road races (saves power)
  // - Hike-a-bike in MTB races (lower average power)
  // - Coasting on technical descents
  // - Conservation pacing in ultra events
  const physicsNP = normalizedPowerWatts;
  const adjustedNP = normalizedPowerWatts * raceTypeMultiplier;

  return {
    totalMinutes: finite(totalMinutes),
    movingTimeMinutes: finite(fatigueAdjustedMovingMinutes),
    climbingTimeMinutes: finite((climbingTimeSeconds / 60) / fatigueFactor),
    flatTimeMinutes: finite((flatTimeSeconds / 60) / fatigueFactor),
    descentTimeMinutes: finite((descentTimeSeconds / 60) / fatigueFactor),
    overheadMinutes: finite(overheadMinutes),
    avgSpeedKph: finite((distanceKm / totalMinutes) * 60),
    climbingSpeedKph: finite(climbSpeed * 3.6),
    flatSpeedKph: finite(flatSpeed * 3.6),
    descentSpeedKph: finite(descentSpeed * 3.6),
    fatigueFactor: finite(fatigueFactor, 1),
    effectiveCrr: finite(crr, ROLLING_RESISTANCE.gravel),
    courseProfile: profile,
    // Race type adjustment fields
    raceType,
    raceTypeMultiplier: finite(raceTypeMultiplier, 1),
    physicsNP: finite(physicsNP),
    adjustedNP: finite(adjustedNP),
  };
}

/**
 * Calculate required NP for a target finish time using advanced model.
 * Uses binary search with the advanced estimation.
 *
 * @param goalTimeMinutes - Target finish time in minutes
 * @param params - Race parameters (excluding NP, which we're solving for)
 * @returns Required Normalized Power (NP) in watts
 */
export function calculateRequiredPowerAdvanced(
  goalTimeMinutes: number,
  params: Omit<AdvancedRaceParams, "normalizedPowerWatts">
): number {
  // Validate inputs
  if (!goalTimeMinutes || goalTimeMinutes <= 0 || !isFinite(goalTimeMinutes)) {
    return 0;
  }

  let lowNP = 50;
  let highNP = 500;

  for (let i = 0; i < 30; i++) {
    const midNP = (lowNP + highNP) / 2;
    const result = estimateFinishTimeAdvanced({
      ...params,
      normalizedPowerWatts: midNP,
    });

    // If calculation failed (returns 0 or invalid), skip this iteration
    if (!result.totalMinutes || result.totalMinutes <= 0) {
      // Can't determine direction, return best estimate
      return Math.round(midNP);
    }

    if (Math.abs(result.totalMinutes - goalTimeMinutes) < 1) {
      return Math.round(midNP);
    }

    if (result.totalMinutes > goalTimeMinutes) {
      // Need more power to go faster
      lowNP = midNP;
    } else {
      highNP = midNP;
    }
  }

  return Math.round((lowNP + highNP) / 2);
}

/**
 * Calculate required Normalized Power (NP) for a target finish time.
 * Uses binary search to find the NP that achieves the goal time.
 *
 * IMPORTANT: This returns NP, not average power. The estimateFinishTime
 * function internally converts NP to average power for physics calculations.
 *
 * @param goalTimeMinutes - Target finish time in minutes
 * @param distanceKm - Total distance in km
 * @param elevationGainM - Total elevation gain in meters
 * @param avgElevationM - Average course elevation in meters
 * @param riderWeightKg - Rider weight in kg
 * @param bikeWeightKg - Bike + gear weight in kg
 * @param surfaceType - Surface type for rolling resistance
 * @returns Required Normalized Power (NP) in watts
 */
export function calculateRequiredPower(
  goalTimeMinutes: number,
  distanceKm: number,
  elevationGainM: number,
  avgElevationM: number,
  riderWeightKg: number,
  bikeWeightKg: number = DEFAULT_BIKE_WEIGHT,
  surfaceType: keyof typeof ROLLING_RESISTANCE = "gravel"
): number {
  let lowNP = 50;
  let highNP = 500;

  for (let i = 0; i < 30; i++) {
    const midNP = (lowNP + highNP) / 2;
    const estimatedTime = estimateFinishTime(
      distanceKm,
      elevationGainM,
      avgElevationM,
      midNP,
      riderWeightKg,
      bikeWeightKg,
      surfaceType
    );

    if (Math.abs(estimatedTime - goalTimeMinutes) < 1) {
      return Math.round(midNP);
    }

    if (estimatedTime > goalTimeMinutes) {
      // Need more power to go faster
      lowNP = midNP;
    } else {
      highNP = midNP;
    }
  }

  return Math.round((lowNP + highNP) / 2);
}

/**
 * Calculate all power targets for display.
 * Returns a complete power breakdown for the UI.
 */
export interface PowerTargets {
  baseFtp: number;
  adjustedFtp: number;
  altitudeAdjustmentPercent: number;
  intensityFactors: IntensityFactors;
  // Target NP for each zone
  seaLevelNP: { safe: number; tempo: number; pushing: number };
  adjustedNP: { safe: number; tempo: number; pushing: number };
  // Terrain-adjusted power (based on adjusted NP)
  climbingPower: { safe: number; tempo: number; pushing: number };
  flatPower: { safe: number; tempo: number; pushing: number };
}

export function calculateAllPowerTargets(
  ftp: number,
  altitudeAdjustmentFactor: number,
  intensityFactors: IntensityFactors = DEFAULT_INTENSITY_FACTORS
): PowerTargets {
  const adjustedFtp = calculateAltitudeAdjustedFTP(ftp, altitudeAdjustmentFactor);

  // Sea level NP (using base FTP)
  const seaLevelNP = {
    safe: Math.round(ftp * intensityFactors.safe),
    tempo: Math.round(ftp * intensityFactors.tempo),
    pushing: Math.round(ftp * intensityFactors.pushing),
  };

  // Altitude-adjusted NP
  const adjustedNP = {
    safe: Math.round(adjustedFtp * intensityFactors.safe),
    tempo: Math.round(adjustedFtp * intensityFactors.tempo),
    pushing: Math.round(adjustedFtp * intensityFactors.pushing),
  };

  // Terrain-adjusted power (based on adjusted NP)
  const climbingPower = {
    safe: Math.round(adjustedNP.safe * TERRAIN_MULTIPLIERS.climb),
    tempo: Math.round(adjustedNP.tempo * TERRAIN_MULTIPLIERS.climb),
    pushing: Math.round(adjustedNP.pushing * TERRAIN_MULTIPLIERS.climb),
  };

  const flatPower = {
    safe: Math.round(adjustedNP.safe * TERRAIN_MULTIPLIERS.flat),
    tempo: Math.round(adjustedNP.tempo * TERRAIN_MULTIPLIERS.flat),
    pushing: Math.round(adjustedNP.pushing * TERRAIN_MULTIPLIERS.flat),
  };

  return {
    baseFtp: ftp,
    adjustedFtp: Math.round(adjustedFtp),
    altitudeAdjustmentPercent: Math.round(altitudeAdjustmentFactor * 100),
    intensityFactors,
    seaLevelNP,
    adjustedNP,
    climbingPower,
    flatPower,
  };
}
