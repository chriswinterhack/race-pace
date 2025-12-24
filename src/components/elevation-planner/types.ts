import type { EffortLevel, Segment, AidStation } from "@/types";

// Elevation point from GPX data
export interface ElevationPoint {
  mile: number;
  elevation: number; // in feet
  lat: number;
  lon: number;
  gradient: number; // percentage grade
}

// Planner segment extends base Segment with UI-specific properties
export interface PlannerSegment extends Segment {
  // Calculated properties for display
  distance: number; // end_mile - start_mile
  arrivalTime: string; // HH:MM format
  avgGradient: number; // average gradient over segment
}

// Aid station with planner-specific properties
export interface PlannerAidStation extends AidStation {
  arrivalTime: string;
  delayMinutes: number;
}

// Annotation toggles
export interface AnnotationToggles {
  powerTargets: boolean;
  arrivalTimes: boolean;
  aidDelays: boolean;
  gradientInfo: boolean;
}

// Effort level visual configuration
export interface EffortVisualConfig {
  fill: string;
  fillOpacity: number;
  stroke: string;
  badge: string;
  label: string;
}

// Chart theme configuration
export interface ChartTheme {
  background: string;
  backgroundGradient: string;
  gridLines: string;
  axisText: string;
  elevationFill: string;
}

// Effort colors mapping
export const EFFORT_COLORS: Record<EffortLevel, EffortVisualConfig> = {
  safe: {
    fill: "rgba(34, 197, 94, 0.35)",
    fillOpacity: 0.35,
    stroke: "#22c55e",
    badge: "bg-green-500",
    label: "Safe",
  },
  tempo: {
    fill: "rgba(56, 189, 248, 0.35)",
    fillOpacity: 0.35,
    stroke: "#38bdf8",
    badge: "bg-sky-500",
    label: "Tempo",
  },
  pushing: {
    fill: "rgba(251, 146, 60, 0.35)",
    fillOpacity: 0.35,
    stroke: "#fb923c",
    badge: "bg-orange-500",
    label: "Pushing",
  },
};

// Dark navy chart theme
export const CHART_THEME: ChartTheme = {
  background: "#0a1929",
  backgroundGradient: "linear-gradient(180deg, #102a43 0%, #0a1929 100%)",
  gridLines: "rgba(255, 255, 255, 0.05)",
  axisText: "#9fb3c8",
  elevationFill: "url(#elevationGradientDark)",
};

// Effort presets
export type EffortPreset = "conservative" | "tempo" | "aggressive";

// Preset configurations
export const EFFORT_PRESETS: Record<EffortPreset, {
  label: string;
  description: string;
  defaultEffort: EffortLevel;
  climbEffort: EffortLevel;
}> = {
  conservative: {
    label: "Conservative",
    description: "Safe effort throughout - finish strong",
    defaultEffort: "safe",
    climbEffort: "safe",
  },
  tempo: {
    label: "Tempo",
    description: "Balanced tempo - steady performance",
    defaultEffort: "tempo",
    climbEffort: "tempo",
  },
  aggressive: {
    label: "Aggressive",
    description: "Push the climbs - race hard",
    defaultEffort: "tempo",
    climbEffort: "pushing",
  },
};

// Chart coordinate scales (for pixel↔mile conversion)
export interface ChartScales {
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
  // Convert mile to pixel X
  mileToX: (mile: number) => number;
  // Convert pixel X to mile
  xToMile: (x: number) => number;
  // Convert elevation to pixel Y
  elevationToY: (elevation: number) => number;
  // Convert pixel Y to elevation
  yToElevation: (y: number) => number;
}

// Drag state for segment boundaries
export interface DragState {
  segmentId: string;
  edge: "start" | "end";
  initialMile: number;
  currentMile: number;
}

// Tooltip data
export interface TooltipData {
  mile: number;
  elevation: number;
  gradient: number;
  x: number;
  y: number;
  segment?: PlannerSegment;
}

// Intensity factors for power calculations
export const INTENSITY_FACTORS: Record<EffortLevel, number> = {
  safe: 0.67,
  tempo: 0.70,
  pushing: 0.73,
};

// Pace multipliers for time calculations (relative to tempo baseline)
// Safe = slower pace = more time, Pushing = faster pace = less time
export const PACE_MULTIPLIERS: Record<EffortLevel, number> = {
  safe: 1.05,    // 5% slower than tempo
  tempo: 1.0,    // baseline
  pushing: 0.95, // 5% faster than tempo
};

// Format time in 12-hour AM/PM format
export function formatTimeAmPm(hour24: number, minutes: number): string {
  const hour12 = hour24 % 12 || 12;
  const amPm = hour24 < 12 || hour24 === 24 ? "AM" : "PM";
  return `${hour12}:${minutes.toString().padStart(2, "0")} ${amPm}`;
}

// Convert "HH:MM" to AM/PM format
export function formatTimeStringAmPm(timeStr: string): string {
  const [hourStr, minStr] = timeStr.split(":");
  const hour = parseInt(hourStr || "0", 10);
  const min = parseInt(minStr || "0", 10);
  return formatTimeAmPm(hour, min);
}

// Calculate arrival time from start time and elapsed minutes
export function calculateArrivalTime(startTime: string, elapsedMinutes: number): string {
  const [startHour, startMin] = startTime.split(":").map(Number);
  const startTotalMins = (startHour || 6) * 60 + (startMin || 0);
  const arrivalTotalMins = startTotalMins + elapsedMinutes;
  const arrivalHour = Math.floor(arrivalTotalMins / 60) % 24;
  const arrivalMin = Math.round(arrivalTotalMins % 60);
  return formatTimeAmPm(arrivalHour, arrivalMin);
}

// Calculate power targets from FTP and effort level
export function calculatePowerTargets(ftp: number, effort: EffortLevel): { low: number; high: number } {
  const IF = INTENSITY_FACTORS[effort];
  const targetNP = ftp * IF;
  return {
    low: Math.round(targetNP * 0.95),
    high: Math.round(targetNP * 1.05),
  };
}
