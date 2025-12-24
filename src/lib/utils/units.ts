import type { UnitPreference } from "@/types";

// Conversion constants
const MILES_TO_KM = 1.60934;
const KM_TO_MILES = 0.621371;
const FEET_TO_METERS = 0.3048;
const METERS_TO_FEET = 3.28084;

// Distance conversions
export function milesToKm(miles: number): number {
  return miles * MILES_TO_KM;
}

export function kmToMiles(km: number): number {
  return km * KM_TO_MILES;
}

// Elevation conversions
export function feetToMeters(feet: number): number {
  return feet * FEET_TO_METERS;
}

export function metersToFeet(meters: number): number {
  return meters * METERS_TO_FEET;
}

// Format distance based on unit preference
export function formatDistance(
  miles: number,
  units: UnitPreference,
  options?: { decimals?: number; includeUnit?: boolean }
): string {
  const { decimals = 1, includeUnit = true } = options ?? {};

  if (units === "metric") {
    const km = milesToKm(miles);
    const formatted = km.toFixed(decimals);
    return includeUnit ? `${formatted} km` : formatted;
  }

  const formatted = miles.toFixed(decimals);
  return includeUnit ? `${formatted} mi` : formatted;
}

// Format elevation based on unit preference
export function formatElevation(
  feet: number,
  units: UnitPreference,
  options?: { includeUnit?: boolean; showSign?: boolean }
): string {
  const { includeUnit = true, showSign = false } = options ?? {};

  if (units === "metric") {
    const meters = feetToMeters(feet);
    const rounded = Math.round(meters);
    const sign = showSign && rounded > 0 ? "+" : "";
    return includeUnit ? `${sign}${rounded.toLocaleString()} m` : `${sign}${rounded.toLocaleString()}`;
  }

  const rounded = Math.round(feet);
  const sign = showSign && rounded > 0 ? "+" : "";
  return includeUnit ? `${sign}${rounded.toLocaleString()} ft` : `${sign}${rounded.toLocaleString()}`;
}

// Format elevation gain (always positive, with + sign)
export function formatElevationGain(
  feet: number,
  units: UnitPreference,
  options?: { includeUnit?: boolean }
): string {
  const { includeUnit = true } = options ?? {};

  if (units === "metric") {
    const meters = Math.round(feetToMeters(feet));
    return includeUnit ? `+${meters.toLocaleString()} m` : `+${meters.toLocaleString()}`;
  }

  const rounded = Math.round(feet);
  return includeUnit ? `+${rounded.toLocaleString()} ft` : `+${rounded.toLocaleString()}`;
}

// Format pace (min/mi or min/km)
export function formatPace(
  minutesPerMile: number,
  units: UnitPreference,
  options?: { includeUnit?: boolean }
): string {
  const { includeUnit = true } = options ?? {};

  let pace = minutesPerMile;
  let unit = "/mi";

  if (units === "metric") {
    // Convert min/mi to min/km
    pace = minutesPerMile / MILES_TO_KM;
    unit = "/km";
  }

  const minutes = Math.floor(pace);
  const seconds = Math.round((pace - minutes) * 60);
  const formatted = `${minutes}:${seconds.toString().padStart(2, "0")}`;

  return includeUnit ? `${formatted} ${unit}` : formatted;
}

// Format speed (mph or km/h)
export function formatSpeed(
  mph: number,
  units: UnitPreference,
  options?: { decimals?: number; includeUnit?: boolean }
): string {
  const { decimals = 1, includeUnit = true } = options ?? {};

  if (units === "metric") {
    const kmh = mph * MILES_TO_KM;
    const formatted = kmh.toFixed(decimals);
    return includeUnit ? `${formatted} km/h` : formatted;
  }

  const formatted = mph.toFixed(decimals);
  return includeUnit ? `${formatted} mph` : formatted;
}

// Get unit labels
export function getDistanceUnit(units: UnitPreference): string {
  return units === "metric" ? "km" : "mi";
}

export function getElevationUnit(units: UnitPreference): string {
  return units === "metric" ? "m" : "ft";
}

export function getSpeedUnit(units: UnitPreference): string {
  return units === "metric" ? "km/h" : "mph";
}

// Convert raw values for display
export function getDisplayDistance(miles: number, units: UnitPreference): number {
  return units === "metric" ? milesToKm(miles) : miles;
}

export function getDisplayElevation(feet: number, units: UnitPreference): number {
  return units === "metric" ? feetToMeters(feet) : feet;
}

// Format elevation per distance (ft/mi or m/km)
export function formatElevationPerDistance(
  feetPerMile: number,
  units: UnitPreference,
  options?: { includeUnit?: boolean }
): string {
  const { includeUnit = true } = options ?? {};

  if (units === "metric") {
    // Convert ft/mi to m/km
    const metersPerKm = (feetPerMile * FEET_TO_METERS) / KM_TO_MILES;
    const rounded = Math.round(metersPerKm);
    return includeUnit ? `${rounded.toLocaleString()} m/km` : rounded.toLocaleString();
  }

  const rounded = Math.round(feetPerMile);
  return includeUnit ? `${rounded.toLocaleString()} ft/mi` : rounded.toLocaleString();
}
