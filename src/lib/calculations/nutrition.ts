/**
 * Calculate energy expenditure in kilojoules.
 */
export function calculateEnergyKJ(
  targetNP: number,
  raceTimeSeconds: number
): number {
  return (targetNP * raceTimeSeconds) / 1000;
}

/**
 * Calculate calories burned (roughly 1:1 ratio with kJ).
 */
export function calculateCaloriesBurned(energyKJ: number): number {
  return Math.round(energyKJ);
}

/**
 * Calculate minimum carbohydrate requirement per hour.
 * Based on 20% calorie replacement minimum.
 */
export function calculateMinCHOPerHour(caloriesPerHour: number): number {
  return Math.round((caloriesPerHour * 0.20) / 4);
}

/**
 * Calculate total nutrition requirements for a race.
 */
export function calculateRaceNutrition(
  targetNP: number,
  raceTimeHours: number,
  choPerHour = 100,
  hydrationMlPerHour = 750,
  sodiumMgPerHour = 750
): {
  totalCalories: number;
  totalCHO: number;
  totalHydration: number;
  totalSodium: number;
  minCHOPerHour: number;
} {
  const raceTimeSeconds = raceTimeHours * 3600;
  const energyKJ = calculateEnergyKJ(targetNP, raceTimeSeconds);
  const totalCalories = calculateCaloriesBurned(energyKJ);
  const caloriesPerHour = totalCalories / raceTimeHours;

  return {
    totalCalories,
    totalCHO: Math.round(choPerHour * raceTimeHours),
    totalHydration: Math.round(hydrationMlPerHour * raceTimeHours),
    totalSodium: Math.round(sodiumMgPerHour * raceTimeHours),
    minCHOPerHour: calculateMinCHOPerHour(caloriesPerHour),
  };
}
