"use client";

import { Zap, Droplets, Flame, Clock, Mountain, Thermometer, AlertTriangle, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNutritionPlannerStore, useRunningTotals } from "@/stores/nutritionPlannerStore";

interface NutritionTargetsProps {
  className?: string;
}

export function NutritionTargets({ className }: NutritionTargetsProps) {
  const hourlyTargets = useNutritionPlannerStore((s) => s.hourlyTargets);
  const totalTargets = useNutritionPlannerStore((s) => s.totalTargets);
  const raceDurationHours = useNutritionPlannerStore((s) => s.raceDurationHours);
  const maxElevationFt = useNutritionPlannerStore((s) => s.maxElevationFt);
  const temperatureF = useNutritionPlannerStore((s) => s.temperatureF);
  const humidity = useNutritionPlannerStore((s) => s.humidity);

  if (!hourlyTargets) {
    return null;
  }

  return (
    <div className={cn("rounded-xl bg-gradient-to-br from-brand-navy-900 to-brand-navy-800 p-4", className)}>
      {/* Header with race context */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white">Nutrition Targets</h2>
        <div className="flex items-center gap-3 text-sm text-brand-navy-300">
          <span className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            {raceDurationHours}h
          </span>
          <span className="flex items-center gap-1">
            <Mountain className="h-4 w-4" />
            {maxElevationFt.toLocaleString()}ft
          </span>
          <span className="flex items-center gap-1">
            <Thermometer className="h-4 w-4" />
            {temperatureF}°F · {humidity}%
          </span>
        </div>
      </div>

      {/* Hourly targets grid */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        <TargetCard
          icon={<Zap className="h-5 w-5" />}
          iconColor="text-amber-400"
          label="Carbs/Hour"
          value={`${hourlyTargets.carbsGramsTarget}g`}
          range={`${hourlyTargets.carbsGramsMin}-${hourlyTargets.carbsGramsMax}g`}
        />
        <TargetCard
          icon={<Droplets className="h-5 w-5" />}
          iconColor="text-sky-400"
          label="Fluid/Hour"
          value={`${hourlyTargets.fluidMlTarget}ml`}
          range={`${hourlyTargets.fluidMlMin}-${hourlyTargets.fluidMlMax}ml`}
        />
        <TargetCard
          icon={<span className="text-lg">🧂</span>}
          iconColor=""
          label="Sodium/Hour"
          value={`${hourlyTargets.sodiumMgTarget}mg`}
          range={`${hourlyTargets.sodiumMgMin}-${hourlyTargets.sodiumMgMax}mg`}
        />
        <TargetCard
          icon={<Flame className="h-5 w-5" />}
          iconColor="text-orange-400"
          label="Calories/Hour"
          value={`${hourlyTargets.caloriesTarget}`}
          range={null}
        />
      </div>

      {/* Race totals */}
      {totalTargets && (
        <div className="pt-3 border-t border-white/10">
          <p className="text-xs text-brand-navy-400 uppercase tracking-wider mb-2">
            Race Totals
          </p>
          <div className="flex items-center gap-6 text-sm">
            <span className="text-white">
              <span className="font-semibold">{totalTargets.carbs.toLocaleString()}g</span>
              <span className="text-brand-navy-400 ml-1">carbs</span>
            </span>
            <span className="text-white">
              <span className="font-semibold">{(totalTargets.fluid / 1000).toFixed(1)}L</span>
              <span className="text-brand-navy-400 ml-1">fluid</span>
            </span>
            <span className="text-white">
              <span className="font-semibold">{totalTargets.sodium.toLocaleString()}mg</span>
              <span className="text-brand-navy-400 ml-1">sodium</span>
            </span>
            <span className="text-white">
              <span className="font-semibold">{totalTargets.calories.toLocaleString()}</span>
              <span className="text-brand-navy-400 ml-1">cal</span>
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

function TargetCard({
  icon,
  iconColor,
  label,
  value,
  range,
}: {
  icon: React.ReactNode;
  iconColor: string;
  label: string;
  value: string;
  range: string | null;
}) {
  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-lg p-3 border border-white/10">
      <div className="flex items-center gap-2 mb-1">
        <span className={iconColor}>{icon}</span>
        <span className="text-xs text-brand-navy-300">{label}</span>
      </div>
      <p className="text-xl font-bold text-white tabular-nums">{value}</p>
      {range && (
        <p className="text-xs text-brand-navy-400 mt-0.5">{range}</p>
      )}
    </div>
  );
}

/**
 * Progress bar component showing running totals vs targets
 */
export function NutritionProgress({ className }: { className?: string }) {
  const totalTargets = useNutritionPlannerStore((s) => s.totalTargets);
  const runningTotals = useRunningTotals();

  if (!totalTargets) return null;

  const carbsPercent = Math.min(100, Math.round((runningTotals.carbs / totalTargets.carbs) * 100));
  const fluidPercent = Math.min(100, Math.round((runningTotals.fluid / totalTargets.fluid) * 100));
  const sodiumPercent = Math.min(100, Math.round((runningTotals.sodium / totalTargets.sodium) * 100));

  return (
    <div className={cn("rounded-xl bg-white border border-brand-navy-200 p-4", className)}>
      <h3 className="text-sm font-semibold text-brand-navy-700 mb-3">Running Totals</h3>

      <div className="space-y-3">
        <ProgressRow
          label="Carbs"
          current={runningTotals.carbs}
          target={totalTargets.carbs}
          unit="g"
          percent={carbsPercent}
          color="bg-amber-500"
        />
        <ProgressRow
          label="Fluid"
          current={runningTotals.fluid}
          target={totalTargets.fluid}
          unit="ml"
          percent={fluidPercent}
          color="bg-sky-500"
        />
        <ProgressRow
          label="Sodium"
          current={runningTotals.sodium}
          target={totalTargets.sodium}
          unit="mg"
          percent={sodiumPercent}
          color="bg-orange-500"
        />
      </div>
    </div>
  );
}

function ProgressRow({
  label,
  current,
  target,
  unit,
  percent,
  color,
}: {
  label: string;
  current: number;
  target: number;
  unit: string;
  percent: number;
  color: string;
}) {
  const status = percent < 70 ? "low" : percent <= 110 ? "good" : "high";

  return (
    <div>
      <div className="flex items-center justify-between text-sm mb-1">
        <span className="text-brand-navy-600">{label}</span>
        <span className="tabular-nums">
          <span className="font-semibold text-brand-navy-900">{current.toLocaleString()}</span>
          <span className="text-brand-navy-400"> / {target.toLocaleString()}{unit}</span>
          <span className={cn(
            "ml-2 font-medium",
            status === "low" && "text-red-600",
            status === "good" && "text-green-600",
            status === "high" && "text-amber-600"
          )}>
            ({percent}%)
          </span>
        </span>
      </div>
      <div className="h-2 bg-brand-navy-100 rounded-full overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-300", color)}
          style={{ width: `${Math.min(100, percent)}%` }}
        />
      </div>
    </div>
  );
}

/**
 * Warnings and recommendations display
 */
export function NutritionWarnings({ className }: { className?: string }) {
  const warnings = useNutritionPlannerStore((s) => s.warnings);
  const recommendations = useNutritionPlannerStore((s) => s.recommendations);

  if (warnings.length === 0 && recommendations.length === 0) {
    return null;
  }

  return (
    <div className={cn("space-y-3", className)}>
      {warnings.length > 0 && (
        <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <span className="text-sm font-medium text-amber-800">Warnings</span>
          </div>
          <ul className="space-y-1">
            {warnings.map((warning, i) => (
              <li key={i} className="text-sm text-amber-700 pl-6">
                • {warning}
              </li>
            ))}
          </ul>
        </div>
      )}

      {recommendations.length > 0 && (
        <div className="rounded-lg bg-green-50 border border-green-200 p-3">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium text-green-800">Tips</span>
          </div>
          <ul className="space-y-1">
            {recommendations.map((rec, i) => (
              <li key={i} className="text-sm text-green-700 pl-6">
                • {rec}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
