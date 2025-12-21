import type { EffortLevel } from "@/types";

// Intensity factors for different effort levels
const INTENSITY_FACTORS: Record<EffortLevel, number> = {
  safe: 0.67,
  tempo: 0.70,
  pushing: 0.73,
};

// Terrain multipliers relative to race target
const TERRAIN_MULTIPLIERS = {
  climb: 1.20,
  flat: 0.90,
};

/**
 * Calculate altitude-adjusted FTP.
 * Default altitude adjustment is 20% reduction.
 */
export function calculateAltitudeAdjustedFTP(
  ftp: number,
  altitudeAdjustmentFactor = 0.20
): number {
  return ftp * (1 - altitudeAdjustmentFactor);
}

/**
 * Calculate target normalized power based on effort level.
 */
export function calculateTargetNP(
  altitudeAdjustedFTP: number,
  effortLevel: EffortLevel
): number {
  return altitudeAdjustedFTP * INTENSITY_FACTORS[effortLevel];
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
  effortLevel: EffortLevel
): { low: number; high: number } {
  const adjustedFTP = calculateAltitudeAdjustedFTP(ftp, altitudeAdjustmentFactor);
  const targetNP = calculateTargetNP(adjustedFTP, effortLevel);

  return {
    low: Math.round(calculateFlatPower(targetNP)),
    high: Math.round(calculateClimbPower(targetNP)),
  };
}
