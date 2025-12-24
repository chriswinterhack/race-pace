"use client";

import { cn } from "@/lib/utils";
import { TimelineHourRow } from "./TimelineHourRow";
import { useNutritionPlannerStore } from "@/stores/nutritionPlannerStore";

interface NutritionTimelineProps {
  className?: string;
}

export function NutritionTimeline({ className }: NutritionTimelineProps) {
  const hours = useNutritionPlannerStore((s) => s.hours);
  const hourlyTargets = useNutritionPlannerStore((s) => s.hourlyTargets);
  const selectedHourIndex = useNutritionPlannerStore((s) => s.selectedHourIndex);
  const selectHour = useNutritionPlannerStore((s) => s.selectHour);

  if (!hourlyTargets) {
    return (
      <div className={cn("flex items-center justify-center h-64 text-brand-navy-500", className)}>
        <div className="text-center">
          <div className="w-8 h-8 mx-auto mb-3 rounded-full border-4 border-brand-navy-200 border-t-brand-sky-500 animate-spin" />
          <p>Calculating targets...</p>
        </div>
      </div>
    );
  }

  if (hours.length === 0) {
    return (
      <div className={cn("flex items-center justify-center h-64 text-brand-navy-500", className)}>
        No hours configured. Set race duration to begin.
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Timeline header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-brand-navy-900">
            Race Timeline
          </h2>
          <p className="text-sm text-brand-navy-500">
            Drag products from the palette to each hour
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-brand-navy-600">
          <span className="px-2 py-1 rounded-md bg-brand-navy-100">
            {hours.length} hours
          </span>
        </div>
      </div>

      {/* Hour rows */}
      <div className="space-y-3">
        {hours.map((hour, index) => (
          <TimelineHourRow
            key={hour.hourNumber}
            hour={hour}
            hourIndex={index}
            hourlyTargets={hourlyTargets}
            isSelected={selectedHourIndex === index}
            onSelect={() => selectHour(selectedHourIndex === index ? null : index)}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * Aid station marker component
 */
export function AidStationMarker({
  name,
  mile,
  hasDropBags,
  hasCrewAccess,
  className,
}: {
  name: string;
  mile: number;
  hasDropBags: boolean;
  hasCrewAccess: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-xl",
        "bg-gradient-to-r from-green-50 to-emerald-50",
        "border border-green-200 shadow-sm",
        className
      )}
    >
      <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center text-xl">
        🏁
      </div>
      <div className="flex-1">
        <p className="font-semibold text-green-900">{name}</p>
        <p className="text-sm text-green-700">Mile {mile}</p>
      </div>
      <div className="flex items-center gap-2 text-sm">
        {hasDropBags && (
          <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 font-medium">
            📦 Drop Bag
          </span>
        )}
        {hasCrewAccess && (
          <span className="px-2.5 py-1 rounded-full bg-purple-100 text-purple-800 font-medium">
            👋 Crew
          </span>
        )}
      </div>
    </div>
  );
}
