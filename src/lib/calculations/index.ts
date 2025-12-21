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
