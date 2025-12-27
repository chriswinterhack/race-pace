import { parseLocalDate } from "./date";
import type { GearAggregation } from "@/types/race-detail";

/**
 * Format a date string for display
 */
export function formatRaceDate(dateStr: string): string {
  return parseLocalDate(dateStr).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * Format a time string (HH:MM) to human-readable format
 */
export function formatRaceTime(timeStr: string): string {
  const [hours, minutes] = timeStr.split(":").map(Number);
  const date = new Date();
  date.setHours(hours!, minutes!, 0);
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

/**
 * Combine front and rear tire data, deduplicating by brand/model/width
 */
export function combineTires(
  frontTires: GearAggregation[],
  rearTires: GearAggregation[]
): GearAggregation[] {
  const combined = new Map<string, GearAggregation>();

  [...frontTires, ...rearTires].forEach((tire) => {
    const key = `${tire.brand}|${tire.model}|${tire.width || ""}`;
    const existing = combined.get(key);
    if (existing) {
      existing.count = Math.max(existing.count, tire.count);
      existing.percentage = Math.max(existing.percentage, tire.percentage);
    } else {
      combined.set(key, { ...tire });
    }
  });

  return Array.from(combined.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
}
