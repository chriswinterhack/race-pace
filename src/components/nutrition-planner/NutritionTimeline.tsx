"use client";

import { Plus, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { TimelineHourRow } from "./TimelineHourRow";
import { CategoryIcon } from "./CategoryIcon";
import { useNutritionPlannerStore } from "@/stores/nutritionPlannerStore";
import { CATEGORY_CONFIG } from "./types";

interface NutritionTimelineProps {
  className?: string;
  variant?: "desktop" | "mobile";
  onHourSelect?: (index: number) => void;
}

export function NutritionTimeline({
  className,
  variant = "desktop",
  onHourSelect,
}: NutritionTimelineProps) {
  const hours = useNutritionPlannerStore((s) => s.hours);
  const hourlyTargets = useNutritionPlannerStore((s) => s.hourlyTargets);
  const selectedHourIndex = useNutritionPlannerStore((s) => s.selectedHourIndex);
  const selectHour = useNutritionPlannerStore((s) => s.selectHour);

  if (!hourlyTargets) {
    return (
      <div className={cn("flex items-center justify-center h-64", className)}>
        <div className="text-center">
          <div className={cn(
            "w-8 h-8 mx-auto mb-3 rounded-full border-4 animate-spin",
            variant === "mobile"
              ? "border-brand-navy-700 border-t-brand-sky-400"
              : "border-brand-navy-200 border-t-brand-sky-500"
          )} />
          <p className={variant === "mobile" ? "text-brand-navy-400" : "text-brand-navy-500"}>
            Calculating targets...
          </p>
        </div>
      </div>
    );
  }

  if (hours.length === 0) {
    return (
      <div className={cn(
        "flex items-center justify-center h-64",
        variant === "mobile" ? "text-brand-navy-400" : "text-brand-navy-500",
        className
      )}>
        No hours configured. Set race duration to begin.
      </div>
    );
  }

  // Mobile variant
  if (variant === "mobile") {
    return (
      <div className={cn("space-y-3", className)}>
        {/* Timeline header */}
        <div className="flex items-center justify-between px-1">
          <div>
            <h2 className="text-lg font-semibold text-white">
              Race Timeline
            </h2>
            <p className="text-sm text-brand-navy-400">
              Tap an hour to add products
            </p>
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-brand-navy-800 text-brand-navy-300 text-sm font-medium">
            {hours.length}h
          </div>
        </div>

        {/* Hour cards - Mobile optimized */}
        <div className="space-y-2">
          {hours.map((hour, index) => (
            <MobileHourCard
              key={hour.hourNumber}
              hour={hour}
              hourlyTargets={hourlyTargets}
              isSelected={selectedHourIndex === index}
              onSelect={() => {
                selectHour(index);
                onHourSelect?.(index);
              }}
            />
          ))}
        </div>
      </div>
    );
  }

  // Desktop variant (original)
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

// Mobile Hour Card - compact and touch-friendly
function MobileHourCard({
  hour,
  hourlyTargets,
  isSelected,
  onSelect,
}: {
  hour: any;
  hourlyTargets: any;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const hasProducts = hour.products.length > 0 || hour.waterMl > 0;
  const carbsPercent = Math.round((hour.totals.carbs / hourlyTargets.carbsGramsTarget) * 100);
  const fluidPercent = Math.round((hour.totals.fluid / hourlyTargets.fluidMlTarget) * 100);

  const getStatusColor = (percent: number) => {
    if (percent >= 80 && percent <= 120) return "bg-green-500";
    if (percent >= 50) return "bg-amber-500";
    return "bg-red-500";
  };

  return (
    <button
      onClick={onSelect}
      className={cn(
        "w-full text-left p-3 rounded-xl transition-all duration-200",
        "active:scale-[0.98]",
        isSelected
          ? "bg-brand-sky-500/20 border-2 border-brand-sky-500"
          : hasProducts
            ? "bg-brand-navy-900/80 border border-brand-navy-700"
            : "bg-brand-navy-900/40 border border-brand-navy-800 border-dashed"
      )}
    >
      <div className="flex items-center gap-3">
        {/* Hour number */}
        <div className={cn(
          "w-12 h-12 rounded-xl flex flex-col items-center justify-center font-bold",
          isSelected
            ? "bg-brand-sky-500 text-white"
            : hasProducts
              ? "bg-brand-navy-800 text-white"
              : "bg-brand-navy-800/50 text-brand-navy-500"
        )}>
          <span className="text-lg leading-none">{hour.hourNumber}</span>
          <span className="text-[10px] font-normal opacity-70">
            {hour.startTime.split(" ")[0]}
          </span>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {hasProducts ? (
            <>
              {/* Product icons row */}
              <div className="flex items-center gap-1 mb-1.5">
                {hour.products.slice(0, 4).map((item: any, idx: number) => (
                  <div
                    key={idx}
                    className={cn(
                      "w-7 h-7 rounded-lg flex items-center justify-center",
                      CATEGORY_CONFIG[item.product.category as keyof typeof CATEGORY_CONFIG].color
                    )}
                  >
                    <CategoryIcon category={item.product.category} size="sm" />
                  </div>
                ))}
                {hour.products.length > 4 && (
                  <span className="text-xs text-brand-navy-400 ml-1">
                    +{hour.products.length - 4}
                  </span>
                )}
                {hour.waterMl > 0 && (
                  <div className="w-7 h-7 rounded-lg bg-sky-100 flex items-center justify-center text-sky-600 text-xs font-bold">
                    💧
                  </div>
                )}
              </div>

              {/* Progress bars */}
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-[10px] text-brand-navy-500">Carbs</span>
                    <span className="text-[10px] text-brand-navy-400">
                      {hour.totals.carbs}g / {hourlyTargets.carbsGramsTarget}g
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-brand-navy-800 overflow-hidden">
                    <div
                      className={cn("h-full rounded-full transition-all", getStatusColor(carbsPercent))}
                      style={{ width: `${Math.min(100, carbsPercent)}%` }}
                    />
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-[10px] text-brand-navy-500">Fluid</span>
                    <span className="text-[10px] text-brand-navy-400">
                      {hour.totals.fluid}ml
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-brand-navy-800 overflow-hidden">
                    <div
                      className={cn("h-full rounded-full transition-all", getStatusColor(fluidPercent))}
                      style={{ width: `${Math.min(100, fluidPercent)}%` }}
                    />
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2 text-brand-navy-500">
              <Plus className="h-4 w-4" />
              <span className="text-sm">Tap to add products</span>
            </div>
          )}
        </div>

        {/* Arrow */}
        <ChevronRight className={cn(
          "h-5 w-5 flex-shrink-0 transition-colors",
          isSelected ? "text-brand-sky-400" : "text-brand-navy-600"
        )} />
      </div>
    </button>
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
