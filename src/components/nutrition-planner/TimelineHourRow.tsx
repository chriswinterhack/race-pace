"use client";

import { useDroppable } from "@dnd-kit/core";
import { Clock, Droplets, Plus, Minus, AlertTriangle, CheckCircle2, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { validateHourlyIntake, type HourlyTargets } from "@/lib/calculations";
import { ProductChip } from "./ProductCard";
import { useNutritionPlannerStore } from "@/stores/nutritionPlannerStore";
import type { TimelineHour, IntakeStatus } from "./types";

interface TimelineHourRowProps {
  hour: TimelineHour;
  hourIndex: number;
  hourlyTargets: HourlyTargets;
  isSelected: boolean;
  onSelect: () => void;
}

const STATUS_CONFIG = {
  "on-target": {
    icon: CheckCircle2,
    shadow: "shadow-md shadow-green-200/50",
    bg: "bg-gradient-to-r from-green-50 to-emerald-50",
    headerBg: "bg-green-100",
    text: "text-green-700",
    iconColor: "text-green-600",
  },
  below: {
    icon: TrendingUp,
    shadow: "shadow-md shadow-amber-200/50",
    bg: "bg-gradient-to-r from-amber-50 to-orange-50",
    headerBg: "bg-amber-100",
    text: "text-amber-700",
    iconColor: "text-amber-600",
  },
  above: {
    icon: AlertTriangle,
    shadow: "shadow-md shadow-red-200/50",
    bg: "bg-gradient-to-r from-red-50 to-rose-50",
    headerBg: "bg-red-100",
    text: "text-red-700",
    iconColor: "text-red-600",
  },
};

export function TimelineHourRow({
  hour,
  hourIndex,
  hourlyTargets,
  isSelected,
  onSelect,
}: TimelineHourRowProps) {
  const removeProductFromHour = useNutritionPlannerStore((s) => s.removeProductFromHour);
  const updateProductQuantity = useNutritionPlannerStore((s) => s.updateProductQuantity);
  const updateProductFluid = useNutritionPlannerStore((s) => s.updateProductFluid);
  const setHourWater = useNutritionPlannerStore((s) => s.setHourWater);

  const { isOver, setNodeRef } = useDroppable({
    id: `hour-${hour.hourNumber}`,
    data: {
      type: "hour",
      hourNumber: hour.hourNumber,
      hourIndex,
    },
  });

  const validation = validateHourlyIntake(
    {
      carbs: hour.totals.carbs,
      fluid: hour.totals.fluid,
      sodium: hour.totals.sodium,
    },
    hourlyTargets,
    true
  );

  const getOverallStatus = (): IntakeStatus => {
    if (validation.carbsStatus === "below" || validation.fluidStatus === "below") {
      return "below";
    }
    if (validation.carbsStatus === "above" || validation.fluidStatus === "above") {
      return "above";
    }
    return "on-target";
  };

  const overallStatus = getOverallStatus();
  const statusConfig = STATUS_CONFIG[overallStatus];
  const StatusIcon = statusConfig.icon;
  const hasProducts = hour.products.length > 0 || hour.waterMl > 0;

  return (
    <div
      ref={setNodeRef}
      onClick={onSelect}
      className={cn(
        "rounded-xl overflow-hidden transition-all duration-200",
        "cursor-pointer group",
        isOver && "ring-2 ring-brand-sky-400 ring-offset-2 scale-[1.01]",
        isSelected
          ? "shadow-lg shadow-brand-sky-200 ring-2 ring-brand-sky-400"
          : hasProducts
            ? cn(statusConfig.shadow, "hover:shadow-lg")
            : "bg-white shadow-sm hover:shadow-md border border-dashed border-brand-navy-200"
      )}
    >
      {/* Hour header */}
      <div
        className={cn(
          "flex items-center justify-between px-4 py-3",
          hasProducts ? statusConfig.headerBg : "bg-brand-navy-50"
        )}
      >
        <div className="flex items-center gap-3">
          {/* Hour number badge */}
          <div
            className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm",
              "shadow-sm",
              hasProducts
                ? "bg-brand-navy-900 text-white"
                : "bg-white text-brand-navy-600 border border-brand-navy-200"
            )}
          >
            {hour.hourNumber}
          </div>
          <div>
            <p className="text-sm font-semibold text-brand-navy-900">
              Hour {hour.hourNumber}
            </p>
            <p className="text-xs text-brand-navy-500 flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {hour.startTime} – {hour.endTime}
            </p>
          </div>
        </div>

        {/* Macro totals */}
        <div className="flex items-center gap-3">
          <MacroBadge
            label="Carbs"
            value={hour.totals.carbs}
            target={hourlyTargets.carbsGramsTarget}
            unit="g"
            status={validation.carbsStatus}
            color="amber"
          />
          <MacroBadge
            label="Fluid"
            value={hour.totals.fluid}
            target={hourlyTargets.fluidMlTarget}
            unit="ml"
            status={validation.fluidStatus}
            color="sky"
            icon={<Droplets className="h-3 w-3" />}
          />
          <MacroBadge
            label="Sodium"
            value={hour.totals.sodium}
            target={hourlyTargets.sodiumMgTarget}
            unit="mg"
            status={validation.sodiumStatus}
            color="purple"
          />

          {/* Status indicator */}
          {hasProducts && (
            <div className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center",
              statusConfig.bg,
              statusConfig.text
            )}>
              <StatusIcon className="h-4 w-4" />
            </div>
          )}
        </div>
      </div>

      {/* Products area */}
      <div
        className={cn(
          "p-4 min-h-[72px]",
          hasProducts ? statusConfig.bg : "bg-white"
        )}
      >
        {hour.products.length === 0 && hour.waterMl === 0 ? (
          <div
            className={cn(
              "flex items-center justify-center h-14 rounded-lg border-2 border-dashed",
              "transition-all duration-200",
              isOver
                ? "border-brand-sky-400 bg-brand-sky-50 text-brand-sky-600"
                : "border-brand-navy-200 text-brand-navy-400 group-hover:border-brand-navy-300"
            )}
          >
            <span className="text-sm font-medium">
              {isOver ? "Drop here to add" : "Drag products here"}
            </span>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {hour.products.map((item, idx) => (
              <ProductChip
                key={item.id}
                product={item.product}
                quantity={item.quantity}
                fluidMl={item.fluidMl ?? undefined}
                onQuantityChange={(qty) => updateProductQuantity(hourIndex, idx, qty)}
                onFluidChange={(ml) => updateProductFluid(hourIndex, idx, ml)}
                onRemove={() => removeProductFromHour(hourIndex, idx)}
              />
            ))}

            {hour.waterMl > 0 && (
              <WaterChip
                waterMl={hour.waterMl}
                onChange={(ml) => setHourWater(hourIndex, ml)}
              />
            )}
          </div>
        )}
      </div>

      {/* Validation warnings */}
      {validation.warnings.length > 0 && (
        <div className="px-4 pb-3">
          <div className="flex items-start gap-2 text-xs text-amber-800 bg-amber-50 rounded-lg px-3 py-2 border border-amber-200">
            <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5 text-amber-600" />
            <div className="space-y-0.5">
              {validation.warnings.map((w, i) => (
                <p key={i}>{w}</p>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Quick add water */}
      {hour.waterMl === 0 && (
        <div className={cn(
          "px-4 pb-3",
          hasProducts ? statusConfig.bg : "bg-white"
        )}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setHourWater(hourIndex, 500);
            }}
            className="flex items-center gap-1.5 text-xs font-medium text-brand-sky-600 hover:text-brand-sky-700 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            Add water
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * Compact badge showing a macro value vs target
 */
function MacroBadge({
  value,
  unit,
  target,
  color,
  icon,
}: {
  label: string;
  value: number;
  unit: string;
  target: number;
  status: IntakeStatus;
  color: "amber" | "sky" | "purple";
  icon?: React.ReactNode;
}) {
  const percent = Math.round((value / target) * 100);

  const colorClasses = {
    amber: {
      bg: "bg-amber-50",
      shadow: "shadow-sm shadow-amber-200/50",
      text: "text-amber-700",
      bar: "bg-amber-500",
    },
    sky: {
      bg: "bg-sky-50",
      shadow: "shadow-sm shadow-sky-200/50",
      text: "text-sky-700",
      bar: "bg-sky-500",
    },
    purple: {
      bg: "bg-purple-50",
      shadow: "shadow-sm shadow-purple-200/50",
      text: "text-purple-700",
      bar: "bg-purple-500",
    },
  };

  const c = colorClasses[color];

  return (
    <div
      className={cn(
        "relative px-3 py-1.5 rounded-lg text-xs font-medium tabular-nums",
        "overflow-hidden",
        c.bg,
        c.shadow,
        c.text
      )}
    >
      {/* Progress bar background */}
      <div
        className={cn("absolute inset-y-0 left-0 opacity-30 transition-all", c.bar)}
        style={{ width: `${Math.min(100, percent)}%` }}
      />

      {/* Content */}
      <div className="relative flex items-center gap-1">
        {icon}
        <span className="font-bold">{value}</span>
        <span className="opacity-70">{unit}</span>
        <span className="opacity-50">/ {target}</span>
      </div>
    </div>
  );
}

/**
 * Water intake chip with +/- controls
 */
function WaterChip({
  waterMl,
  onChange,
}: {
  waterMl: number;
  onChange: (ml: number) => void;
}) {
  return (
    <div className="inline-flex items-center gap-2 px-3 py-2.5 rounded-xl bg-gradient-to-r from-sky-50 to-cyan-50 shadow-md hover:shadow-lg transition-all duration-150">
      <div className="w-6 h-6 rounded-md bg-sky-100 flex items-center justify-center">
        <Droplets className="h-4 w-4 text-sky-600" />
      </div>

      <span className="font-semibold text-sky-800 tabular-nums text-sm">{waterMl}ml</span>

      <div className="flex items-center gap-1">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onChange(Math.max(0, waterMl - 100));
          }}
          className="w-6 h-6 flex items-center justify-center rounded-md bg-sky-100 hover:bg-sky-200 text-sky-700 transition-colors"
        >
          <Minus className="h-3 w-3" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onChange(waterMl + 100);
          }}
          className="w-6 h-6 flex items-center justify-center rounded-md bg-sky-100 hover:bg-sky-200 text-sky-700 transition-colors"
        >
          <Plus className="h-3 w-3" />
        </button>
      </div>

      <button
        onClick={(e) => {
          e.stopPropagation();
          onChange(0);
        }}
        className="w-6 h-6 flex items-center justify-center rounded-full text-sky-400 hover:bg-red-100 hover:text-red-600 transition-colors"
        aria-label="Remove water"
      >
        ×
      </button>
    </div>
  );
}
