/**
 * Pacing calculations for race planning.
 * Handles segment timing, checkpoint arrivals, and cutoff margins.
 */

import { format, addMinutes, parse, differenceInMinutes } from "date-fns";

/**
 * Calculate time to complete a segment based on distance and average speed.
 * @param distanceMiles - Distance of the segment in miles
 * @param avgSpeedMph - Average speed in miles per hour
 * @returns Time in minutes
 */
export function calculateSegmentTime(
  distanceMiles: number,
  avgSpeedMph: number
): number {
  if (avgSpeedMph <= 0) return 0;
  return (distanceMiles / avgSpeedMph) * 60;
}

/**
 * Calculate average speed needed to complete a distance in a given time.
 * @param distanceMiles - Distance in miles
 * @param timeMinutes - Time in minutes
 * @returns Speed in miles per hour
 */
export function calculateRequiredSpeed(
  distanceMiles: number,
  timeMinutes: number
): number {
  if (timeMinutes <= 0) return 0;
  return (distanceMiles / timeMinutes) * 60;
}

/**
 * Format time in minutes to HH:MM:SS string.
 */
export function formatDuration(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = Math.floor(totalMinutes % 60);
  const seconds = Math.round((totalMinutes % 1) * 60);
  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

/**
 * Parse duration string (HH:MM:SS or HH:MM) to minutes.
 */
export function parseDuration(duration: string): number {
  const parts = duration.split(":").map(Number);
  if (parts.length === 3) {
    return (parts[0] ?? 0) * 60 + (parts[1] ?? 0) + (parts[2] ?? 0) / 60;
  }
  if (parts.length === 2) {
    return (parts[0] ?? 0) * 60 + (parts[1] ?? 0);
  }
  return 0;
}

/**
 * Calculate checkpoint arrival time based on race start time and elapsed time.
 * @param startTime - Race start time (e.g., "06:00")
 * @param elapsedMinutes - Time elapsed since start in minutes
 * @returns Arrival time as string (e.g., "10:45 AM")
 */
export function calculateArrivalTime(
  startTime: string,
  elapsedMinutes: number
): string {
  const baseDate = parse(startTime, "HH:mm", new Date());
  const arrivalDate = addMinutes(baseDate, elapsedMinutes);
  return format(arrivalDate, "h:mm a");
}

/**
 * Calculate margin before a cutoff.
 * @param arrivalTime - When athlete arrives (e.g., "10:45 AM")
 * @param cutoffTime - Official cutoff time (e.g., "12:00 PM")
 * @returns Margin in minutes (positive = before cutoff, negative = after)
 */
export function calculateCutoffMargin(
  arrivalTime: string,
  cutoffTime: string
): number {
  const baseDate = new Date();
  const arrival = parse(arrivalTime, "h:mm a", baseDate);
  const cutoff = parse(cutoffTime, "h:mm a", baseDate);
  return differenceInMinutes(cutoff, arrival);
}

/**
 * Get cutoff status based on margin.
 */
export function getCutoffStatus(
  marginMinutes: number
): "safe" | "caution" | "danger" {
  if (marginMinutes >= 60) return "safe";
  if (marginMinutes >= 30) return "caution";
  return "danger";
}

/**
 * Estimate average speed based on power output and other factors.
 * This is a simplified model - real-world speed depends on many variables.
 * @param powerWatts - Average power output
 * @param weightKg - Rider + bike weight
 * @param gradePct - Average grade percentage (positive = uphill)
 * @param rollingResistance - Rolling resistance coefficient (default 0.005 for gravel)
 * @param dragCoefficient - CdA in m² (default 0.4 for drops position)
 * @returns Estimated speed in mph
 */
export function estimateSpeed(
  powerWatts: number,
  weightKg: number,
  gradePct = 0,
  rollingResistance = 0.005,
  dragCoefficient = 0.4
): number {
  // Simplified physics model
  const gravity = 9.81;
  const airDensity = 1.225;
  const gradeRadians = Math.atan(gradePct / 100);

  // Iteratively solve for velocity (power = forces * velocity)
  let velocityMps = 5; // Start with 5 m/s guess
  for (let i = 0; i < 10; i++) {
    const rollingForce = rollingResistance * weightKg * gravity * Math.cos(gradeRadians);
    const gradientForce = weightKg * gravity * Math.sin(gradeRadians);
    const dragForce = 0.5 * airDensity * dragCoefficient * velocityMps * velocityMps;
    const totalForce = rollingForce + gradientForce + dragForce;

    if (totalForce > 0) {
      velocityMps = powerWatts / totalForce;
    }
  }

  // Convert m/s to mph
  return velocityMps * 2.237;
}

export interface Segment {
  startMile: number;
  endMile: number;
  startName: string;
  endName: string;
  targetTimeMinutes: number;
  effortLevel: "safe" | "tempo" | "pushing";
  elevationGain?: number;
  elevationLoss?: number;
  avgGradient?: number;
}

export interface ElevationPoint {
  mile: number;
  elevation: number;
}

/**
 * Calculate terrain difficulty factor based on elevation gain/loss.
 * This adjusts the expected time based on climbing difficulty.
 *
 * Based on cycling physics:
 * - Climbing slows you down significantly
 * - Descending speeds you up, but less than climbing slows you (technical terrain, safety)
 * - Net elevation change affects overall pace
 *
 * @param distanceMiles - Segment distance
 * @param elevationGainFt - Elevation gained in feet
 * @param elevationLossFt - Elevation lost in feet
 * @returns Difficulty multiplier (1.0 = flat, >1 = harder/slower, <1 = easier/faster)
 */
export function calculateTerrainDifficulty(
  distanceMiles: number,
  elevationGainFt: number,
  elevationLossFt: number
): number {
  if (distanceMiles <= 0) return 1.0;

  // Convert to gradient percentages
  const distanceFt = distanceMiles * 5280;
  const avgClimbGradient = distanceFt > 0 ? (elevationGainFt / distanceFt) * 100 : 0;
  const avgDescentGradient = distanceFt > 0 ? (elevationLossFt / distanceFt) * 100 : 0;

  // Climbing penalty: exponential increase with gradient
  // Based on empirical cycling data:
  // - 5% grade: ~2x slower than flat
  // - 10% grade: ~3.5x slower than flat
  let climbPenalty = 1.0;
  if (avgClimbGradient > 0) {
    // Each 1% of average climb gradient adds ~20% to time
    climbPenalty = 1 + (avgClimbGradient * 0.20);
  }

  // Descent bonus: less than proportional (safety, technical terrain)
  // Descents are faster but capped - you don't gain as much as you lose climbing
  let descentBonus = 1.0;
  if (avgDescentGradient > 0) {
    // Each 1% of average descent gradient reduces time by ~8%
    // But cap the benefit at 30% faster
    descentBonus = Math.max(0.7, 1 - (avgDescentGradient * 0.08));
  }

  // Combine: climbing and descending portions
  const climbRatio = elevationGainFt / (elevationGainFt + elevationLossFt + 1);
  const descentRatio = elevationLossFt / (elevationGainFt + elevationLossFt + 1);

  // Weighted average of climb and descent effects
  const difficulty = (climbPenalty * climbRatio) + (descentBonus * descentRatio) +
                     (1.0 * (1 - climbRatio - descentRatio));

  return Math.max(0.7, Math.min(3.0, difficulty)); // Clamp between 0.7x and 3x
}

/**
 * Calculate segment time with terrain adjustment.
 * @param distanceMiles - Segment distance
 * @param baseSpeedMph - Base average speed on flat terrain
 * @param elevationGain - Elevation gain in feet
 * @param elevationLoss - Elevation loss in feet
 * @returns Adjusted time in minutes
 */
export function calculateTerrainAdjustedTime(
  distanceMiles: number,
  baseSpeedMph: number,
  elevationGain: number,
  elevationLoss: number
): number {
  const baseTime = calculateSegmentTime(distanceMiles, baseSpeedMph);
  const difficulty = calculateTerrainDifficulty(distanceMiles, elevationGain, elevationLoss);
  return baseTime * difficulty;
}

/**
 * Extract elevation data between mile markers from GPX points.
 * @param elevationPoints - Array of {mile, elevation} from GPX
 * @param startMile - Start mile of segment
 * @param endMile - End mile of segment
 * @returns {elevationGain, elevationLoss, avgGradient}
 */
export function extractSegmentElevation(
  elevationPoints: ElevationPoint[],
  startMile: number,
  endMile: number
): { elevationGain: number; elevationLoss: number; avgGradient: number } {
  // Filter points within the segment range
  const segmentPoints = elevationPoints.filter(
    (p) => p.mile >= startMile && p.mile <= endMile
  );

  if (segmentPoints.length < 2) {
    return { elevationGain: 0, elevationLoss: 0, avgGradient: 0 };
  }

  let gain = 0;
  let loss = 0;

  for (let i = 1; i < segmentPoints.length; i++) {
    const prev = segmentPoints[i - 1];
    const curr = segmentPoints[i];
    if (!prev || !curr) continue;

    const diff = curr.elevation - prev.elevation;
    if (diff > 0) {
      gain += diff;
    } else {
      loss += Math.abs(diff);
    }
  }

  // Calculate average gradient
  const firstPoint = segmentPoints[0];
  const lastPoint = segmentPoints[segmentPoints.length - 1];
  const netElevationChange = lastPoint && firstPoint ? lastPoint.elevation - firstPoint.elevation : 0;
  const distanceFt = (endMile - startMile) * 5280;
  const avgGradient = distanceFt > 0 ? (netElevationChange / distanceFt) * 100 : 0;

  return {
    elevationGain: Math.round(gain),
    elevationLoss: Math.round(loss),
    avgGradient: Math.round(avgGradient * 10) / 10,
  };
}

export interface CheckpointTiming {
  name: string;
  mile: number;
  elapsedMinutes: number;
  arrivalTime: string;
  cutoffTime?: string;
  cutoffMargin?: number;
  cutoffStatus?: "safe" | "caution" | "danger";
}

/**
 * Calculate checkpoint arrival times from segments.
 * @param segments - Array of race segments
 * @param startTime - Race start time (e.g., "06:00")
 * @param cutoffs - Optional map of checkpoint name to cutoff time
 * @returns Array of checkpoint timings
 */
export function calculateCheckpointArrivals(
  segments: Segment[],
  startTime: string,
  cutoffs?: Record<string, string>
): CheckpointTiming[] {
  const checkpoints: CheckpointTiming[] = [];
  let elapsedMinutes = 0;

  // Add start
  checkpoints.push({
    name: segments[0]?.startName || "Start",
    mile: segments[0]?.startMile || 0,
    elapsedMinutes: 0,
    arrivalTime: calculateArrivalTime(startTime, 0),
  });

  // Add each segment end
  for (const segment of segments) {
    elapsedMinutes += segment.targetTimeMinutes;
    const arrivalTime = calculateArrivalTime(startTime, elapsedMinutes);
    const cutoffTime = cutoffs?.[segment.endName];

    const checkpoint: CheckpointTiming = {
      name: segment.endName,
      mile: segment.endMile,
      elapsedMinutes,
      arrivalTime,
    };

    if (cutoffTime) {
      const margin = calculateCutoffMargin(arrivalTime, cutoffTime);
      checkpoint.cutoffTime = cutoffTime;
      checkpoint.cutoffMargin = margin;
      checkpoint.cutoffStatus = getCutoffStatus(margin);
    }

    checkpoints.push(checkpoint);
  }

  return checkpoints;
}

/**
 * Calculate total race time from segments.
 */
export function calculateTotalTime(segments: Segment[]): number {
  return segments.reduce((sum, seg) => sum + seg.targetTimeMinutes, 0);
}

/**
 * Generate default segments from aid stations with terrain-adjusted times.
 * @param aidStations - Array of aid station objects with name and mile
 * @param totalDistance - Total race distance in miles
 * @param goalTimeMinutes - Goal time for the race in minutes
 * @param elevationPoints - Optional array of elevation points from GPX
 * @returns Array of segments with terrain-adjusted times
 */
export function generateSegmentsFromAidStations(
  aidStations: Array<{ name: string; mile: number }>,
  totalDistance: number,
  goalTimeMinutes: number,
  elevationPoints?: ElevationPoint[]
): Segment[] {
  // Sort by mile
  const sortedStations = [...aidStations].sort((a, b) => a.mile - b.mile);

  // First pass: calculate segment distances and elevation data
  const rawSegments: Array<{
    startMile: number;
    endMile: number;
    startName: string;
    endName: string;
    distance: number;
    elevationGain: number;
    elevationLoss: number;
    avgGradient: number;
  }> = [];

  let lastMile = 0;
  let lastName = "Start";

  for (const station of sortedStations) {
    const distance = station.mile - lastMile;
    const elevation = elevationPoints
      ? extractSegmentElevation(elevationPoints, lastMile, station.mile)
      : { elevationGain: 0, elevationLoss: 0, avgGradient: 0 };

    rawSegments.push({
      startMile: lastMile,
      endMile: station.mile,
      startName: lastName,
      endName: station.name,
      distance,
      ...elevation,
    });
    lastMile = station.mile;
    lastName = station.name;
  }

  // Add final segment to finish if needed
  if (lastMile < totalDistance) {
    const elevation = elevationPoints
      ? extractSegmentElevation(elevationPoints, lastMile, totalDistance)
      : { elevationGain: 0, elevationLoss: 0, avgGradient: 0 };

    rawSegments.push({
      startMile: lastMile,
      endMile: totalDistance,
      startName: lastName,
      endName: "Finish",
      distance: totalDistance - lastMile,
      ...elevation,
    });
  }

  // Second pass: calculate terrain difficulty factors
  const difficulties = rawSegments.map((seg) =>
    calculateTerrainDifficulty(seg.distance, seg.elevationGain, seg.elevationLoss)
  );

  // Calculate weighted total for proportional time allocation
  const weightedTotal = rawSegments.reduce(
    (sum, seg, i) => sum + seg.distance * (difficulties[i] ?? 1),
    0
  );

  // Third pass: allocate time proportionally based on difficulty-weighted distance
  const segments: Segment[] = rawSegments.map((seg, i) => {
    const difficulty = difficulties[i] ?? 1;
    const weightedDistance = seg.distance * difficulty;
    const timeShare = weightedTotal > 0 ? weightedDistance / weightedTotal : 1 / rawSegments.length;
    const targetTime = goalTimeMinutes * timeShare;

    return {
      startMile: seg.startMile,
      endMile: seg.endMile,
      startName: seg.startName,
      endName: seg.endName,
      targetTimeMinutes: Math.round(targetTime),
      effortLevel: "tempo" as const,
      elevationGain: seg.elevationGain,
      elevationLoss: seg.elevationLoss,
      avgGradient: seg.avgGradient,
    };
  });

  return segments;
}
