/**
 * Time formatting and comparison utilities
 */

/**
 * Convert 24-hour time string (HH:MM) to 12-hour AM/PM format
 */
export function formatCutoffTime(time: string): string {
  const [h, m] = time.split(":").map(Number);
  if (h === undefined || m === undefined) return time;
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${hour12}:${m.toString().padStart(2, "0")} ${period}`;
}

/**
 * Parse a time string (either 24-hour or 12-hour with AM/PM) to minutes since midnight
 */
export function parseTimeToMinutes(time: string): number {
  const [h, m] = time.replace(/\s*(AM|PM)/i, "").split(":").map(Number);
  const isPM = time.toUpperCase().includes("PM");
  const isAM = time.toUpperCase().includes("AM");
  let hours = h ?? 0;
  if (isPM && hours !== 12) hours += 12;
  if (isAM && hours === 12) hours = 0;
  return hours * 60 + (m ?? 0);
}

export type TimeStatus = "ok" | "warning" | "danger";

/**
 * Compare arrival time with cutoff time to determine status
 * @param arrivalTime - Time in 12-hour format (e.g., "10:28 AM")
 * @param cutoff - Time in 24-hour format (e.g., "10:50")
 * @returns "ok" if >30min buffer, "warning" if <30min buffer, "danger" if past cutoff
 */
export function getTimeStatus(arrivalTime: string, cutoff: string): TimeStatus {
  const arrivalMins = parseTimeToMinutes(arrivalTime);
  const cutoffMins = parseTimeToMinutes(cutoff);

  // Handle day rollover (arrival after midnight)
  // If before 6am, assume next day
  const adjustedArrival = arrivalMins < 360 ? arrivalMins + 1440 : arrivalMins;
  const adjustedCutoff = cutoffMins < 360 ? cutoffMins + 1440 : cutoffMins;

  const bufferMinutes = adjustedCutoff - adjustedArrival;

  if (bufferMinutes < 0) return "danger"; // Past cutoff
  if (bufferMinutes < 30) return "warning"; // Within 30 min of cutoff
  return "ok";
}
